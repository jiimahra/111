import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type HelpCategory = "food" | "medical" | "job" | "animal" | "education";
export type HelpType = "need_help" | "give_help";
export type RequestStatus = "active" | "inprogress" | "resolved";

export interface HelpRequest {
  id: string;
  category: HelpCategory;
  helpType: HelpType;
  title: string;
  description: string;
  location: string;
  status: RequestStatus;
  timestamp: number;
  postedBy: string;
  contactPhone?: string;
  userId?: string;
  mediaUrls?: string[];
  isAnonymous?: boolean;
}

export interface UserProfile {
  id: string;
  saharaId: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  helpedCount: number;
  requestsPosted: number;
  photoUri?: string;
  photoUrl?: string;
}

export interface BanInfo {
  blockedUntil: string | null;
  isPermanent: boolean;
  blockReason: string | null;
  userName?: string;
  userEmail?: string;
}

interface AppContextType {
  requests: HelpRequest[];
  profile: UserProfile;
  banInfo: BanInfo | null;
  addRequest: (data: Omit<HelpRequest, "id" | "timestamp" | "status">) => Promise<void>;
  resolveRequest: (id: string) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setAuthedProfile: (user: { id: string; saharaId: string; name: string; email: string; phone: string; location: string; photoUrl?: string | null }) => void;
  setBanInfo: (info: BanInfo | null) => void;
  logout: () => void;
  loading: boolean;
  refreshRequests: () => Promise<void>;
}

const PROFILE_KEY = "@sahara/profile_v2";
const BAN_KEY = "@sahara/ban_info_v1";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

const DEFAULT_PROFILE: UserProfile = {
  id: "",
  saharaId: "",
  name: "",
  phone: "",
  email: "",
  location: "Ajmer",
  helpedCount: 0,
  requestsPosted: 0,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [banInfo, setBanInfoState] = useState<BanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/requests`);
      if (!res.ok) return;
      const data = await res.json() as { requests: HelpRequest[] };
      setRequests(data.requests);
    } catch {
    }
  }, []);

  // ── Block status poll ───────────────────────────────────────────────────────
  const checkBlockStatus = useCallback(async (userId: string, userName: string, userEmail: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me?userId=${userId}`);
      if (res.status === 403) {
        const data = await res.json() as {
          error: string;
          blockedUntil?: string | null;
          isPermanent?: boolean;
          blockReason?: string | null;
        };
        if (data.error === "account_blocked") {
          const ban: BanInfo = {
            blockedUntil: data.blockedUntil ?? null,
            isPermanent: data.isPermanent ?? false,
            blockReason: data.blockReason ?? null,
            userName,
            userEmail,
          };
          // Save ban info persistently
          void AsyncStorage.setItem(BAN_KEY, JSON.stringify(ban));
          // Force logout and navigate to ban screen
          setBanInfoState(ban);
          setProfile(DEFAULT_PROFILE);
          void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
          try { router.push("/ban"); } catch { /**/ }
        }
      }
    } catch {
      // Network error — don't logout, just retry next poll
    }
  }, []);

  // Start/stop polling based on login state
  const startPolling = useCallback((userId: string, userName: string, userEmail: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    // Poll every 60 seconds
    pollIntervalRef.current = setInterval(() => {
      void checkBlockStatus(userId, userName, userEmail);
    }, 60_000);
  }, [checkBlockStatus]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
    return () => stopPolling();
  }, []);

  // Start/stop polling when profile.id changes
  useEffect(() => {
    if (profile.id) {
      startPolling(profile.id, profile.name, profile.email);
    } else {
      stopPolling();
    }
  }, [profile.id, profile.name, profile.email, startPolling, stopPolling]);

  const loadData = async () => {
    try {
      // Load ban info from storage
      const banStr = await AsyncStorage.getItem(BAN_KEY);
      if (banStr) {
        const saved = JSON.parse(banStr) as BanInfo;
        // Check if ban has expired
        if (!saved.isPermanent && saved.blockedUntil) {
          const expiry = new Date(saved.blockedUntil);
          if (expiry > new Date()) {
            setBanInfoState(saved);
          } else {
            // Ban expired — clear it
            void AsyncStorage.removeItem(BAN_KEY);
          }
        } else if (saved.isPermanent) {
          setBanInfoState(saved);
        }
      }

      const profileStr = await AsyncStorage.getItem(PROFILE_KEY);
      if (profileStr) {
        const cached = JSON.parse(profileStr) as UserProfile;
        setProfile(cached);
        if (cached.id) {
          try {
            const res = await fetch(`${API_BASE}/api/auth/me?userId=${cached.id}`);
            if (res.ok) {
              const { user } = await res.json() as { user: { id: string; saharaId: string; name: string; email: string; phone: string; location: string; photoUrl?: string | null } };
              const refreshed: UserProfile = {
                ...cached,
                name: user.name,
                email: user.email,
                phone: user.phone ?? cached.phone,
                location: user.location ?? cached.location,
                photoUrl: user.photoUrl ?? undefined,
                photoUri: user.photoUrl ?? undefined,
              };
              setProfile(refreshed);
              void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(refreshed));
            } else if (res.status === 403) {
              // Blocked while loading — treat like block poll
              const data = await res.json() as { error: string; blockedUntil?: string | null; isPermanent?: boolean; blockReason?: string | null };
              if (data.error === "account_blocked") {
                const ban: BanInfo = {
                  blockedUntil: data.blockedUntil ?? null,
                  isPermanent: data.isPermanent ?? false,
                  blockReason: data.blockReason ?? null,
                  userName: cached.name,
                  userEmail: cached.email,
                };
                void AsyncStorage.setItem(BAN_KEY, JSON.stringify(ban));
                setBanInfoState(ban);
                setProfile(DEFAULT_PROFILE);
                void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
                try { router.push("/ban"); } catch { /**/ }
              }
            }
          } catch {
          }
        }
      }
      await fetchRequests();
    } catch {
      await fetchRequests();
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  }, []);

  const setBanInfo = useCallback((info: BanInfo | null) => {
    setBanInfoState(info);
    if (info) {
      void AsyncStorage.setItem(BAN_KEY, JSON.stringify(info));
    } else {
      void AsyncStorage.removeItem(BAN_KEY);
    }
  }, []);

  const addRequest = useCallback(
    async (data: Omit<HelpRequest, "id" | "timestamp" | "status">) => {
      try {
        const res = await fetch(`${API_BASE}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            userId: data.isAnonymous ? undefined : (profile.id || undefined),
          }),
        });
        if (!res.ok) throw new Error("API error");
        const json = await res.json() as { request: HelpRequest };
        setRequests((prev) => [json.request, ...prev]);
        const newProfile = { ...profile, requestsPosted: profile.requestsPosted + 1 };
        setProfile(newProfile);
        void saveProfile(newProfile);
      } catch {
        throw new Error("Failed to post request. Please try again.");
      }
    },
    [profile, saveProfile]
  );

  const resolveRequest = useCallback(
    (id: string) => {
      void fetch(`${API_BASE}/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "resolved" as RequestStatus } : r))
      );
      const newProfile = { ...profile, helpedCount: profile.helpedCount + 1 };
      setProfile(newProfile);
      void saveProfile(newProfile);
    },
    [profile, saveProfile]
  );

  const updateRequestStatus = useCallback(
    (id: string, status: RequestStatus) => {
      void fetch(`${API_BASE}/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    },
    []
  );

  const deleteRequest = useCallback(
    (id: string) => {
      void fetch(`${API_BASE}/api/requests/${id}`, { method: "DELETE" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      const newProfile = { ...profile, ...updates };
      setProfile(newProfile);
      void saveProfile(newProfile);
    },
    [profile, saveProfile]
  );

  const setAuthedProfile = useCallback(
    (user: { id: string; saharaId: string; name: string; email: string; phone: string; location: string; photoUrl?: string | null }) => {
      const newProfile: UserProfile = {
        id: user.id,
        saharaId: user.saharaId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location || "Ajmer",
        helpedCount: profile.helpedCount,
        requestsPosted: profile.requestsPosted,
        photoUrl: user.photoUrl ?? undefined,
        photoUri: user.photoUrl ?? undefined,
      };
      setProfile(newProfile);
      void saveProfile(newProfile);
      // Clear any old ban info on successful login
      setBanInfoState(null);
      void AsyncStorage.removeItem(BAN_KEY);
    },
    [profile.helpedCount, profile.requestsPosted, saveProfile]
  );

  const logout = useCallback(() => {
    stopPolling();
    setProfile(DEFAULT_PROFILE);
    void saveProfile(DEFAULT_PROFILE);
    // Don't clear banInfo on logout — keep it so ban screen shows
  }, [saveProfile, stopPolling]);

  return (
    <AppContext.Provider
      value={{
        requests,
        profile,
        banInfo,
        addRequest,
        resolveRequest,
        updateRequestStatus,
        deleteRequest,
        updateProfile,
        setAuthedProfile,
        setBanInfo,
        logout,
        loading,
        refreshRequests: fetchRequests,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
