import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BanInfo, HelpRequest, RequestStatus, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { authApi } from "@/lib/auth";

// ─── Ban Screen ──────────────────────────────────────────────────────────────
function BanScreen({ ban, onTryAgain }: { ban: BanInfo; onTryAgain: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  function formatBanTime() {
    if (ban.isPermanent || !ban.blockedUntil) return null;
    const until = new Date(ban.blockedUntil);
    const now = new Date();
    const diffMs = until.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days >= 365) return `${Math.floor(days / 365)} साल`;
    if (days >= 30) return `${Math.floor(days / 30)} महीने`;
    return `${days} दिन`;
  }

  const timeLeft = formatBanTime();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1A0050", "#7C0000", "#DC2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 20, paddingBottom: 32, paddingHorizontal: 20, alignItems: "center" }}
      >
        <Text style={{ fontSize: 56, marginBottom: 12 }}>⛔</Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 6 }}>
          Account Ban कर दिया गया है
        </Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
          {ban.userEmail || ban.userName || ""}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {/* Ban Duration */}
        <View style={{ backgroundColor: "#FEF2F2", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#FECACA" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Feather name="clock" size={18} color="#DC2626" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>Ban की अवधि</Text>
          </View>
          {ban.isPermanent ? (
            <Text style={{ fontSize: 16, color: "#7F1D1D", fontWeight: "700" }}>
              स्थायी (Permanent) Ban
            </Text>
          ) : (
            <>
              <Text style={{ fontSize: 16, color: "#7F1D1D", fontWeight: "700" }}>
                {timeLeft ? `${timeLeft} के लिए Ban` : "अवधि समाप्त — दोबारा login करें"}
              </Text>
              {ban.blockedUntil && (
                <Text style={{ fontSize: 12, color: "#991B1B", marginTop: 4 }}>
                  {new Date(ban.blockedUntil).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })} तक
                </Text>
              )}
            </>
          )}
        </View>

        {/* Reason */}
        {ban.blockReason && (
          <View style={{ backgroundColor: "#FFF7ED", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#FED7AA" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Feather name="alert-triangle" size={16} color="#EA580C" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#EA580C" }}>कारण</Text>
            </View>
            <Text style={{ fontSize: 14, color: "#7C2D12", lineHeight: 20 }}>{ban.blockReason}</Text>
          </View>
        )}

        {/* Our message */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Feather name="info" size={16} color="#7C3AED" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#7C3AED" }}>सहारा की तरफ से</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
            नमस्ते{ban.userName ? ` ${ban.userName.split(" ")[0]}` : ""} जी,{"\n\n"}
            आपके account पर हमारी Community Guidelines का उल्लंघन पाया गया, जिसके कारण यह action लेना ज़रूरी हो गया। यह निर्णय सभी users की सुरक्षा और app की quality बनाए रखने के लिए लिया गया है।{"\n\n"}
            अगर आपको लगता है कि यह गलती से हुआ है या आप अपना पक्ष रखना चाहते हैं, तो नीचे दिए email पर हमसे बात करें। हम हर appeal को ध्यान से सुनते हैं।
          </Text>
        </View>

        {/* Contact */}
        <View style={{ backgroundColor: "#F0FDF4", borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: "#BBF7D0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="mail" size={16} color="#166534" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534" }}>सहायता के लिए Contact करें</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#15803D" }}>saharaapphelp@gmail.com</Text>
          <Text style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
            Subject में अपनी Sahara ID ज़रूर लिखें
          </Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
          onPress={onTryAgain}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>दोबारा Check करें</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const CATEGORY_EMOJIS: Record<string, string> = {
  food: "🍲",
  medical: "🏥",
  job: "💼",
  animal: "🐾",
  education: "📚",
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  active: { label: "Active", bg: "#E8FFF3", text: "#166534", dot: "#22C55E" },
  inprogress: { label: "In Progress", bg: "#FFF8E1", text: "#92400E", dot: "#F59E0B" },
  resolved: { label: "Resolved", bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};

function MyRequestCard({
  item,
  onStatusChange,
  onDelete,
}: {
  item: HelpRequest;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[item.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.reqCardTop} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={[styles.reqIconBox, { backgroundColor: "#F5F3FF" }]}>
          <Text style={styles.reqEmoji}>{CATEGORY_EMOJIS[item.category] ?? "📋"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reqTitle, { color: colors.foreground }]} numberOfLines={expanded ? 0 : 1}>
            {item.title}
          </Text>
          <Text style={[styles.reqLocation, { color: colors.mutedForeground }]}>
            📍 {item.location}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
            <Text style={[styles.statusPillText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.reqExpanded, { borderTopColor: colors.border }]}>
          <Text style={[styles.reqDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
          <Text style={[styles.reqDate, { color: colors.mutedForeground }]}>
            🗓 {new Date(item.timestamp).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
          {item.status !== "resolved" && (
            <View style={styles.reqActions}>
              {item.status === "active" && (
                <TouchableOpacity
                  style={[styles.reqActionBtn, { backgroundColor: "#FFF8E1" }]}
                  onPress={() => onStatusChange(item.id, "inprogress")}
                >
                  <Feather name="clock" size={12} color="#92400E" />
                  <Text style={[styles.reqActionText, { color: "#92400E" }]}>In Progress</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.reqActionBtn, { backgroundColor: "#E8FFF3" }]}
                onPress={() => onStatusChange(item.id, "resolved")}
              >
                <Feather name="check-circle" size={12} color="#166534" />
                <Text style={[styles.reqActionText, { color: "#166534" }]}>Resolved</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={() =>
            Alert.alert("हटाएं?", "यह request delete हो जाएगी।", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
            ])
          }>
            <Feather name="trash-2" size={12} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Auth Screen ────────────────────────────────────────────────────────────
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "");

const GUESTS = [
  { label: "Guest 1 – Rahul", email: "guest1@saharatest.in", pw: "sahara123" },
  { label: "Guest 2 – Priya", email: "guest2@saharatest.in", pw: "sahara123" },
  { label: "Guest 3 – Amit",  email: "guest3@saharatest.in", pw: "sahara123" },
  { label: "Guest 4 – Sunita",email: "guest4@saharatest.in", pw: "sahara123" },
];

function buildBanDurText(ban: BanInfo): string {
  if (ban.isPermanent || !ban.blockedUntil) return "Permanent Ban";
  const days = Math.ceil((new Date(ban.blockedUntil).getTime() - Date.now()) / 86400000);
  if (days >= 365) return `${Math.floor(days / 365)} saal ke liye Ban`;
  if (days >= 30)  return `${Math.floor(days / 30)} mahine ke liye Ban`;
  return `${days} din ke liye Ban`;
}

function AuthScreen({ topPad, insets }: { topPad: number; insets: { bottom: number } }) {
  const { setAuthedProfile, setBanInfo } = useApp();
  const colors = useColors();

  // ── ALL state hooks at top ────────────────────────────────────────────────
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [loginBan, setLoginBan] = useState<BanInfo | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupLocation, setSignupLocation] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "code">("email");

  // ── Core ban handler — called after every login attempt ───────────────────
  function showBan(ban: BanInfo) {
    setBanInfo(ban);
    setLoginBan(ban);
    setLoading(false);
    const dur = buildBanDurText(ban);
    Alert.alert(
      "⛔ Account Ban Hai",
      `${dur}\n\nApeel ke liye email karein:\nsaharaapphelp@gmail.com`,
      [{ text: "Theek Hai" }]
    );
  }

  // ── Direct fetch login — bypasses authApi so ban is detected on raw response
  async function doLogin(email: string, password: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /**/ }

      if (!res.ok) {
        if (data?.error === "account_blocked") {
          showBan({
            blockedUntil: data.blockedUntil ?? null,
            isPermanent:  data.isPermanent  ?? false,
            blockReason:  data.blockReason  ?? null,
            userEmail:    email.trim(),
          });
          return;
        }
        Alert.alert("Login Failed", data?.error ?? `Server error (${res.status})`);
        return;
      }
      setAuthedProfile(data.user);
    } catch (e: any) {
      Alert.alert("Network Error", e?.message ?? "Internet connection check karein.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (!loginEmail.trim() || !loginPassword) {
      Alert.alert("Required", "Email aur password dono bharo.");
      return;
    }
    void doLogin(loginEmail, loginPassword);
  }

  function handleGuestLogin(email: string, pw: string) {
    void doLogin(email, pw);
  }

  function handleGooglePress() {
    const url = `${API_BASE}/api/auth/google/start?mode=${tab}`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      const { Linking } = require("react-native");
      void Linking.openURL(url);
    }
  }

  async function handleSignup() {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      Alert.alert("Required", "Naam, email aur password zaroori hain.");
      return;
    }
    if (signupPassword.length < 6) {
      Alert.alert("Password Chhota Hai", "Password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        phone: signupPhone.trim() || undefined,
        location: signupLocation.trim() || undefined,
      });
      setAuthedProfile(user);
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message ?? "Account nahi ban paya.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSend() {
    if (!forgotEmail.trim()) { Alert.alert("Required", "Email address bharo."); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotStep("code");
      Alert.alert("Code Bheja!", `${forgotEmail} par 6-digit code bheja gaya hai.`);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Email nahi bheja ja saka.");
    } finally { setLoading(false); }
  }

  async function handleForgotReset() {
    if (!resetCode.trim() || !resetNewPw) { Alert.alert("Required", "Code aur naya password bharo."); return; }
    setLoading(true);
    try {
      const { user } = await authApi.resetPassword({ email: forgotEmail.trim(), code: resetCode.trim(), newPassword: resetNewPw });
      setAuthedProfile(user);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Password reset nahi hua.");
    } finally { setLoading(false); }
  }

  const bg = colors.background;
  const card = colors.card;
  const fg = colors.foreground;
  const muted = colors.mutedForeground;
  const border = colors.border;

  // ── Ban screen — shown BEFORE everything else ─────────────────────────────
  if (loginBan) {
    return (
      <BanScreen
        ban={loginBan}
        onTryAgain={() => {
          if (!loginBan.isPermanent && loginBan.blockedUntil && new Date(loginBan.blockedUntil) <= new Date()) {
            setLoginBan(null);
            setBanInfo(null);
          } else {
            Alert.alert("अभी भी Ban है", "Ban abhi khatam nahi hua. Baad mein try karein ya email karein.");
          }
        }}
      />
    );
  }

  if (forgotMode) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <LinearGradient colors={["#2D0A6E", "#7C3AED", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.authHeader, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => { setForgotMode(false); setForgotStep("email"); }} style={styles.authBackBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.authHeaderTitle}>Password Reset</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <ScrollView contentContainerStyle={[styles.authScroll, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.authCard, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.authTitle, { color: fg }]}>🔒 Forgot Password</Text>
            <Text style={[styles.authSub, { color: muted }]}>
              {forgotStep === "email" ? "Apna email bharo, hum reset code bhejenge." : "Email par aaya code aur naya password bharo."}
            </Text>
            {forgotStep === "email" ? (
              <>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="mail" size={16} color="#7C3AED" />
                  <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="name@example.com" placeholderTextColor={muted} value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleForgotSend} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Code Bhejo</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="key" size={16} color="#7C3AED" />
                  <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="6-digit code" placeholderTextColor={muted} value={resetCode} onChangeText={setResetCode} keyboardType="number-pad" maxLength={6} />
                </View>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="lock" size={16} color="#7C3AED" />
                  <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Naya password" placeholderTextColor={muted} value={resetNewPw} onChangeText={setResetNewPw} secureTextEntry />
                </View>
                <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleForgotReset} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Password Badlo</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <LinearGradient colors={["#2D0A6E", "#7C3AED", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.authHero, { paddingTop: topPad + 20 }]}>
        <Text style={styles.authHeroEmoji}>🙏</Text>
        <Text style={styles.authHeroTitle}>सहारा में स्वागत है</Text>
        <Text style={styles.authHeroSub}>Login करें और community की मदद करें</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.authScroll, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.authCard, { backgroundColor: card, borderColor: border }]}>
          <View style={[styles.tabRow, { backgroundColor: bg }]}>
            <TouchableOpacity style={[styles.tabBtn, tab === "login" && styles.tabBtnActive]} onPress={() => setTab("login")}>
              <Text style={[styles.tabBtnText, { color: tab === "login" ? "#fff" : muted }]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, tab === "signup" && styles.tabBtnActive]} onPress={() => setTab("signup")}>
              <Text style={[styles.tabBtnText, { color: tab === "signup" ? "#fff" : muted }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {tab === "login" ? (
            <>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="mail" size={16} color="#7C3AED" />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Email address" placeholderTextColor={muted} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="lock" size={16} color="#7C3AED" />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Password" placeholderTextColor={muted} value={loginPassword} onChangeText={setLoginPassword} secureTextEntry={!showLoginPw} />
                <TouchableOpacity onPress={() => setShowLoginPw(!showLoginPw)}>
                  <Feather name={showLoginPw ? "eye-off" : "eye"} size={16} color={muted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setForgotMode(true)} style={{ alignSelf: "flex-end", marginBottom: 14 }}>
                <Text style={{ color: "#7C3AED", fontSize: 13, fontWeight: "600" }}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Login करें →</Text>}
              </TouchableOpacity>

              {/* 4 Guest Quick-Login Buttons */}
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: border }} />
                  <Text style={{ fontSize: 12, color: muted, fontWeight: "600" }}>GUEST TEST ACCOUNTS</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: border }} />
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {GUESTS.map((g) => (
                    <TouchableOpacity
                      key={g.email}
                      onPress={() => handleGuestLogin(g.email, g.pw)}
                      disabled={loading}
                      style={{
                        flex: 1, minWidth: "45%",
                        backgroundColor: "#EDE9FE",
                        borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8,
                        alignItems: "center", borderWidth: 1, borderColor: "#7C3AED33",
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#7C3AED" }}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              {[
                { label: "Poora Naam", icon: "user", val: signupName, set: setSignupName, placeholder: "Aapka naam" },
                { label: "Email", icon: "mail", val: signupEmail, set: setSignupEmail, placeholder: "name@example.com", keyboard: "email-address", auto: "none" },
              ].map(({ label, icon, val, set, placeholder, keyboard, auto }: any) => (
                <View key={label}>
                  <Text style={[styles.fieldLabel, { color: muted }]}>{label}</Text>
                  <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                    <Feather name={icon} size={16} color="#7C3AED" />
                    <TextInput style={[styles.inputInRow, { color: fg }]} placeholder={placeholder} placeholderTextColor={muted} value={val} onChangeText={set} keyboardType={keyboard} autoCapitalize={auto} />
                  </View>
                </View>
              ))}
              <Text style={[styles.fieldLabel, { color: muted }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="lock" size={16} color="#7C3AED" />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Min 6 characters" placeholderTextColor={muted} value={signupPassword} onChangeText={setSignupPassword} secureTextEntry={!showSignupPw} />
                <TouchableOpacity onPress={() => setShowSignupPw(!showSignupPw)}>
                  <Feather name={showSignupPw ? "eye-off" : "eye"} size={16} color={muted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldLabel, { color: muted }]}>Phone (Optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="phone" size={16} color="#7C3AED" />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="9876543210" placeholderTextColor={muted} value={signupPhone} onChangeText={setSignupPhone} keyboardType="phone-pad" />
              </View>
              <Text style={[styles.fieldLabel, { color: muted }]}>Location (Optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="map-pin" size={16} color="#7C3AED" />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Aapka sheher" placeholderTextColor={muted} value={signupLocation} onChangeText={setSignupLocation} />
              </View>
              <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Account Banao →</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: border }]} />
            <Text style={[styles.orText, { color: muted }]}>या</Text>
            <View style={[styles.orLine, { backgroundColor: border }]} />
          </View>

          <TouchableOpacity style={[styles.googleBtn, { borderColor: border, backgroundColor: bg }]} onPress={handleGooglePress}>
            <Text style={{ fontSize: 18 }}>🌐</Text>
            <Text style={[styles.googleBtnText, { color: fg }]}>Google se continue करें</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({
  visible, onClose, onSave,
  name, phone, location,
  setName, setPhone, setLocation,
  colors,
}: {
  visible: boolean; onClose: () => void; onSave: () => void;
  name: string; phone: string; location: string;
  setName: (v: string) => void; setPhone: (v: string) => void; setLocation: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Profile Edit करें</Text>

          {[
            { label: "नाम", icon: "user", val: name, set: setName, placeholder: "Aapka naam" },
            { label: "Phone", icon: "phone", val: phone, set: setPhone, placeholder: "9876543210", keyboard: "phone-pad" },
            { label: "Location", icon: "map-pin", val: location, set: setLocation, placeholder: "Aapka sheher" },
          ].map(({ label, icon, val, set, placeholder, keyboard }: any) => (
            <View key={label} style={{ marginBottom: 14 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name={icon} size={16} color="#7C3AED" />
                <TextInput
                  style={[styles.inputInRow, { color: colors.foreground }]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={val}
                  onChangeText={set}
                  keyboardType={keyboard}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.primaryBtn} onPress={onSave}>
            <Text style={styles.primaryBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Profile Screen ─────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { profile, requests, updateProfile, updateRequestStatus, deleteRequest, logout, banInfo, setBanInfo } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top;

  const isLoggedIn = !!profile.id;

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [photoUri, setPhotoUri] = useState(profile.photoUri ?? profile.photoUrl ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Show ban screen if user is banned (either auto-logout or login attempt)
  if (banInfo) {
    return (
      <BanScreen
        ban={banInfo}
        onTryAgain={() => {
          if (!banInfo.isPermanent && banInfo.blockedUntil) {
            const expiry = new Date(banInfo.blockedUntil);
            if (expiry <= new Date()) {
              setBanInfo(null);
              return;
            }
          }
          Alert.alert("अभी भी Ban है", "आपका ban अभी समाप्त नहीं हुआ है। बाद में try करें या email करें।");
        }}
      />
    );
  }

  const myRequests = requests.filter((r) => r.userId === profile.id);
  const activeCount = myRequests.filter((r) => r.status === "active").length;
  const resolvedCount = myRequests.filter((r) => r.status === "resolved").length;

  if (!isLoggedIn) {
    return <AuthScreen topPad={topPad} insets={insets} />;
  }

  const bg = colors.background;
  const card = colors.card;
  const fg = colors.foreground;
  const muted = colors.mutedForeground;
  const border = colors.border;

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission चाहिए", "Gallery access allow करें Settings में।");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setUploadingPhoto(true);

    try {
      const API_BASE_URL =
        process.env.EXPO_PUBLIC_API_URL ??
        (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "");

      const formData = new FormData();
      formData.append("files", { uri: asset.uri, name: "photo.jpg", type: "image/jpeg" } as any);

      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Upload failed (${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      const photoUrl: string | undefined = uploadData.urls?.[0];

      if (!photoUrl) throw new Error("Server ne URL nahi diya");

      await authApi.updatePhoto({ userId: profile.id, photoUrl });
      updateProfile({ photoUri: photoUrl, photoUrl });
      setPhotoUri(photoUrl);
      Alert.alert("✅ Saved!", "Profile photo update ho gayi.");
    } catch (err: any) {
      // Revert to previous photo
      setPhotoUri(profile.photoUri ?? profile.photoUrl ?? "");
      Alert.alert("Upload Failed", err.message ?? "Photo save nahi ho paya. Dobara try karein.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function saveEdit() {
    updateProfile({ name: editName.trim(), phone: editPhone.trim(), location: editLocation.trim() });
    setEditModal(false);
  }

  const initials = (profile.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <EditModal
        visible={editModal} onClose={() => setEditModal(false)} onSave={saveEdit}
        name={editName} phone={editPhone} location={editLocation}
        setName={setEditName} setPhone={setEditPhone} setLocation={setEditLocation}
        colors={colors}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={["#1A0050", "#7C3AED", "#EC4899", "#FF6B00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topPad + 16 }]}
        >
          {/* Top row */}
          <View style={styles.heroTopRow}>
            <View style={styles.saharaIdChip}>
              <Feather name="hash" size={11} color="rgba(255,255,255,0.9)" />
              <Text style={styles.saharaIdChipText}>{profile.saharaId || "———"}</Text>
              <TouchableOpacity onPress={() => { void Clipboard.setStringAsync(profile.saharaId || ""); Alert.alert("Copied!"); }}>
                <Feather name="copy" size={11} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.editHeroBtn} onPress={() => {
              setEditName(profile.name); setEditPhone(profile.phone); setEditLocation(profile.location);
              setEditModal(true);
            }}>
              <Feather name="edit-3" size={15} color="#fff" />
              <Text style={styles.editHeroBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <TouchableOpacity onPress={pickPhoto} disabled={uploadingPhoto} style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.cameraBtn}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="camera" size={12} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{profile.name || "User"}</Text>
          <Text style={styles.heroEmail}>{profile.email}</Text>

          {profile.location ? (
            <View style={styles.heroLocationRow}>
              <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroLocationText}>{profile.location}</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* ── Stats Row ── */}
        <View style={[styles.statsRow, { marginTop: -1 }]}>
          {[
            { num: profile.helpedCount, label: "मदद की", icon: "heart", color: "#EC4899" },
            { num: myRequests.length, label: "Requests", icon: "file-text", color: "#7C3AED" },
            { num: activeCount, label: "Active", icon: "activity", color: "#22C55E" },
            { num: resolvedCount, label: "Resolved", icon: "check-circle", color: "#F59E0B" },
          ].map(({ num, label, icon, color }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
              <View style={[styles.statIconBox, { backgroundColor: color + "20" }]}>
                <Feather name={icon as any} size={14} color={color} />
              </View>
              <Text style={[styles.statNum, { color: fg }]}>{num}</Text>
              <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Account Info ── */}
        <View style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={15} color="#7C3AED" />
            <Text style={[styles.sectionTitle, { color: fg }]}>Account Details</Text>
          </View>
          {[
            { icon: "mail", label: "Email", value: profile.email || "—", color: "#7C3AED" },
            { icon: "phone", label: "Phone", value: profile.phone || "—", color: "#EC4899" },
            { icon: "map-pin", label: "Location", value: profile.location || "—", color: "#FF6B00" },
          ].map(({ icon, label, value, color }) => (
            <View key={label} style={[styles.infoRow, { borderTopColor: border }]}>
              <View style={[styles.infoIconBox, { backgroundColor: color + "15" }]}>
                <Feather name={icon as any} size={14} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: muted }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: fg }]} numberOfLines={1}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── My Requests ── */}
        <View style={styles.reqSection}>
          <View style={styles.sectionHeader}>
            <Feather name="list" size={15} color="#7C3AED" />
            <Text style={[styles.sectionTitle, { color: fg }]}>मेरी Requests</Text>
            <View style={[styles.countBadge, { backgroundColor: "#7C3AED20" }]}>
              <Text style={styles.countBadgeText}>{myRequests.length}</Text>
            </View>
          </View>

          {myRequests.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: card, borderColor: border }]}>
              <Text style={{ fontSize: 36 }}>📋</Text>
              <Text style={[styles.emptyText, { color: muted }]}>अभी तक कोई request नहीं</Text>
              <Text style={[styles.emptySub, { color: muted }]}>Home tab से help request डालें</Text>
            </View>
          ) : (
            myRequests.map((item) => (
              <MyRequestCard
                key={item.id}
                item={item}
                onStatusChange={updateRequestStatus}
                onDelete={deleteRequest}
              />
            ))
          )}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: "#FCA5A5", backgroundColor: "#FFF5F5" }]}
          onPress={() =>
            Alert.alert("Logout", "क्या आप logout करना चाहते हैं?", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        >
          <Feather name="log-out" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Auth
  authHero: { alignItems: "center", paddingBottom: 28, paddingHorizontal: 20 },
  authHeroEmoji: { fontSize: 48, marginBottom: 8 },
  authHeroTitle: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  authHeroSub: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  authHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  authBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  authHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  authScroll: { padding: 16, paddingTop: 20 },
  authCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  authTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  authSub: { fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 18 },

  tabRow: { flexDirection: "row", borderRadius: 12, padding: 3, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#7C3AED" },
  tabBtnText: { fontSize: 14, fontWeight: "700" },

  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 12 },
  inputInRow: { flex: 1, fontSize: 14 },

  primaryBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 2 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  cancelBtnText: { fontWeight: "600", fontSize: 14 },

  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  orLine: { flex: 1, height: 1 },
  orText: { marginHorizontal: 12, fontSize: 13, fontWeight: "600" },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13 },
  googleBtnText: { fontWeight: "600", fontSize: 14 },

  // Hero
  hero: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 32 },
  heroTopRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  saharaIdChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  saharaIdChipText: { fontSize: 12, color: "rgba(255,255,255,0.95)", fontWeight: "700" },
  editHeroBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6 },
  editHeroBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  avatarContainer: { position: "relative", marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: "rgba(255,255,255,0.9)" },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
  avatarInitials: { fontSize: 36, fontWeight: "800", color: "#fff" },
  cameraBtn: { position: "absolute", bottom: 2, right: 2, backgroundColor: "#7C3AED", borderRadius: 14, width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },

  heroName: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 6 },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroLocationText: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "500" },

  // Stats
  statsRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 14, gap: 8 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  statIconBox: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center", fontWeight: "500" },

  // Sections
  section: { marginHorizontal: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, paddingBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  countBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { color: "#7C3AED", fontSize: 12, fontWeight: "700" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  infoIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontWeight: "600", marginBottom: 1 },
  infoValue: { fontSize: 14, fontWeight: "500" },

  reqSection: { marginHorizontal: 12, marginBottom: 12 },
  reqCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  reqCardTop: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  reqIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reqEmoji: { fontSize: 20 },
  reqTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  reqLocation: { fontSize: 11 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  reqExpanded: { borderTopWidth: 1, padding: 12 },
  reqDesc: { fontSize: 13, lineHeight: 19, marginBottom: 6 },
  reqDate: { fontSize: 11, marginBottom: 10 },
  reqActions: { flexDirection: "row", gap: 8, marginBottom: 10 },
  reqActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  reqActionText: { fontSize: 12, fontWeight: "600" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  deleteBtnText: { color: "#DC2626", fontSize: 12, fontWeight: "600" },

  emptyBox: { borderRadius: 14, borderWidth: 1, padding: 28, alignItems: "center", gap: 6 },
  emptyText: { fontSize: 14, fontWeight: "600" },
  emptySub: { fontSize: 12 },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 12, marginTop: 4, marginBottom: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 18 },
});
