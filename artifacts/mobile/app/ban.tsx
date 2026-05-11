import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const BAN_KEY = "@sahara/ban_info_v1";

interface BanData {
  blockedUntil: string | null;
  isPermanent: boolean;
  blockReason: string | null;
  userEmail?: string;
  userName?: string;
}

function formatDuration(ban: BanData): string {
  if (ban.isPermanent || !ban.blockedUntil) return "स्थायी (Permanent) Ban";
  const until = new Date(ban.blockedUntil);
  const now = new Date();
  const diff = until.getTime() - now.getTime();
  if (diff <= 0) return "Ban अवधि समाप्त — दोबारा Login करें";
  const days = Math.ceil(diff / 86400000);
  if (days >= 365) return `${Math.floor(days / 365)} साल के लिए Ban`;
  if (days >= 30) return `${Math.floor(days / 30)} महीने के लिए Ban`;
  return `${days} दिन के लिए Ban`;
}

function formatDate(ban: BanData): string | null {
  if (!ban.blockedUntil || ban.isPermanent) return null;
  return new Date(ban.blockedUntil).toLocaleDateString("hi-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function BanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [ban, setBan] = useState<BanData | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(BAN_KEY).then((raw) => {
      if (raw) {
        try { setBan(JSON.parse(raw)); } catch { /**/ }
      }
    });
  }, []);

  function handleTryAgain() {
    if (!ban) return;
    if (ban.isPermanent) {
      Alert.alert("Permanent Ban", "यह ban स्थायी है। Appeal के लिए email करें:\nsaharaapphelp@gmail.com");
      return;
    }
    if (ban.blockedUntil) {
      const expiry = new Date(ban.blockedUntil);
      if (expiry <= new Date()) {
        AsyncStorage.removeItem(BAN_KEY);
        router.replace("/(tabs)/profile");
        return;
      }
    }
    Alert.alert("अभी भी Ban है", "Ban अभी समाप्त नहीं हुआ है। बाद में try करें या email करें:\nsaharaapphelp@gmail.com");
  }

  if (!ban) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.foreground }}>Loading...</Text>
      </View>
    );
  }

  const duration = formatDuration(ban);
  const untilDate = formatDate(ban);
  const firstName = ban.userName ? ban.userName.split(" ")[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Red gradient header */}
      <LinearGradient
        colors={["#1A0050", "#7C0000", "#DC2626"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 24, paddingBottom: 36, paddingHorizontal: 24, alignItems: "center" }}
      >
        <Text style={{ fontSize: 64, marginBottom: 12 }}>⛔</Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 }}>
          Account Ban कर दिया गया है
        </Text>
        {(ban.userEmail || ban.userName) ? (
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
            {ban.userEmail || ban.userName}
          </Text>
        ) : null}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {/* Duration card */}
        <View style={{ backgroundColor: "#FEF2F2", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#FECACA" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Feather name="clock" size={18} color="#DC2626" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>Ban की अवधि</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#7F1D1D" }}>{duration}</Text>
          {untilDate ? (
            <Text style={{ fontSize: 12, color: "#991B1B", marginTop: 4 }}>{untilDate} तक</Text>
          ) : null}
        </View>

        {/* Reason card */}
        {ban.blockReason ? (
          <View style={{ backgroundColor: "#FFF7ED", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#FED7AA" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Feather name="alert-triangle" size={16} color="#EA580C" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#EA580C" }}>कारण</Text>
            </View>
            <Text style={{ fontSize: 14, color: "#7C2D12", lineHeight: 22 }}>{ban.blockReason}</Text>
          </View>
        ) : null}

        {/* Sahara message */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Feather name="info" size={16} color="#7C3AED" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#7C3AED" }}>सहारा की तरफ से</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 22 }}>
            नमस्ते{firstName ? ` ${firstName}` : ""} जी,{"\n\n"}
            आपके account पर हमारी Community Guidelines का उल्लंघन पाया गया, जिसके कारण यह action लेना ज़रूरी हो गया।{"\n\n"}
            अगर आपको लगता है कि यह गलती से हुआ है, तो नीचे दिए email पर हमसे बात करें। हम हर appeal को ध्यान से सुनते हैं।
          </Text>
        </View>

        {/* Contact card */}
        <View style={{ backgroundColor: "#F0FDF4", borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: "#BBF7D0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="mail" size={16} color="#166534" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534" }}>सहायता के लिए Contact करें</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#15803D" }}>saharaapphelp@gmail.com</Text>
          <Text style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
            Subject में अपनी Sahara ID ज़रूर लिखें
          </Text>
        </View>

        {/* Try again button */}
        <TouchableOpacity
          onPress={handleTryAgain}
          style={{ backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 12 }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>🔄 दोबारा Check करें</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/profile")}
          style={{ paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>← वापस जाएं</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
