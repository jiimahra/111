import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HelpRequest, RequestStatus, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { authApi } from "@/lib/auth";

WebBrowser.maybeCompleteAuthSession();

const CATEGORY_EMOJIS: Record<string, string> = {
  food: "🍲",
  medical: "🏥",
  job: "💼",
  animal: "🐾",
  education: "📚",
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; lightBg: string; darkBg: string; lightText: string; darkText: string }
> = {
  active: {
    label: "● Active",
    lightBg: "#DCFCE7",
    darkBg: "#14532D",
    lightText: "#166534",
    darkText: "#86EFAC",
  },
  inprogress: {
    label: "◐ In Progress",
    lightBg: "#FEF3C7",
    darkBg: "#064E3B",
    lightText: "#065F46",
    darkText: "#FDE68A",
  },
  resolved: {
    label: "✓ Resolved",
    lightBg: "#F3F4F6",
    darkBg: "#1F2937",
    lightText: "#6B7280",
    darkText: "#9CA3AF",
  },
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
  const isDark = colors.background === "#0F172A";
  const cfg = STATUS_CONFIG[item.status];
  const [expanded, setExpanded] = useState(false);

  const confirmDelete = () => {
    Alert.alert("Delete Request", "Are you sure you want to delete this request?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <View style={[styles.myReqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row */}
      <TouchableOpacity style={styles.myReqCardTop} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.myReqCardLeft}>
          <Text style={styles.myReqEmoji}>{CATEGORY_EMOJIS[item.category]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.myReqTitle, { color: colors.foreground }]} numberOfLines={expanded ? 0 : 1}>
              {item.title}
            </Text>
            <Text style={[styles.myReqMeta, { color: colors.mutedForeground }]}>
              📍 {item.location}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? cfg.darkBg : cfg.lightBg }]}>
            <Text style={[styles.statusText, { color: isDark ? cfg.darkText : cfg.lightText }]}>
              {cfg.label}
            </Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Expanded details + actions */}
      {expanded && (
        <View style={[styles.myReqExpanded, { borderTopColor: colors.border }]}>
          <Text style={[styles.myReqDesc, { color: colors.mutedForeground }]}>
            {item.description}
          </Text>
          <Text style={[styles.myReqTimestamp, { color: colors.mutedForeground }]}>
            Posted: {new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>

          {/* Status action buttons */}
          {item.status !== "resolved" && (
            <View style={styles.actionRow}>
              {item.status === "active" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}
                  onPress={() => onStatusChange(item.id, "inprogress")}
                >
                  <Feather name="clock" size={13} color="#065F46" />
                  <Text style={[styles.actionBtnText, { color: "#065F46" }]}>Mark In Progress</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#DCFCE7", borderColor: "#22C55E" }]}
                onPress={() => onStatusChange(item.id, "resolved")}
              >
                <Feather name="check-circle" size={13} color="#166534" />
                <Text style={[styles.actionBtnText, { color: "#166534" }]}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === "inprogress" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#DCFCE7", borderColor: "#22C55E", marginTop: 8 }]}
              onPress={() => onStatusChange(item.id, "resolved")}
            >
              <Feather name="check-circle" size={13} color="#166534" />
              <Text style={[styles.actionBtnText, { color: "#166534" }]}>Mark Resolved</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Feather name="trash-2" size={13} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function AuthScreen({ topPad, insets }: { topPad: number; insets: { bottom: number } }) {
  const { setAuthedProfile } = useApp();
  const colors = useColors();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupLocation, setSignupLocation] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "code">("email");

  // Google OAuth
  const [_request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID || undefined,
    iosClientId: GOOGLE_CLIENT_ID || undefined,
    androidClientId: GOOGLE_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.accessToken) {
      handleGoogleToken(response.authentication.accessToken);
    } else if (response?.type === "error") {
      Alert.alert("Google Error", "Google se login mein dikkat aayi. Dobara koshish karein.");
    }
  }, [response]);

  async function handleGoogleToken(accessToken: string) {
    setGoogleLoading(true);
    try {
      if (tab === "login") {
        try {
          const { user } = await authApi.googleLogin(accessToken);
          setAuthedProfile(user);
        } catch (err: any) {
          if (err.message?.includes("no_account") || err.message?.includes("Pehle Sign Up")) {
            Alert.alert(
              "Account Nahi Mila",
              "Is Google account se koi account nahi hai.\n\nPehle Sign Up karein.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Up Karein", onPress: () => setTab("signup") },
              ]
            );
          } else {
            Alert.alert("Error", err.message ?? "Google login failed");
          }
        }
      } else {
        const { user } = await authApi.googleSignup(accessToken);
        setAuthedProfile(user);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Kuch gadbad ho gayi. Dobara koshish karein.");
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGooglePress() {
    if (!GOOGLE_CLIENT_ID) {
      Alert.alert(
        "Google Login",
        "Google login ke liye admin se contact karein ya email/password se login karein.",
      );
      return;
    }
    void promptAsync();
  }

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPassword) {
      Alert.alert("Required", "Email aur password dono bharo.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.login({ email: loginEmail.trim(), password: loginPassword });
      setAuthedProfile(user);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message ?? "Login nahi ho paya.");
    } finally {
      setLoading(false);
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
    if (!forgotEmail.trim()) {
      Alert.alert("Required", "Email address bharo.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotStep("code");
      Alert.alert("Code Bheja!", `${forgotEmail} par 6-digit code bheja gaya hai.`);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Email nahi bheja ja saka.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotReset() {
    if (!resetCode.trim() || !resetNewPw) {
      Alert.alert("Required", "Code aur naya password bharo.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.resetPassword({ email: forgotEmail.trim(), code: resetCode.trim(), newPassword: resetNewPw });
      setAuthedProfile(user);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Password reset nahi hua.");
    } finally {
      setLoading(false);
    }
  }

  const bg = colors.background;
  const card = colors.card;
  const fg = colors.foreground;
  const muted = colors.mutedForeground;
  const border = colors.border;

  if (forgotMode) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: bg, borderBottomColor: border }]}>
          <TouchableOpacity onPress={() => { setForgotMode(false); setForgotStep("email"); }}>
            <Feather name="arrow-left" size={22} color={fg} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: fg }]}>Password Reset</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.loginScroll, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.loginCard, { backgroundColor: card }]}>
            <Text style={[styles.loginTitle, { color: fg }]}>🔒 Forgot Password</Text>
            <Text style={[styles.loginSub, { color: muted }]}>
              {forgotStep === "email" ? "Apna email bharo, hum reset code bhejenge." : "Email par aaya code aur naya password bharo."}
            </Text>

            {forgotStep === "email" ? (
              <>
                <Text style={[styles.fieldLabel, { color: muted }]}>Email Address</Text>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="mail" size={16} color={muted} />
                  <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="name@example.com" placeholderTextColor={muted} value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <TouchableOpacity style={[styles.signInBtn, loading && styles.btnDisabled]} onPress={handleForgotSend} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInBtnText}>Code Bhejo →</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { color: muted }]}>6-Digit Code</Text>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="key" size={16} color={muted} />
                  <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="123456" placeholderTextColor={muted} value={resetCode} onChangeText={setResetCode} keyboardType="number-pad" maxLength={6} />
                </View>
                <Text style={[styles.fieldLabel, { color: muted }]}>Naya Password</Text>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="lock" size={16} color={muted} />
                  <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Min 6 characters" placeholderTextColor={muted} value={resetNewPw} onChangeText={setResetNewPw} secureTextEntry />
                </View>
                <TouchableOpacity style={[styles.signInBtn, loading && styles.btnDisabled]} onPress={handleForgotReset} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInBtnText}>Password Badlo →</Text>}
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
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: bg, borderBottomColor: border }]}>
        <Text style={[styles.headerTitle, { color: fg }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.loginScroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.loginCard, { backgroundColor: card }]}>
          <Image source={require("@/assets/images/sahara-logo.png")} style={styles.loginLogoImg} resizeMode="contain" />

          {/* Tab switcher */}
          <View style={[styles.tabRow, { backgroundColor: bg, borderColor: border }]}>
            <TouchableOpacity style={[styles.tabBtn, tab === "login" && styles.tabBtnActive]} onPress={() => setTab("login")}>
              <Text style={[styles.tabBtnText, { color: tab === "login" ? "#fff" : muted }]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, tab === "signup" && styles.tabBtnActive]} onPress={() => setTab("signup")}>
              <Text style={[styles.tabBtnText, { color: tab === "signup" ? "#fff" : muted }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Google button — prominent, at top */}
          <TouchableOpacity
            style={styles.googleBtnBig}
            onPress={handleGooglePress}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#444" size="small" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleBigLabel}>
                  {tab === "login" ? "Google se Login karein" : "Google se Sign Up karein"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: border }]} />
            <Text style={[styles.dividerText, { color: muted }]}>ya</Text>
            <View style={[styles.divider, { backgroundColor: border }]} />
          </View>

          {/* LOGIN TAB */}
          {tab === "login" && (
            <>
              <Text style={[styles.fieldLabel, { color: muted }]}>Email Address</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="mail" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="name@example.com" placeholderTextColor={muted} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="lock" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Apna password" placeholderTextColor={muted} value={loginPassword} onChangeText={setLoginPassword} secureTextEntry={!showLoginPw} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowLoginPw(!showLoginPw)}>
                  <Feather name={showLoginPw ? "eye-off" : "eye"} size={16} color={muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => { setForgotMode(true); setForgotEmail(loginEmail); }} style={styles.forgotLink}>
                <Text style={[styles.forgotText, { color: "#059669" }]}>Password bhool gaye?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.signInBtn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInBtnText}>Login Karein →</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setTab("signup")} style={styles.switchTabLink}>
                <Text style={[styles.switchTabText, { color: muted }]}>Account nahi hai? <Text style={{ color: "#059669", fontWeight: "700" }}>Sign Up karein</Text></Text>
              </TouchableOpacity>
            </>
          )}

          {/* SIGNUP TAB */}
          {tab === "signup" && (
            <>
              {[
                { label: "Full Name *", value: signupName, setter: setSignupName, icon: "user", placeholder: "Aapka poora naam", type: "default", secure: false },
                { label: "Email Address *", value: signupEmail, setter: setSignupEmail, icon: "mail", placeholder: "name@example.com", type: "email-address", secure: false },
                { label: "Phone (optional)", value: signupPhone, setter: setSignupPhone, icon: "phone", placeholder: "+91 98765 43210", type: "phone-pad", secure: false },
                { label: "City / Location (optional)", value: signupLocation, setter: setSignupLocation, icon: "map-pin", placeholder: "Ajmer, Rajasthan", type: "default", secure: false },
              ].map((f) => (
                <View key={f.label}>
                  <Text style={[styles.fieldLabel, { color: muted }]}>{f.label}</Text>
                  <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                    <Feather name={f.icon as any} size={16} color={muted} />
                    <TextInput style={[styles.inputInRow, { color: fg }]} placeholder={f.placeholder} placeholderTextColor={muted} value={f.value} onChangeText={f.setter} keyboardType={f.type as any} autoCapitalize="none" />
                  </View>
                </View>
              ))}

              <Text style={[styles.fieldLabel, { color: muted }]}>Password * (min 6 characters)</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="lock" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Apna password banayein" placeholderTextColor={muted} value={signupPassword} onChangeText={setSignupPassword} secureTextEntry={!showSignupPw} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowSignupPw(!showSignupPw)}>
                  <Feather name={showSignupPw ? "eye-off" : "eye"} size={16} color={muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.signInBtn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInBtnText}>Account Banayein →</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setTab("login")} style={styles.switchTabLink}>
                <Text style={[styles.switchTabText, { color: muted }]}>Pehle se account hai? <Text style={{ color: "#059669", fontWeight: "700" }}>Login karein</Text></Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, requests, updateProfile, updateRequestStatus, deleteRequest, logout } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [location, setLocation] = useState(profile.location);
  const [showAll, setShowAll] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const isLoggedIn = !!profile.name;
  const myRequests = requests.filter((r) => r.postedBy === profile.name);
  const activeCount = myRequests.filter((r) => r.status === "active").length;
  const resolvedCount = myRequests.filter((r) => r.status === "resolved").length;
  const inProgressCount = myRequests.filter((r) => r.status === "inprogress").length;
  const displayedRequests = showAll ? myRequests : myRequests.slice(0, 3);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      location: location.trim(),
    });
    setEditing(false);
  };

  if (!isLoggedIn) {
    return <AuthScreen topPad={topPad} insets={insets} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={() => (editing ? handleSave() : setEditing(true))}>
          <Text style={[styles.editText, { color: "#059669" }]}>{editing ? "Save" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <LinearGradient colors={["#059669", "#EF4444"]} style={styles.avatar}>
          <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        {!editing && (
          <>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
            {profile.email ? (
              <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>{profile.email}</Text>
            ) : null}
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>📍 {profile.location}</Text>

            {/* Sahara ID Card */}
            {profile.saharaId ? (
              <TouchableOpacity
                style={styles.saharaIdCard}
                onPress={() => {
                  Clipboard.setStringAsync(profile.saharaId);
                  Alert.alert("Copied!", `Sahara ID ${profile.saharaId} copied to clipboard.`);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.saharaIdLeft}>
                  <Text style={styles.saharaIdLabel}>Sahara ID</Text>
                  <Text style={styles.saharaIdValue}>
                    {profile.saharaId.slice(0, 3)}-{profile.saharaId.slice(3, 6)}-{profile.saharaId.slice(6)}
                  </Text>
                </View>
                <View style={styles.saharaIdCopyBtn}>
                  <Feather name="copy" size={14} color="#059669" />
                  <Text style={styles.saharaIdCopyText}>Copy</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>

      {editing && (
        <View style={styles.formSection}>
          {[
            { label: "Full Name", value: name, setter: setName, icon: "user", type: "default" },
            { label: "Email", value: email, setter: setEmail, icon: "mail", type: "email-address" },
            { label: "Phone", value: phone, setter: setPhone, icon: "phone", type: "phone-pad" },
            { label: "Location", value: location, setter: setLocation, icon: "map-pin", type: "default" },
          ].map((field) => (
            <View key={field.label}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={field.icon as any} size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.inputInRow, { color: colors.foreground }]}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.type as any}
                  autoCapitalize="none"
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: "#059669" }]}>{profile.helpedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>People Helped</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: "#059669" }]}>{profile.requestsPosted}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Requests Posted</Text>
        </View>
      </View>

      {/* My Requests Tracker */}
      <View style={styles.myRequestsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Requests</Text>
          {myRequests.length > 0 && (
            <View style={styles.sectionBadges}>
              {activeCount > 0 && (
                <View style={[styles.miniChip, { backgroundColor: "#DCFCE7" }]}>
                  <Text style={[styles.miniChipText, { color: "#166534" }]}>{activeCount} active</Text>
                </View>
              )}
              {inProgressCount > 0 && (
                <View style={[styles.miniChip, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.miniChipText, { color: "#065F46" }]}>{inProgressCount} in progress</Text>
                </View>
              )}
              {resolvedCount > 0 && (
                <View style={[styles.miniChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.miniChipText, { color: colors.mutedForeground }]}>{resolvedCount} resolved</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {myRequests.length === 0 ? (
          <View style={[styles.emptyRequests, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyReqEmoji}>📋</Text>
            <Text style={[styles.emptyReqText, { color: colors.mutedForeground }]}>
              You haven't posted any requests yet.
            </Text>
          </View>
        ) : (
          <>
            {displayedRequests.map((r) => (
              <MyRequestCard
                key={r.id}
                item={r}
                onStatusChange={updateRequestStatus}
                onDelete={deleteRequest}
              />
            ))}
            {myRequests.length > 3 && (
              <TouchableOpacity
                style={[styles.showMoreBtn, { borderColor: colors.border }]}
                onPress={() => setShowAll(!showAll)}
              >
                <Text style={[styles.showMoreText, { color: "#059669" }]}>
                  {showAll ? "Show Less ↑" : `Show All ${myRequests.length} Requests ↓`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Mission */}
      <View style={[styles.missionCard, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
        <Text style={[styles.missionText, { color: "#065F46" }]}>
          "कोई भी अकेला महसूस न करे, क्योंकि हम सब एक-दूसरे का 'सहारा' हैं।"
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.border }]}
        onPress={() => {
          Alert.alert("Sign Out", "Kya aap sign out karna chahte hain?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: () => { logout(); setEditing(false); } },
          ]);
        }}
      >
        <Feather name="log-out" size={16} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  editText: { fontSize: 15, fontWeight: "600" },

  loginScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20 },
  loginCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  loginLogoImg: { width: 160, height: 80, alignSelf: "center", marginBottom: 8 },
  loginTitle: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  loginSub: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  inputInRow: { flex: 1, fontSize: 14 },
  signInBtn: {
    backgroundColor: "#059669",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  // New auth styles
  tabRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: "#059669",
  },
  tabBtnText: { fontSize: 14, fontWeight: "700" },
  googleBtnBig: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  googleIcon: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  googleBigLabel: { fontSize: 15, fontWeight: "600", color: "#374151" },
  forgotLink: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: { fontSize: 13, fontWeight: "600" },
  switchTabLink: { alignItems: "center", marginTop: 16 },
  switchTabText: { fontSize: 13 },
  btnDisabled: { opacity: 0.6 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  googleBtnText: { fontSize: 16, fontWeight: "800", color: "#4285F4" },
  googleBtnLabel: { fontSize: 14, fontWeight: "600" },

  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatarInitial: { fontSize: 32, fontWeight: "800", color: "#fff" },
  profileName: { fontSize: 20, fontWeight: "700" },
  profileSub: { fontSize: 13 },

  saharaIdCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 220,
  },
  saharaIdLeft: { gap: 2 },
  saharaIdLabel: { fontSize: 10, fontWeight: "700", color: "#065F46", letterSpacing: 1, textTransform: "uppercase" },
  saharaIdValue: { fontSize: 20, fontWeight: "800", color: "#064E3B", letterSpacing: 2 },
  saharaIdCopyBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  saharaIdCopyText: { fontSize: 12, fontWeight: "700", color: "#059669" },
  formSection: { paddingHorizontal: 16, paddingBottom: 8 },

  statsRow: { flexDirection: "row", marginHorizontal: 16, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: "center" },

  myRequestsSection: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionBadges: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" },
  miniChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  miniChipText: { fontSize: 10, fontWeight: "600" },

  emptyRequests: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  emptyReqEmoji: { fontSize: 32 },
  emptyReqText: { fontSize: 13, textAlign: "center" },

  myReqCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  myReqCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    gap: 8,
  },
  myReqCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  myReqEmoji: { fontSize: 22 },
  myReqTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  myReqMeta: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  statusText: { fontSize: 10, fontWeight: "700" },

  myReqExpanded: {
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  myReqDesc: { fontSize: 13, lineHeight: 18 },
  myReqTimestamp: { fontSize: 11 },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 6,
  },
  deleteBtnText: { fontSize: 12, color: "#DC2626", fontWeight: "500" },

  showMoreBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  showMoreText: { fontSize: 13, fontWeight: "600" },

  missionCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  missionText: { fontSize: 13, lineHeight: 20, fontStyle: "italic", textAlign: "center" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#DC2626" },
});
