import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const BAN_KEY = "@sahara/ban_info_v1";

interface BanData {
  blockedUntil: string | null;
  isPermanent: boolean;
  blockReason: string | null;
  userEmail: string;
  userName: string;
}

function formatDuration(ban: BanData): string {
  if (ban.isPermanent || !ban.blockedUntil) return "स्थायी (Permanent) Ban";
  const diff = new Date(ban.blockedUntil).getTime() - Date.now();
  if (diff <= 0) return "Ban अवधि समाप्त — दोबारा Login करें";
  const days = Math.ceil(diff / 86400000);
  if (days >= 365) return `${Math.floor(days / 365)} साल के लिए Ban`;
  if (days >= 30) return `${Math.floor(days / 30)} महीने के लिए Ban`;
  return `${days} दिन के लिए Ban`;
}

function formatUntilDate(ban: BanData): string | null {
  if (!ban.blockedUntil || ban.isPermanent) return null;
  return new Date(ban.blockedUntil).toLocaleDateString("hi-IN", {
    day: "numeric", month: "long", year: "numeric",
  }) + " तक";
}

export default function BanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Primary: read from URL params (set by router.push with params)
  const params = useLocalSearchParams<{
    blockedUntil?: string;
    isPermanent?: string;
    blockReason?: string;
    userEmail?: string;
    userName?: string;
  }>();

  const [ban, setBan] = useState<BanData | null>(null);

  useEffect(() => {
    // Try URL params first (most reliable — set at navigation time)
    if (params.userEmail || params.isPermanent) {
      setBan({
        blockedUntil: params.blockedUntil || null,
        isPermanent: params.isPermanent === "1",
        blockReason: params.blockReason || null,
        userEmail: params.userEmail || "",
        userName: params.userName || "",
      });
      return;
    }
    // Fallback: read from AsyncStorage (for app restarts)
    AsyncStorage.getItem(BAN_KEY).then((raw) => {
      if (raw) {
        try { setBan(JSON.parse(raw)); } catch { /**/ }
      }
    });
  }, []);

  function handleTryAgain() {
    if (!ban) return;
    if (ban.isPermanent) {
      Alert.alert(
        "Permanent Ban",
        "यह ban स्थायी है। Appeal के लिए email करें:\nsaharaapphelp@gmail.com"
      );
      return;
    }
    if (ban.blockedUntil && new Date(ban.blockedUntil) > new Date()) {
      Alert.alert(
        "⛔ अभी भी Ban है",
        "Ban अभी समाप्त नहीं हुआ है।\n\nबाद में try करें या email करें:\nsaharaapphelp@gmail.com"
      );
      return;
    }
    // Ban expired — clear and go back
    void AsyncStorage.removeItem(BAN_KEY);
    router.replace("/(tabs)/profile");
  }

  function handleEmail() {
    void Linking.openURL("mailto:saharaapphelp@gmail.com?subject=Ban Appeal - Sahara App");
  }

  const loading = !ban;
  const duration = ban ? formatDuration(ban) : "";
  const untilDate = ban ? formatUntilDate(ban) : null;
  const firstName = ban?.userName ? ban.userName.split(" ")[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Hero gradient header ── */}
      <LinearGradient
        colors={["#1A0050", "#7C0000", "#DC2626"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 28,
          paddingBottom: 40,
          paddingHorizontal: 28,
          alignItems: "center",
        }}
      >
        <View style={{
          width: 90, height: 90, borderRadius: 45,
          backgroundColor: "rgba(255,255,255,0.15)",
          justifyContent: "center", alignItems: "center",
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 48 }}>⛔</Text>
        </View>

        <Text style={{
          fontSize: 22, fontWeight: "800", color: "#fff",
          textAlign: "center", marginBottom: 6, letterSpacing: 0.3,
        }}>
          Account Ban कर दिया गया है
        </Text>

        {loading ? null : (
          <View style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
            marginTop: 6,
          }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
              {ban?.userEmail || "सहारा उपयोगकर्ता"}
            </Text>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>लोड हो रहा है...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Ban Duration ── */}
          <View style={{
            backgroundColor: "#FEF2F2", borderRadius: 18, padding: 20,
            marginBottom: 14, borderWidth: 1.5, borderColor: "#FECACA",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center",
              }}>
                <Feather name="clock" size={16} color="#fff" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#DC2626", letterSpacing: 0.2 }}>
                Ban की अवधि
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#7F1D1D", marginBottom: 4 }}>
              {duration}
            </Text>
            {untilDate && (
              <Text style={{ fontSize: 13, color: "#991B1B", fontWeight: "500" }}>
                📅 {untilDate}
              </Text>
            )}
          </View>

          {/* ── Block Reason (if available) ── */}
          {ban?.blockReason ? (
            <View style={{
              backgroundColor: "#FFF7ED", borderRadius: 18, padding: 20,
              marginBottom: 14, borderWidth: 1.5, borderColor: "#FED7AA",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: "#EA580C", justifyContent: "center", alignItems: "center",
                }}>
                  <Feather name="alert-triangle" size={16} color="#fff" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#EA580C" }}>
                  Ban का कारण
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "#7C2D12", lineHeight: 22, fontWeight: "500" }}>
                {ban.blockReason}
              </Text>
            </View>
          ) : null}

          {/* ── Sahara's message ── */}
          <View style={{
            backgroundColor: colors.card, borderRadius: 18, padding: 20,
            marginBottom: 14, borderWidth: 1.5, borderColor: "#7C3AED33",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <LinearGradient
                colors={["#7C3AED", "#EC4899"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  width: 34, height: 34, borderRadius: 17,
                  justifyContent: "center", alignItems: "center",
                }}
              >
                <Feather name="message-circle" size={16} color="#fff" />
              </LinearGradient>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#7C3AED" }}>
                सहारा की तरफ से
              </Text>
            </View>

            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 24 }}>
              नमस्ते{firstName ? <Text style={{ fontWeight: "800" }}> {firstName}</Text> : null} जी,
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 24, marginTop: 10 }}>
              आपके account पर हमारी{" "}
              <Text style={{ fontWeight: "700", color: "#7C3AED" }}>Community Guidelines</Text>
              {" "}का उल्लंघन पाया गया है, जिसके कारण यह action लेना ज़रूरी हो गया।
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 24, marginTop: 10 }}>
              यह निर्णय सभी users की सुरक्षा और सहारा community की quality बनाए रखने के लिए लिया गया है।
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 24, marginTop: 10 }}>
              अगर आपको लगता है कि यह{" "}
              <Text style={{ fontWeight: "700" }}>गलती से हुआ है</Text>
              , तो नीचे दिए email पर हमसे संपर्क करें। हम हर appeal को ध्यान से सुनते हैं।
            </Text>
          </View>

          {/* ── Contact / Appeal ── */}
          <TouchableOpacity
            onPress={handleEmail}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#F0FDF4", borderRadius: 18, padding: 20,
              marginBottom: 20, borderWidth: 1.5, borderColor: "#BBF7D0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center",
              }}>
                <Feather name="mail" size={16} color="#fff" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#166534" }}>
                Appeal / सहायता
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#15803D", marginBottom: 4 }}>
              saharaapphelp@gmail.com
            </Text>
            <Text style={{ fontSize: 12, color: "#166534" }}>
              📌 Subject में "Ban Appeal" और अपनी Sahara ID ज़रूर लिखें
            </Text>
            <View style={{
              marginTop: 12, flexDirection: "row", alignItems: "center",
              gap: 6, backgroundColor: "#DCFCE7", borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start",
            }}>
              <Feather name="external-link" size={12} color="#16A34A" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#16A34A" }}>
                Email खोलें
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── Check again button ── */}
          <TouchableOpacity onPress={handleTryAgain} activeOpacity={0.85} style={{ marginBottom: 12 }}>
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <Feather name="refresh-cw" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                दोबारा Check करें
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/profile")}
            style={{ paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
              ← Login screen पर वापस जाएं
            </Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  );
}
