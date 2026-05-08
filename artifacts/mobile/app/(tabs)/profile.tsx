Import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
? https://${process.env.EXPO_PUBLIC_DOMAIN}
: "";

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

function handleGooglePress() {
const url = ${API_BASE}/api/auth/google/start?mode=${tab};
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
Alert.alert("Code Bheja!", ${forgotEmail} par 6-digit code bheja gaya hai.);
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

<ScrollView contentContai
  Import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
? https://${process.env.EXPO_PUBLIC_DOMAIN}
: "";

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

function handleGooglePress() {
const url = ${API_BASE}/api/auth/google/start?mode=${tab};
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
Alert.alert("Code Bheja!", ${forgotEmail} par 6-digit code bheja gaya hai.);
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

<ScrollView contentContai