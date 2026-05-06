import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image } from "react-native";
import {
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
    darkBg: "#78350F",
    lightText: "#92400E",
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
                  <Feather name="clock" size={13} color="#92400E" />
                  <Text style={[styles.actionBtnText, { color: "#92400E" }]}>Mark In Progress</Text>
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

export default function ProfileScreen() {
  const { profile, requests, updateProfile, updateRequestStatus, deleteRequest } = useApp();
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

  if (!isLoggedIn && !editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: topPad + 12,
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.loginScroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.loginCard, { backgroundColor: colors.card }]}>
            <Image
              source={require("@/assets/images/sahara-logo.png")}
              style={styles.loginLogoImg}
              resizeMode="contain"
            />
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>Welcome back</Text>
            <Text style={[styles.loginSub, { color: colors.mutedForeground }]}>
              Enter your details to set up your profile
            </Text>

            {[
              { label: "Full Name", value: name, setter: setName, icon: "user", placeholder: "Your full name", type: "default" },
              { label: "Email address", value: email, setter: setEmail, icon: "mail", placeholder: "name@example.com", type: "email-address" },
              { label: "Phone", value: phone, setter: setPhone, icon: "phone", placeholder: "+91 98765 43210", type: "phone-pad" },
              { label: "City / Location", value: location, setter: setLocation, icon: "map-pin", placeholder: "Ajmer", type: "default" },
            ].map((field) => (
              <View key={field.label}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name={field.icon as any} size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.inputInRow, { color: colors.foreground }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.type as any}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.signInBtn} onPress={handleSave}>
              <Text style={styles.signInBtnText}>Join Sahara →</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>Or continue with</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.googleBtnText}>G</Text>
              <Text style={[styles.googleBtnLabel, { color: colors.foreground }]}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
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
          <Text style={[styles.editText, { color: "#F97316" }]}>{editing ? "Save" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <LinearGradient colors={["#F97316", "#EF4444"]} style={styles.avatar}>
          <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        {!editing && (
          <>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
            {profile.email ? (
              <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>{profile.email}</Text>
            ) : null}
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>📍 {profile.location}</Text>
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
          <Text style={[styles.statValue, { color: "#F97316" }]}>{profile.helpedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>People Helped</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: "#F97316" }]}>{profile.requestsPosted}</Text>
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
                  <Text style={[styles.miniChipText, { color: "#92400E" }]}>{inProgressCount} in progress</Text>
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
                <Text style={[styles.showMoreText, { color: "#F97316" }]}>
                  {showAll ? "Show Less ↑" : `Show All ${myRequests.length} Requests ↓`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Mission */}
      <View style={[styles.missionCard, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
        <Text style={[styles.missionText, { color: "#92400E" }]}>
          "कोई भी अकेला महसूस न करे, क्योंकि हम सब एक-दूसरे का 'सहारा' हैं।"
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.border }]}
        onPress={() => {
          updateProfile({ name: "", email: "", phone: "" });
          setName("");
          setEmail("");
          setPhone("");
          setEditing(false);
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
    backgroundColor: "#F97316",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
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
