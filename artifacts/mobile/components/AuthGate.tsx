import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { authApi } from "@/lib/auth";

type Mode = "login" | "signup" | "forgot" | "reset";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, setAuthedProfile, loading } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);

  // Shared form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Ajmer");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Image
          source={require("@/assets/images/sahara-logo.png")}
          style={{ width: 160, height: 60 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (profile.name) {
    return <>{children}</>;
  }

  const showError = (msg: string) => Alert.alert("Error", msg);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return showError("Please enter email and password.");
    }
    setBusy(true);
    try {
      const { user } = await authApi.login({ email, password });
      setAuthedProfile(user);
    } catch (e: any) {
      showError(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      return showError("Name, email और password ज़रूरी हैं।");
    }
    if (password.length < 6) {
      return showError("Password कम से कम 6 अक्षर का होना चाहिए।");
    }
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
      Alert.alert("Email sent", `Reset code भेजा गया ${email} पर। अपना inbox check करें।`);
      setMode("reset");
    } catch (e: any) {
      showError(e.message || "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim() || code.length !== 6 || newPassword.length < 6) {
      return showError("6-digit code और 6+ अक्षर का नया password डालें।");
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

  const renderInput = (
    icon: keyof typeof Feather.glyphMap,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    extra?: { secure?: boolean; keyboard?: "email-address" | "phone-pad" | "number-pad" | "default"; maxLength?: number },
  ) => (
    <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChange}
        secureTextEntry={extra?.secure}
        keyboardType={extra?.keyboard ?? "default"}
        autoCapitalize={extra?.keyboard === "email-address" ? "none" : "sentences"}
        maxLength={extra?.maxLength}
      />
    </View>
  );

  const titleByMode: Record<Mode, { title: string; sub: string }> = {
    login: { title: "Welcome back", sub: "अपने Sahara account में login करें" },
    signup: { title: "Join the community", sub: "नया account बनाएं" },
    forgot: { title: "Forgot password?", sub: "अपना email डालें — reset code भेजेंगे" },
    reset: { title: "Reset password", sub: `Code भेजा गया ${email} पर` },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#064E3B", "#065F46", "#047857"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBox}
        >
          <Image
            source={require("@/assets/images/sahara-logo.png")}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>सहारा</Text>
          <Text style={styles.heroSub}>Together we make a difference</Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{titleByMode[mode].title}</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{titleByMode[mode].sub}</Text>

          {/* LOGIN */}
          {mode === "login" && (
            <>
              {renderInput("mail", "Email", email, setEmail, { keyboard: "email-address" })}
              <View style={{ height: 10 }} />
              {renderInput("lock", "Password", password, setPassword, { secure: true })}

              <TouchableOpacity onPress={() => setMode("forgot")} style={styles.linkRight}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={handleLogin} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Login →</Text>}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: colors.mutedForeground }]}>New here? </Text>
                <TouchableOpacity onPress={() => setMode("signup")}>
                  <Text style={styles.switchLink}>Create account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <>
              {renderInput("user", "Full Name *", name, setName)}
              <View style={{ height: 10 }} />
              {renderInput("mail", "Email *", email, setEmail, { keyboard: "email-address" })}
              <View style={{ height: 10 }} />
              {renderInput("lock", "Password * (6+ chars)", password, setPassword, { secure: true })}
              <View style={{ height: 10 }} />
              {renderInput("phone", "Phone (optional)", phone, setPhone, { keyboard: "phone-pad" })}
              <View style={{ height: 10 }} />
              {renderInput("map-pin", "City", location, setLocation)}

              <TouchableOpacity style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={handleSignup} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign up →</Text>}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setMode("login")}>
                  <Text style={styles.switchLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* FORGOT */}
          {mode === "forgot" && (
            <>
              {renderInput("mail", "Your registered email", email, setEmail, { keyboard: "email-address" })}

              <TouchableOpacity style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={handleForgot} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send reset code</Text>}
              </TouchableOpacity>

              <Text style={[styles.helper, { color: colors.mutedForeground }]}>
                Email saharaapphelp@gmail.com से आएगा।
              </Text>

              <View style={styles.switchRow}>
                <TouchableOpacity onPress={() => setMode("login")}>
                  <Text style={styles.switchLink}>← Back to login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* RESET */}
          {mode === "reset" && (
            <>
              {renderInput("mail", "Email", email, setEmail, { keyboard: "email-address" })}
              <View style={{ height: 10 }} />
              {renderInput("hash", "6-digit code", code, setCode, { keyboard: "number-pad", maxLength: 6 })}
              <View style={{ height: 10 }} />
              {renderInput("lock", "New password (6+ chars)", newPassword, setNewPassword, { secure: true })}

              <TouchableOpacity style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={handleReset} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Reset password</Text>}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <TouchableOpacity onPress={() => setMode("forgot")}>
                  <Text style={styles.switchLink}>Resend code</Text>
                </TouchableOpacity>
                <Text style={[styles.switchText, { color: colors.mutedForeground }]}>  ·  </Text>
                <TouchableOpacity onPress={() => setMode("login")}>
                  <Text style={styles.switchLink}>Back to login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16 },
  heroBox: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  heroLogo: { width: 120, height: 44, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 4 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.9)", textAlign: "center" },
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  cardSub: { fontSize: 13, marginBottom: 18 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14 },
  linkRight: { alignSelf: "flex-end", marginTop: 8 },
  linkText: { color: "#059669", fontSize: 13, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 13 },
  switchLink: { color: "#059669", fontWeight: "700", fontSize: 13 },
  helper: { fontSize: 11, textAlign: "center", marginTop: 12 },
});
