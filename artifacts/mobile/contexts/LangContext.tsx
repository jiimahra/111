import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Lang = "en" | "hi";

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LANG_KEY = "@sahara/lang_v1";

const translations: Record<string, Record<Lang, string>> = {
  home: { en: "Home", hi: "होम" },
  explore: { en: "Explore", hi: "खोजें" },
  post: { en: "Post", hi: "पोस्ट" },
  hospitals: { en: "Hospitals", hi: "अस्पताल" },
  aiHelp: { en: "AI Help", hi: "AI सहायता" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल" },
  together: { en: "Together we\nmake a difference", hi: "साथ मिलकर\nहम बदलाव लाते हैं" },
  subHero: { en: "साथ मिलकर हम बदलाव ला सकते हैं", hi: "Together we can make a difference" },
  searchPlaceholder: { en: "Search for help...", hi: "मदद खोजें..." },
  needHelp: { en: "Need Help", hi: "मदद चाहिए" },
  giveHelp: { en: "Give Help", hi: "मदद करना है" },
  categories: { en: "Categories", hi: "श्रेणियां" },
  recentRequests: { en: "Recent Requests", hi: "हाल की जरूरतें" },
  viewAll: { en: "View All", hi: "सभी देखें" },
  joinNow: { en: "Join Now", hi: "जुड़ें" },
  food: { en: "Food", hi: "भोजन" },
  medical: { en: "Medical", hi: "चिकित्सा" },
  job: { en: "Job", hi: "रोजगार" },
  animal: { en: "Animal", hi: "पशु" },
  education: { en: "Education", hi: "शिक्षा" },
  notifications: { en: "Notifications", hi: "सूचनाएं" },
  noNotifications: { en: "No new requests", hi: "कोई नई request नहीं" },
  newRequest: { en: "New request", hi: "नई request" },
  shareText: { en: "Share", hi: "शेयर" },
  close: { en: "Close", hi: "बंद करें" },
  requestHelp: { en: "Request Help", hi: "मदद मांगें" },
  offerHelp: { en: "Offer Help", hi: "मदद दें" },
};

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v === "hi" || v === "en") setLang(v);
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "hi" : "en";
      AsyncStorage.setItem(LANG_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string) => translations[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
