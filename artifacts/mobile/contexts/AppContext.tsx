import AsyncStorage from "@react-native-async-storage/async-storage";
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
}

interface AppContextType {
  requests: HelpRequest[];
  profile: UserProfile;
  addRequest: (data: Omit<HelpRequest, "id" | "timestamp" | "status">) => Promise<void>;
  resolveRequest: (id: string) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setAuthedProfile: (user: { id: string; saharaId: string; name: string; email: string; phone: string; location: string }) => void;
  logout: () => void;
  loading: boolean;
  refreshRequests: () => Promise<void>;
}

const PROFILE_KEY = "@sahara/profile_v2";

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
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/requests`);
      if (!res.ok) return;
      const data = await res.json() as { requests: HelpRequest[] };
      setRequests(data.requests);
    } catch {
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profileStr = await AsyncStorage.getItem(PROFILE_KEY);
      if (profileStr) setProfile(JSON.parse(profileStr) as UserProfile);
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

  const addRequest = useCallback(
    async (data: Omit<HelpRequest, "id" | "timestamp" | "status">) => {
      try {
        const res = await fetch(`${API_BASE}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            userId: profile.id || undefined,
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
    (user: { id: string; saharaId: string; name: string; email: string; phone: string; location: string }) => {
      const newProfile: UserProfile = {
        id: user.id,
        saharaId: user.saharaId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location || "Ajmer",
        helpedCount: profile.helpedCount,
        requestsPosted: profile.requestsPosted,
      };
      setProfile(newProfile);
      void saveProfile(newProfile);
    },
    [profile.helpedCount, profile.requestsPosted, saveProfile]
  );

  const logout = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    void saveProfile(DEFAULT_PROFILE);
  }, [saveProfile]);

  return (
    <AppContext.Provider
      value={{
        requests,
        profile,
        addRequest,
        resolveRequest,
        updateRequestStatus,
        deleteRequest,
        updateProfile,
        setAuthedProfile,
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
