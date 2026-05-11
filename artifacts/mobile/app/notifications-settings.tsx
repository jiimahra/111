import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@sahara/notification_settings_v1";

interface NotifSettings {
  newRequests: boolean;
  chatMessages: boolean;
  statusUpdates: boolean;
  communityAlerts: boolean;
  appUpdates: boolean;
}

const DEFAULT_SETTINGS: NotifSettings = {
  newRequests: true,
  chatMessages: true,
  statusUpdates: true,
  communityAlerts: true,
  appUpdates: false,
};

type SettingKey = keyof NotifSettings;

interface SettingRow {
  key: SettingKey;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  title: string;
  titleHi: string;
  desc: string;
}

const SETTINGS_CONFIG: SettingRow[] = [
  {
    key: "newRequests",
    icon: "life-buoy",
    color: "#7C3AED",
    title: "New Help Requests",
    titleHi: "नई Help Requests",
    desc: "आपके area में नई help requests आने पर notify करें",
  },
  {
    key: "chatMessages",
    icon: "message-circle",
    color: "#EC4899",
    title: "Chat Messages",
    titleHi: "Chat सन्देश",
    desc: "कोई आपको message भेजे तो notification मिले",
  },
  {
    key: "statusUpdates",
    icon: "check-circle",
    color: "#22C55E",
    title: "Request Status Updates",
    titleHi: "Request की स्थिति",
    desc: "आपकी request का status बदलने पर notify करें",
  },
  {
    key: "communityAlerts",
    icon: "alert-triangle",
    color: "#FF6B00",
    title: "Community Alerts",
    titleHi: "Community अलर्ट",
    desc: "Emergency या ज़रूरी community updates के लिए",
  },
  {
    key: "appUpdates",
    icon: "download",
    color: "#6B7280",
    title: "App Updates & News",
    titleHi: "App अपडेट",
    desc: "नए features और Sahara news के बारे में जानें",
  },
];

export default function NotificationsSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "unknown">("unknown");

  useEffect(() => {
    void loadSettings();
    void checkPermission();
  }, []);

  async function loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as Partial<NotifSettings>) });
      }
    } catch {
    }
  }

  async function checkPermission() {
    if (Platform.OS === "web") {
      setPermissionStatus("unknown");
      return;
    }
    try {
      const Notifications = require("expo-notifications");
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status === "granted" ? "granted" : "denied");
    } catch {
      setPermissionStatus("unknown");
    }
  }

  async function requestPermission() {
    if (Platform.OS === "web") return;
    try {
      const Notifications = require("expo-notifications");
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status === "granted" ? "granted" : "denied");
      if (status === "granted") {
        Alert.alert("✅ हो गया!", "Notifications enable हो गई हैं।");
      } else {
        Alert.alert(
          "Permission नहीं मिली",
          "Phone Settings → Sahara → Notifications से manually enable करें।"
        );
      }
    } catch {
    }
  }

  async function toggle(key: SettingKey) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
    }
  }

  async function enableAll() {
    const updated: NotifSettings = { newRequests: true, chatMessages: true, statusUpdates: true, communityAlerts: true, appUpdates: true };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function disableAll() {
    Alert.alert(
      "सभी Notifications बंद करें?",
      "क्या आप सच में सभी notifications बंद करना चाहते हैं?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "हाँ, बंद करें",
          style: "destructive",
          onPress: async () => {
            const updated: NotifSettings = { newRequests: false, chatMessages: false, statusUpdates: false, communityAlerts: false, appUpdates: false };
            setSettings(updated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  }

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1A0050", "#7C3AED", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 0 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>Notifications</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>सूचनाएं प्रबंधित करें</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="bell" size={22} color="#fff" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
              {enabledCount} / {SETTINGS_CONFIG.length} notifications enabled
            </Text>
          </View>
          <TouchableOpacity onPress={enableAll} style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>सब चालू</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={disableAll} style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" }}>सब बंद</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Banner */}
        {permissionStatus === "denied" && (
          <TouchableOpacity
            onPress={requestPermission}
            style={{ backgroundColor: "#FEF3C7", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#FDE68A", flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#F59E0B20", alignItems: "center", justifyContent: "center" }}>
              <Feather name="alert-triangle" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400E" }}>Notifications बंद हैं</Text>
              <Text style={{ fontSize: 12, color: "#B45309", marginTop: 2 }}>Phone permission चाहिए — यहाँ tap करें</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#D97706" />
          </TouchableOpacity>
        )}

        {permissionStatus === "granted" && (
          <View style={{ backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Feather name="check-circle" size={18} color="#16A34A" />
            <Text style={{ fontSize: 13, color: "#166534", fontWeight: "600" }}>Notifications की permission मिली हुई है ✓</Text>
          </View>
        )}

        {/* Toggles */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 14 }}>
          {SETTINGS_CONFIG.map((item, i) => (
            <View
              key={item.key}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.color + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name={item.icon} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: item.color, fontWeight: "600" }}>{item.titleHi}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}>{item.desc}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => void toggle(item.key)}
                trackColor={{ false: "#E5E7EB", true: item.color }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="info" size={14} color="#7C3AED" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#7C3AED" }}>ध्यान दें</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
            • ये settings आपके इस device पर save होती हैं।{"\n"}
            • अगर phone की notification permission बंद है, तो ये settings काम नहीं करेंगी।{"\n"}
            • Emergency community alerts को disable करने पर ज़रूरी जानकारी miss हो सकती है।
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
