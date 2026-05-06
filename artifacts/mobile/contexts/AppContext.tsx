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
}

interface AppContextType {
  requests: HelpRequest[];
  profile: UserProfile;
  addRequest: (data: Omit<HelpRequest, "id" | "timestamp" | "status">) => void;
  resolveRequest: (id: string) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setAuthedProfile: (user: { id: string; saharaId: string; name: string; email: string; phone: string; location: string }) => void;
  logout: () => void;
  loading: boolean;
}

const REQUESTS_KEY = "@sahara/requests_v2";
const PROFILE_KEY = "@sahara/profile_v2";

const SEED_REQUESTS: HelpRequest[] = [
  {
    id: "1",
    category: "medical",
    helpType: "need_help",
    title: "Elderly man needs hospital help",
    description:
      "An elderly man near Ajmer Bus Stand needs help getting to the hospital. He has no family nearby and cannot travel alone.",
    location: "Ajmer Bus Stand, Ajmer",
    status: "active",
    timestamp: Date.now() - 20 * 60 * 1000,
    postedBy: "Ramesh Kumar",
    contactPhone: "9876543210",
  },
  {
    id: "2",
    category: "food",
    helpType: "need_help",
    title: "Family of 4 needs food support",
    description:
      "A family with 2 small children has not eaten for 2 days. Father lost job recently. Need food items or home cooked meals urgently.",
    location: "Vaishali Nagar, Ajmer",
    status: "active",
    timestamp: Date.now() - 45 * 60 * 1000,
    postedBy: "Sunita Devi",
  },
  {
    id: "3",
    category: "animal",
    helpType: "need_help",
    title: "Injured dog near railway station",
    description:
      "A dog was hit by a vehicle near Ajmer railway station. Needs immediate veterinary care. Cannot walk.",
    location: "Ajmer Railway Station",
    status: "active",
    timestamp: Date.now() - 1.5 * 60 * 60 * 1000,
    postedBy: "Priya Sharma",
    contactPhone: "9012345678",
  },
  {
    id: "4",
    category: "job",
    helpType: "give_help",
    title: "Offering 2 jobs at my shop",
    description:
      "I have a general store and need 2 helpers. No experience needed. Good salary. Prefer local candidates from Ajmer.",
    location: "Dargah Bazaar, Ajmer",
    status: "active",
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    postedBy: "Mohammed Aslam",
    contactPhone: "9123456789",
  },
  {
    id: "5",
    category: "education",
    helpType: "give_help",
    title: "Free tuition for class 6-10 students",
    description:
      "I am offering free tuition for students from poor families. Subjects: Maths, Science, Hindi. Classes on weekends.",
    location: "Pushkar Road, Ajmer",
    status: "active",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    postedBy: "Kavita Joshi",
  },
  {
    id: "6",
    category: "food",
    helpType: "give_help",
    title: "Free langar every Sunday",
    description:
      "We serve free food (langar) every Sunday at 1pm. Everyone is welcome. We can feed up to 100 people. Come and bring others.",
    location: "Naya Bazaar Gurudwara, Ajmer",
    status: "active",
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    postedBy: "Gurpreet Singh",
  },
];

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

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsStr, profileStr] = await Promise.all([
        AsyncStorage.getItem(REQUESTS_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);
      setRequests(requestsStr ? JSON.parse(requestsStr) : SEED_REQUESTS);
      setProfile(profileStr ? JSON.parse(profileStr) : DEFAULT_PROFILE);
    } catch {
      setRequests(SEED_REQUESTS);
    } finally {
      setLoading(false);
    }
  };

  const saveRequests = useCallback(async (newRequests: HelpRequest[]) => {
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(newRequests));
  }, []);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  }, []);

  const addRequest = useCallback(
    (data: Omit<HelpRequest, "id" | "timestamp" | "status">) => {
      const newRequest: HelpRequest = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        status: "active",
      };
      const updated = [newRequest, ...requests];
      setRequests(updated);
      saveRequests(updated);
      const newProfile = { ...profile, requestsPosted: profile.requestsPosted + 1 };
      setProfile(newProfile);
      saveProfile(newProfile);
    },
    [requests, profile, saveRequests, saveProfile]
  );

  const resolveRequest = useCallback(
    (id: string) => {
      const updated = requests.map((r) =>
        r.id === id ? { ...r, status: "resolved" as RequestStatus } : r
      );
      setRequests(updated);
      saveRequests(updated);
      const newProfile = { ...profile, helpedCount: profile.helpedCount + 1 };
      setProfile(newProfile);
      saveProfile(newProfile);
    },
    [requests, profile, saveRequests, saveProfile]
  );

  const updateRequestStatus = useCallback(
    (id: string, status: RequestStatus) => {
      const updated = requests.map((r) =>
        r.id === id ? { ...r, status } : r
      );
      setRequests(updated);
      saveRequests(updated);
    },
    [requests, saveRequests]
  );

  const deleteRequest = useCallback(
    (id: string) => {
      const updated = requests.filter((r) => r.id !== id);
      setRequests(updated);
      saveRequests(updated);
    },
    [requests, saveRequests]
  );

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      const newProfile = { ...profile, ...updates };
      setProfile(newProfile);
      saveProfile(newProfile);
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
      saveProfile(newProfile);
    },
    [profile.helpedCount, profile.requestsPosted, saveProfile]
  );

  const logout = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    saveProfile(DEFAULT_PROFILE);
  }, [saveProfile]);

  return (
    <AppContext.Provider
      value={{ requests, profile, addRequest, resolveRequest, updateRequestStatus, deleteRequest, updateProfile, setAuthedProfile, logout, loading }}
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
