import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type CaseType = "human" | "animal";
export type UrgencyLevel = "critical" | "high" | "medium" | "low";
export type CaseStatus = "active" | "inprogress" | "resolved";

export interface EmergencyCase {
  id: string;
  type: CaseType;
  title: string;
  description: string;
  location: string;
  urgency: UrgencyLevel;
  status: CaseStatus;
  timestamp: number;
  reportedBy: string;
  volunteersNeeded: number;
  volunteersResponded: number;
  donationsGoal?: number;
  donationsReceived: number;
  respondedBy: string[];
}

export interface Donation {
  id: string;
  caseId: string;
  caseTitle: string;
  amount: number;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  location: string;
  isVolunteerActive: boolean;
  casesHelped: number;
  totalDonated: number;
}

interface AppContextType {
  cases: EmergencyCase[];
  donations: Donation[];
  profile: UserProfile;
  addCase: (
    data: Omit<
      EmergencyCase,
      | "id"
      | "timestamp"
      | "volunteersResponded"
      | "donationsReceived"
      | "respondedBy"
      | "status"
    >
  ) => void;
  respondToCase: (caseId: string) => void;
  addDonation: (caseId: string, caseTitle: string, amount: number) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toggleVolunteer: () => void;
  loading: boolean;
}

const CASES_KEY = "@sahara/cases";
const DONATIONS_KEY = "@sahara/donations";
const PROFILE_KEY = "@sahara/profile";

const SEED_CASES: EmergencyCase[] = [
  {
    id: "1",
    type: "animal",
    title: "Injured dog near Connaught Place",
    description:
      "A dog was hit by a vehicle and is lying injured near the main roundabout. Needs immediate veterinary care and transport to the nearest clinic.",
    location: "Connaught Place, New Delhi",
    urgency: "high",
    status: "active",
    timestamp: Date.now() - 30 * 60 * 1000,
    reportedBy: "Rahul Sharma",
    volunteersNeeded: 2,
    volunteersResponded: 1,
    donationsGoal: 5000,
    donationsReceived: 1500,
    respondedBy: [],
  },
  {
    id: "2",
    type: "human",
    title: "Elderly woman needs medical aid",
    description:
      "An elderly woman collapsed near Lajpat Nagar market. She is conscious but cannot walk. Ambulance called, volunteer companion needed to stay with her.",
    location: "Lajpat Nagar, New Delhi",
    urgency: "critical",
    status: "active",
    timestamp: Date.now() - 15 * 60 * 1000,
    reportedBy: "Priya Verma",
    volunteersNeeded: 3,
    volunteersResponded: 1,
    donationsReceived: 0,
    respondedBy: [],
  },
  {
    id: "3",
    type: "animal",
    title: "Stray cats colony needs food",
    description:
      "A colony of 12 stray cats near Sarojini Nagar has not been fed in 3 days. Donations needed for food and medical checkup for the entire colony.",
    location: "Sarojini Nagar, New Delhi",
    urgency: "medium",
    status: "active",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    reportedBy: "Anita Gupta",
    volunteersNeeded: 1,
    volunteersResponded: 0,
    donationsGoal: 3000,
    donationsReceived: 800,
    respondedBy: [],
  },
  {
    id: "4",
    type: "human",
    title: "Family displaced by fire",
    description:
      "A family of 5 lost their home in a fire last night. They urgently need emergency shelter, clothes, food, and support to get back on their feet.",
    location: "Govindpuri, New Delhi",
    urgency: "critical",
    status: "inprogress",
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
    reportedBy: "Vikram Singh",
    volunteersNeeded: 5,
    volunteersResponded: 3,
    donationsGoal: 15000,
    donationsReceived: 8500,
    respondedBy: [],
  },
  {
    id: "5",
    type: "animal",
    title: "Paralyzed dog needs rescue",
    description:
      "A dog with paralyzed hind legs was abandoned near Nehru Place metro station. Requires urgent foster care, regular treatment, and physiotherapy.",
    location: "Nehru Place, New Delhi",
    urgency: "high",
    status: "active",
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    reportedBy: "Sunita Devi",
    volunteersNeeded: 2,
    volunteersResponded: 0,
    donationsGoal: 8000,
    donationsReceived: 2200,
    respondedBy: [],
  },
];

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  phone: "",
  location: "New Delhi",
  isVolunteerActive: false,
  casesHelped: 0,
  totalDonated: 0,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
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
      const [casesStr, donationsStr, profileStr] = await Promise.all([
        AsyncStorage.getItem(CASES_KEY),
        AsyncStorage.getItem(DONATIONS_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);
      setCases(casesStr ? JSON.parse(casesStr) : SEED_CASES);
      setDonations(donationsStr ? JSON.parse(donationsStr) : []);
      setProfile(profileStr ? JSON.parse(profileStr) : DEFAULT_PROFILE);
    } catch {
      setCases(SEED_CASES);
    } finally {
      setLoading(false);
    }
  };

  const saveCases = useCallback(async (newCases: EmergencyCase[]) => {
    await AsyncStorage.setItem(CASES_KEY, JSON.stringify(newCases));
  }, []);

  const saveDonations = useCallback(async (newDonations: Donation[]) => {
    await AsyncStorage.setItem(DONATIONS_KEY, JSON.stringify(newDonations));
  }, []);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  }, []);

  const addCase = useCallback(
    (
      data: Omit<
        EmergencyCase,
        | "id"
        | "timestamp"
        | "volunteersResponded"
        | "donationsReceived"
        | "respondedBy"
        | "status"
      >
    ) => {
      const newCase: EmergencyCase = {
        ...data,
        id:
          Date.now().toString() + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        status: "active",
        volunteersResponded: 0,
        donationsReceived: 0,
        respondedBy: [],
      };
      const updated = [newCase, ...cases];
      setCases(updated);
      saveCases(updated);
    },
    [cases, saveCases]
  );

  const respondToCase = useCallback(
    (caseId: string) => {
      const respondingName = profile.name || "Volunteer";
      const updated = cases.map((c) => {
        if (c.id === caseId && !c.respondedBy.includes(respondingName)) {
          const newResponded = c.volunteersResponded + 1;
          return {
            ...c,
            volunteersResponded: newResponded,
            respondedBy: [...c.respondedBy, respondingName],
            status: (
              newResponded >= c.volunteersNeeded ? "inprogress" : c.status
            ) as CaseStatus,
          };
        }
        return c;
      });
      setCases(updated);
      saveCases(updated);
      const newProfile = {
        ...profile,
        casesHelped: profile.casesHelped + 1,
      };
      setProfile(newProfile);
      saveProfile(newProfile);
    },
    [cases, profile, saveCases, saveProfile]
  );

  const addDonation = useCallback(
    (caseId: string, caseTitle: string, amount: number) => {
      const donation: Donation = {
        id:
          Date.now().toString() + Math.random().toString(36).substring(2, 7),
        caseId,
        caseTitle,
        amount,
        timestamp: Date.now(),
      };
      const newDonations = [donation, ...donations];
      setDonations(newDonations);
      saveDonations(newDonations);
      const updatedCases = cases.map((c) =>
        c.id === caseId
          ? { ...c, donationsReceived: c.donationsReceived + amount }
          : c
      );
      setCases(updatedCases);
      saveCases(updatedCases);
      const newProfile = {
        ...profile,
        totalDonated: profile.totalDonated + amount,
      };
      setProfile(newProfile);
      saveProfile(newProfile);
    },
    [donations, cases, profile, saveDonations, saveCases, saveProfile]
  );

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      const newProfile = { ...profile, ...updates };
      setProfile(newProfile);
      saveProfile(newProfile);
    },
    [profile, saveProfile]
  );

  const toggleVolunteer = useCallback(() => {
    const newProfile = {
      ...profile,
      isVolunteerActive: !profile.isVolunteerActive,
    };
    setProfile(newProfile);
    saveProfile(newProfile);
  }, [profile, saveProfile]);

  return (
    <AppContext.Provider
      value={{
        cases,
        donations,
        profile,
        addCase,
        respondToCase,
        addDonation,
        updateProfile,
        toggleVolunteer,
        loading,
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
