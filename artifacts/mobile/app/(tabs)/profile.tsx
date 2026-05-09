import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

      {expanded && (
        <View style={[styles.myReqExpanded, { borderTopColor: colors.border }]}>
          <Text style={[styles.myReqDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
          <Text style={[styles.myReqTimestamp, { color: colors.mutedForeground }]}>
            Posted: {new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>

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

          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Feather name="trash-2" size={13} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "");

function AuthScreen({ topPad, insets }: { topPad: number; insets: { bottom: number } }) {
  const { setAuthedProfile } = useApp();
  const colors = useColors();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

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

  function handleGooglePress() {
    const url = `${API_BASE}/api/auth/google/start?mode=${tab}`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      const { Linking } = require("react-native");
      void Linking.openURL(url);
    }
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
                  <TextInput
                    style={[styles.inputInRow, { color: fg }]}
                    placeholder="name@example.com"
                    placeholderTextColor={muted}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
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
                  <TextInput
                    style={[styles.inputInRow, { color: fg }]}
                    placeholder="123456"
                    placeholderTextColor={muted}
                    value={resetCode}
                    onChangeText={setResetCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <Text style={[styles.fieldLabel, { color: muted }]}>Naya Password</Text>
                <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                  <Feather name="lock" size={16} color={muted} />
                  <TextInput
                    style={[styles.inputInRow, { color: fg }]}
                    placeholder="Min 6 characters"
                    placeholderTextColor={muted}
                    value={resetNewPw}
                    onChangeText={setResetNewPw}
                    secureTextEntry
                  />
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

      <ScrollView contentContainerStyle={[styles.loginScroll, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.loginCard, { backgroundColor: card }]}>
          <Text style={[styles.loginTitle, { color: fg }]}>🙏 सहारा में आपका स्वागत है</Text>
          <Text style={[styles.loginSub, { color: muted }]}>Login karke apni profile dekhen aur help requests manage karen.</Text>

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabBtn, tab === "login" && styles.tabBtnActive]} onPress={() => setTab("login")}>
              <Text style={[styles.tabBtnText, { color: tab === "login" ? "#fff" : muted }]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, tab === "signup" && styles.tabBtnActive]} onPress={() => setTab("signup")}>
              <Text style={[styles.tabBtnText, { color: tab === "signup" ? "#fff" : muted }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {tab === "login" ? (
            <>
              <Text style={[styles.fieldLabel, { color: muted }]}>Email Address</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="mail" size={16} color={muted} />
                <TextInput
                  style={[styles.inputInRow, { color: fg }]}
                  placeholder="name@example.com"
                  placeholderTextColor={muted}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="lock" size={16} color={muted} />
                <TextInput
                  style={[styles.inputInRow, { color: fg }]}
                  placeholder="Password"
                  placeholderTextColor={muted}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showLoginPw}
                />
                <TouchableOpacity onPress={() => setShowLoginPw(!showLoginPw)}>
                  <Feather name={showLoginPw ? "eye-off" : "eye"} size={16} color={muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setForgotMode(true)} style={{ alignSelf: "flex-end", marginBottom: 12 }}>
                <Text style={{ color: "#22C55E", fontSize: 13 }}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.signInBtn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInBtnText}>Login →</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: muted }]}>Poora Naam</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="user" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Aapka naam" placeholderTextColor={muted} value={signupName} onChangeText={setSignupName} />
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Email Address</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="mail" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="name@example.com" placeholderTextColor={muted} value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="lock" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Min 6 characters" placeholderTextColor={muted} value={signupPassword} onChangeText={setSignupPassword} secureTextEntry={!showSignupPw} />
                <TouchableOpacity onPress={() => setShowSignupPw(!showSignupPw)}>
                  <Feather name={showSignupPw ? "eye-off" : "eye"} size={16} color={muted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Phone (Optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="phone" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="9876543210" placeholderTextColor={muted} value={signupPhone} onChangeText={setSignupPhone} keyboardType="phone-pad" />
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Location (Optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Feather name="map-pin" size={16} color={muted} />
                <TextInput style={[styles.inputInRow, { color: fg }]} placeholder="Aapka sheher" placeholderTextColor={muted} value={signupLocation} onChangeText={setSignupLocation} />
              </View>

              <TouchableOpacity style={[styles.signInBtn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInBtnText}>Account Banao →</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: border }]} />
            <Text style={[styles.orText, { color: muted }]}>ya</Text>
            <View style={[styles.orLine, { backgroundColor: border }]} />
          </View>

          <TouchableOpacity style={[styles.googleBtn, { borderColor: border, backgroundColor: card }]} onPress={handleGooglePress}>
            <Text style={[styles.googleBtnText, { color: fg }]}>🌐 Google se continue karen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, requests, updateProfile, updateRequestStatus, deleteRequest, logout } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top;

  const isLoggedIn = !!profile.id;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [photoUri, setPhotoUri] = useState(profile.photoUri ?? "");

  const myRequests = requests.filter((r) => r.userId === profile.id);

  if (!isLoggedIn) {
    return <AuthScreen topPad={topPad} insets={insets} />;
  }

  const bg = colors.background;
  const card = colors.card;
  const fg = colors.foreground;
  const muted = colors.mutedForeground;
  const border = colors.border;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      updateProfile({ photoUri: uri });
    }
  }

  function saveEdit() {
    updateProfile({ name: editName.trim(), phone: editPhone.trim(), location: editLocation.trim() });
    setEditing(false);
  }

  function confirmLogout() {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: bg, borderBottomColor: border }]}>
        <Text style={[styles.headerTitle, { color: fg }]}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Feather name={editing ? "x" : "edit-2"} size={20} color={fg} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.profileBanner}>
          <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{(profile.name || "U")[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          {editing ? (
            <TextInput
              style={styles.editNameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Aapka naam"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
          ) : (
            <Text style={styles.profileName}>{profile.name || "User"}</Text>
          )}

          <View style={styles.saharaIdRow}>
            <Text style={styles.saharaIdText}>#{profile.saharaId || "———"}</Text>
            <TouchableOpacity onPress={() => { void Clipboard.setStringAsync(profile.saharaId || ""); Alert.alert("Copied!", "Sahara ID copied."); }}>
              <Feather name="copy" size={13} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.statNum, { color: fg }]}>{profile.helpedCount}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>लोगों की मदद</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.statNum, { color: fg }]}>{profile.requestsPosted}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Requests Posted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.statNum, { color: fg }]}>{myRequests.filter(r => r.status === "active").length}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Active</Text>
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: fg }]}>Account Details</Text>

          <View style={styles.infoRow}>
            <Feather name="mail" size={15} color={muted} />
            <Text style={[styles.infoText, { color: fg }]}>{profile.email || "—"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Feather name="phone" size={15} color={muted} />
            {editing ? (
              <TextInput style={[styles.infoEditInput, { color: fg, borderColor: border }]} value={editPhone} onChangeText={setEditPhone} placeholder="Phone number" placeholderTextColor={muted} keyboardType="phone-pad" />
            ) : (
              <Text style={[styles.infoText, { color: fg }]}>{profile.phone || "—"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Feather name="map-pin" size={15} color={muted} />
            {editing ? (
              <TextInput style={[styles.infoEditInput, { color: fg, borderColor: border }]} value={editLocation} onChangeText={setEditLocation} placeholder="Location" placeholderTextColor={muted} />
            ) : (
              <Text style={[styles.infoText, { color: fg }]}>{profile.location || "—"}</Text>
            )}
          </View>

          {editing && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.myReqSection}>
          <Text style={[styles.sectionTitle, { color: fg, marginBottom: 12 }]}>Meri Requests ({myRequests.length})</Text>
          {myRequests.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text style={[styles.emptyText, { color: muted }]}>Abhi tak koi request nahi hai</Text>
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

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: border }]} onPress={confirmLogout}>
          <Feather name="log-out" size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  profileBanner: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  avatarWrap: { position: "relative", marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#fff" },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: "#fff" },
  avatarEditBadge: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: "#16A34A", borderRadius: 10, padding: 4, borderWidth: 2, borderColor: "#fff",
  },
  profileName: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  editNameInput: {
    fontSize: 20, fontWeight: "700", color: "#fff", borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.6)", marginBottom: 4, paddingVertical: 2, minWidth: 160, textAlign: "center",
  },
  saharaIdRow: { flexDirection: "row", alignItems: "center" },
  saharaIdText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14, marginTop: 14 },
  statCard: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center",
  },
  statNum: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: "center" },

  infoSection: {
    margin: 14, borderRadius: 14, borderWidth: 1, padding: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  infoText: { fontSize: 14, flex: 1 },
  infoEditInput: {
    flex: 1, fontSize: 14, borderBottomWidth: 1, paddingVertical: 2,
  },
  saveBtn: {
    backgroundColor: "#22C55E", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  myReqSection: { paddingHorizontal: 14, marginBottom: 8 },
  myReqCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  myReqCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  myReqCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  myReqEmoji: { fontSize: 22 },
  myReqTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  myReqMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  myReqExpanded: { borderTopWidth: 1, padding: 12 },
  myReqDesc: { fontSize: 13, marginBottom: 6, lineHeight: 18 },
  myReqTimestamp: { fontSize: 11, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  deleteBtnText: { color: "#DC2626", fontSize: 12, fontWeight: "600" },

  emptyCard: {
    borderRadius: 12, borderWidth: 1, padding: 24, alignItems: "center", gap: 8,
  },
  emptyText: { fontSize: 13 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    margin: 14, borderWidth: 1, borderRadius: 12, paddingVertical: 14,
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },

  loginScroll: { paddingHorizontal: 16, paddingTop: 20 },
  loginCard: { borderRadius: 18, padding: 20, marginBottom: 20 },
  loginTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  loginSub: { fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 18 },
  tabRow: { flexDirection: "row", marginBottom: 20, backgroundColor: "#F3F4F6", borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#22C55E" },
  tabBtnText: { fontSize: 14, fontWeight: "600" },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  inputInRow: { flex: 1, fontSize: 14 },
  signInBtn: {
    backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  orLine: { flex: 1, height: 1 },
  orText: { marginHorizontal: 10, fontSize: 12 },
  googleBtn: {
    borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center",
  },
  googleBtnText: { fontWeight: "600", fontSize: 14 },
});
