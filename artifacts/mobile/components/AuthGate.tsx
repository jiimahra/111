import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { authApi } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

type Mode = "login" | "signup" | "forgot" | "reset";

const BRAND_GREEN = "#7C3AED";
const BRAND_DARK = "#2D0A6E";

const GUEST_ACCOUNTS = [
  { name: "Rahul Sharma", email: "guest1@saharatest.in", password: "sahara123", city: "Delhi", emoji: "👨" },
  { name: "Priya Singh",  email: "guest2@saharatest.in", password: "sahara123", city: "Mumbai", emoji: "👩" },
  { name: "Amit Kumar",   email: "guest3@saharatest.in", password: "sahara123", city: "Jaipur", emoji: "👦" },
  { name: "Sunita Devi",  email: "guest4@saharatest.in", password: "sahara123", city: "Lucknow", emoji: "👧" },
];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, setAuthedProfile, loading } = useApp();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState<number | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Ajmer");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // On web: detect g_token or g_error in URL after Google OAuth callback
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gToken = params.get("g_token");
    const gError = params.get("g_error");
    if (gToken) {
      window.history.replaceState({}, "", window.location.pathname);
      verifyGoogleToken(gToken);
    } else if (gError) {
      window.history.replaceState({}, "", window.location.pathname);
      if (gError === "no_account") {
        Alert.alert("Account Nahi Mila", "Is Google account se koi account nahi hai. Pehle Sign Up karein.", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Up", onPress: () => setMode("signup") },
        ]);
      } else if (gError === "account_blocked") {
        const blockedUntil = params.get("blocked_until");
        const blockReason = params.get("block_reason");
        const isPermanent = !blockedUntil;
        let msg = "Aapka account band kar diya gaya hai.";
        if (!isPermanent && blockedUntil) {
          const d = new Date(blockedUntil);
          msg = `Aapka account ${d.toLocaleDateString("hi-IN")} tak band hai.`;
        } else {
          msg = "Aapka account permanently band kar diya gaya hai.";
        }
        if (blockReason) msg += `\n\nKaran: ${blockReason}`;
        Alert.alert("Account Suspended", msg);
      } else if (gError !== "cancelled") {
        Alert.alert("Google Error", "Google se login nahi ho paya. Dobara koshish karein.");
      }
    }
  }, []);

  const verifyGoogleToken = async (token: string) => {
    setGoogleBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/google/verify?token=${token}`);
      const data = await res.json() as { user?: any; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "Verification failed");
      setAuthedProfile(data.user);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Google login verify nahi hua.");
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGooglePress = (googleMode: "login" | "signup") => {
    const url = `${API_BASE}/api/auth/google/start?mode=${googleMode}`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      void Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[BRAND_DARK, "#7C3AED", "#EC4899"]}
        style={styles.loadingContainer}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require("@/assets/images/sahara-logo.png")}
            style={{ width: 70, height: 70 }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingTitle}>सहारा</Text>
        <Text style={styles.loadingTagline}>Together we make a difference</Text>
        <ActivityIndicator size="small" color="#fff" style={{ marginTop: 28 }} />
      </LinearGradient>
    );
  }

  if (profile.name) {
    return <>{children}</>;
  }

  const showError = (msg: string) => Alert.alert("Error", msg);

  const navigateToBan = async (data: any, userEmail: string) => {
    const ban = {
      blockedUntil: data.blockedUntil ?? "",
      isPermanent:  data.isPermanent ? "1" : "0",
      blockReason:  data.blockReason ?? "",
      userEmail,
      userName:     data.userName ?? "",
    };
    try {
      await AsyncStorage.setItem("@sahara/ban_info_v1", JSON.stringify({
        blockedUntil: data.blockedUntil ?? null,
        isPermanent:  !!data.isPermanent,
        blockReason:  data.blockReason ?? null,
        userEmail,
        userName:     data.userName ?? "",
      }));
    } catch { /**/ }
    router.push({ pathname: "/ban", params: ban });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return showError("Please enter email and password.");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as any;
      if (!res.ok) {
        if (data.error === "account_blocked") {
          await navigateToBan(data, email.trim());
          return;
        }
        throw new Error(data.error ?? "Login failed");
      }
      setAuthedProfile(data.user);
    } catch (e: any) {
      showError(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) return showError("Name, email and password are required.");
    if (password.length < 6) return showError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      const { user } = await authApi.signup({ email, password, name, phone, location });
      setAuthedProfile(user);
    } catch (e: any) {
      showError(e.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) return showError("Please enter your email");
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      Alert.alert("Email sent", `Reset code sent to ${email}. Please check your inbox.`);
      setMode("reset");
    } catch (e: any) {
      showError(e.message || "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim() || code.length !== 6 || newPassword.length < 6) {
      return showError("Enter 6-digit code and a new password (6+ chars).");
    }
    setBusy(true);
    try {
      const { user } = await authApi.resetPassword({ email, code, newPassword });
      setAuthedProfile(user);
    } catch (e: any) {
      showError(e.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGuestLogin = async (idx: number) => {
    const g = GUEST_ACCOUNTS[idx];
    setGuestBusy(idx);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: g.email, password: g.password }),
      });
      const data = await res.json() as any;
      if (!res.ok) {
        if (data.error === "account_blocked") {
          await navigateToBan({ ...data, userName: g.name }, g.email);
          return;
        }
        throw new Error(data.error ?? "Login failed");
      }
      setAuthedProfile(data.user);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Guest login failed");
    } finally {
      setGuestBusy(null);
    }
  };

  const isLogin = mode === "login";
  const isSignup = mode === "signup";

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[BRAND_DARK, "#7C3AED", "#EC4899", "#FF6B00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoCircle}>
              <Image
                source={require("@/assets/images/sahara-logo.png")}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>सहारा</Text>
            <Text style={styles.brandTagline}>
              Connecting hearts.{"\n"}Empowering communities.
            </Text>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            {/* Tab Toggle (only login/signup) */}
            {(isLogin || isSignup) && (
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, isLogin && styles.tabActive]}
                  onPress={() => setMode("login")}
                >
                  <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, isSignup && styles.tabActive]}
                  onPress={() => setMode("signup")}
                >
                  <Text style={[styles.tabText, isSignup && styles.tabTextActive]}>Sign up</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LOGIN */}
            {isLogin && (
              <>
                <Text style={styles.cardHeading}>Welcome back 👋</Text>
                <Text style={styles.cardSub}>Sign in to continue helping your community</Text>

                <View style={styles.fields}>
                  <Input icon="mail" placeholder="Email address" value={email} onChange={setEmail} keyboard="email-address" />
                  <Input
                    icon="lock"
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    secure={!showPwd}
                    rightSlot={<PasswordToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />}
                  />
                </View>

                <TouchableOpacity onPress={() => setMode("forgot")} style={styles.linkRight}>
                  <Text style={styles.linkText}>Forgot password?</Text>
                </TouchableOpacity>

                <PrimaryBtn label="Sign in" onPress={handleLogin} busy={busy} />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <GoogleBtn onPress={() => handleGooglePress("login")} busy={googleBusy} label="Continue with Google" />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.outlineBtn} onPress={() => setMode("signup")}>
                  <Text style={styles.outlineBtnText}>Create new account</Text>
                </TouchableOpacity>

                {/* Guest Test Accounts */}
                <View style={styles.guestSection}>
                  <View style={styles.guestHeader}>
                    <View style={styles.guestDividerLine} />
                    <Text style={styles.guestHeaderText}>🧪 Test Accounts</Text>
                    <View style={styles.guestDividerLine} />
                  </View>
                  <Text style={styles.guestSubText}>App test karne ke liye ek account chunein</Text>
                  <View style={styles.guestGrid}>
                    {GUEST_ACCOUNTS.map((g, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.guestCard, guestBusy === i && { opacity: 0.6 }]}
                        onPress={() => handleGuestLogin(i)}
                        disabled={guestBusy !== null}
                        activeOpacity={0.8}
                      >
                        {guestBusy === i ? (
                          <ActivityIndicator size="small" color="#7C3AED" />
                        ) : (
                          <>
                            <Text style={styles.guestEmoji}>{g.emoji}</Text>
                            <Text style={styles.guestName}>{g.name}</Text>
                            <Text style={styles.guestCity}>{g.city}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* SIGNUP */}
            {isSignup && (
              <>
                <Text style={styles.cardHeading}>Join Sahara 🤝</Text>
                <Text style={styles.cardSub}>Create your account in seconds</Text>

                <View style={styles.fields}>
                  <Input icon="user" placeholder="Full name" value={name} onChange={setName} />
                  <Input icon="mail" placeholder="Email address" value={email} onChange={setEmail} keyboard="email-address" />
                  <Input
                    icon="lock"
                    placeholder="Password (6+ characters)"
                    value={password}
                    onChange={setPassword}
                    secure={!showPwd}
                    rightSlot={<PasswordToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />}
                  />
                  <Input icon="phone" placeholder="Phone (optional)" value={phone} onChange={setPhone} keyboard="phone-pad" />
                  <Input icon="map-pin" placeholder="City" value={location} onChange={setLocation} />
                </View>

                <PrimaryBtn label="Create account" onPress={handleSignup} busy={busy} />

                <View style={[styles.divider, { marginTop: 16 }]}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <GoogleBtn onPress={() => handleGooglePress("signup")} busy={googleBusy} label="Sign up with Google" />

                <Text style={styles.terms}>
                  By signing up you agree to our{" "}
                  <Text style={styles.termsLink}>Terms</Text> &{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </>
            )}

            {/* FORGOT */}
            {mode === "forgot" && (
              <>
                <BackBtn onPress={() => setMode("login")} />
                <View style={styles.iconHero}>
                  <Feather name="key" size={28} color={BRAND_GREEN} />
                </View>
                <Text style={styles.cardHeading}>Forgot password?</Text>
                <Text style={styles.cardSub}>
                  No worries — enter your email and we&apos;ll send you a 6-digit reset code.
                </Text>

                <View style={styles.fields}>
                  <Input icon="mail" placeholder="Your registered email" value={email} onChange={setEmail} keyboard="email-address" />
                </View>

                <PrimaryBtn label="Send reset code" onPress={handleForgot} busy={busy} />

                <View style={styles.helperBox}>
                  <Feather name="info" size={13} color="#6B7280" />
                  <Text style={styles.helperText}>
                    Email will be sent from saharaapphelp@gmail.com
                  </Text>
                </View>
              </>
            )}

            {/* RESET */}
            {mode === "reset" && (
              <>
                <BackBtn onPress={() => setMode("forgot")} />
                <View style={styles.iconHero}>
                  <Feather name="shield" size={28} color={BRAND_GREEN} />
                </View>
                <Text style={styles.cardHeading}>Enter reset code</Text>
                <Text style={styles.cardSub}>
                  We sent a 6-digit code to <Text style={{ fontWeight: "700", color: "#111827" }}>{email}</Text>
                </Text>

                <View style={styles.fields}>
                  <Input icon="mail" placeholder="Email" value={email} onChange={setEmail} keyboard="email-address" />
                  <Input icon="hash" placeholder="6-digit code" value={code} onChange={setCode} keyboard="number-pad" maxLength={6} />
                  <Input
                    icon="lock"
                    placeholder="New password (6+ chars)"
                    value={newPassword}
                    onChange={setNewPassword}
                    secure={!showNewPwd}
                    rightSlot={<PasswordToggle visible={showNewPwd} onToggle={() => setShowNewPwd((v) => !v)} />}
                  />
                </View>

                <PrimaryBtn label="Reset password" onPress={handleReset} busy={busy} />

                <TouchableOpacity onPress={() => setMode("forgot")} style={{ alignSelf: "center", marginTop: 16 }}>
                  <Text style={styles.linkText}>Didn&apos;t get a code? Resend</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footer}>
            © Sahara · saharaapphelp.com
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Input({
  icon, placeholder, value, onChange, secure, keyboard, maxLength, rightSlot,
}: {
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboard?: "email-address" | "phone-pad" | "number-pad" | "default";
  maxLength?: number;
  rightSlot?: React.ReactNode;
}) {
  return (
    <View style={styles.inputRow}>
      <Feather name={icon} size={18} color="#9CA3AF" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboard ?? "default"}
        autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
        autoCorrect={false}
        maxLength={maxLength}
      />
      {rightSlot}
    </View>
  );
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={10}>
      <Feather name={visible ? "eye-off" : "eye"} size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

function PrimaryBtn({ label, onPress, busy }: { label: string; onPress: () => void; busy: boolean }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={onPress} disabled={busy} activeOpacity={0.85}>
      <LinearGradient
        colors={[BRAND_GREEN, "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryBtnGrad}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GoogleBtn({ onPress, busy, label }: { onPress: () => void; busy: boolean; label: string }) {
  return (
    <TouchableOpacity style={styles.googleBtn} onPress={onPress} disabled={busy} activeOpacity={0.85}>
      {busy ? (
        <ActivityIndicator color="#444" size="small" />
      ) : (
        <>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn} hitSlop={10}>
      <Feather name="arrow-left" size={20} color="#374151" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_DARK },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingTitle: { fontSize: 32, fontWeight: "800", color: "#fff", marginTop: 16 },
  loadingTagline: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },

  scroll: { paddingHorizontal: 20, alignItems: "stretch", flexGrow: 1 },

  brandHeader: { alignItems: "center", marginBottom: 28, marginTop: 12 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: BRAND_DARK },

  cardHeading: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 18 },

  fields: { gap: 12 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },

  linkRight: { alignSelf: "flex-end", marginTop: 12 },
  linkText: { color: BRAND_GREEN, fontSize: 13, fontWeight: "700" },

  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 18, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 11, color: "#9CA3AF", fontWeight: "700", letterSpacing: 1 },

  outlineBtn: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  outlineBtnText: { color: "#111827", fontWeight: "700", fontSize: 15 },

  terms: { fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 16, lineHeight: 18 },
  termsLink: { color: BRAND_GREEN, fontWeight: "600" },

  iconHero: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  helperBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  helperText: { fontSize: 12, color: "#6B7280", flex: 1 },

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },

  footer: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 24,
    fontWeight: "500",
  },

  guestSection: {
    marginTop: 20,
  },
  guestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  guestDividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  guestHeaderText: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", letterSpacing: 0.5 },
  guestSubText: { fontSize: 12, color: "#9CA3AF", textAlign: "center", marginBottom: 12 },
  guestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  guestCard: {
    width: "48%",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    minHeight: 80,
    justifyContent: "center",
  },
  guestEmoji: { fontSize: 24 },
  guestName: { fontSize: 12, fontWeight: "700", color: "#4B5563", textAlign: "center" },
  guestCity: { fontSize: 11, color: "#7C3AED", fontWeight: "600" },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleIcon: { fontSize: 17, fontWeight: "900", color: "#4285F4" },
  googleBtnText: { fontSize: 15, fontWeight: "700", color: "#111827" },
});
