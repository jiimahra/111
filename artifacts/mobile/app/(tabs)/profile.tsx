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

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const { profile, requests, updateProfile } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [location, setLocation] = useState(profile.location);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const isLoggedIn = !!profile.name;
  const myRequests = requests.filter((r) => r.postedBy === profile.name);

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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Profile
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.loginScroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginCard}>
            <Image
              source={require("@/assets/images/sahara-logo.png")}
              style={styles.loginLogoImg}
              resizeMode="contain"
            />
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.loginSub, { color: colors.mutedForeground }]}>
              Enter your details to set up your profile
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Full Name
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.inputInRow, { color: colors.foreground }]}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Email address
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.inputInRow, { color: colors.foreground }]}
                placeholder="name@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Phone
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.inputInRow, { color: colors.foreground }]}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              City / Location
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Feather name="map-pin" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.inputInRow, { color: colors.foreground }]}
                placeholder="Ajmer"
                placeholderTextColor={colors.mutedForeground}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <TouchableOpacity style={styles.signInBtn} onPress={handleSave}>
              <Text style={styles.signInBtnText}>Join Sahara →</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
                Or continue with
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[
                styles.googleBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={styles.googleBtnText}>G</Text>
              <Text style={[styles.googleBtnLabel, { color: colors.foreground }]}>
                Continue with Google
              </Text>
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
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Profile
        </Text>
        <TouchableOpacity onPress={() => (editing ? handleSave() : setEditing(true))}>
          <Text style={[styles.editText, { color: "#F97316" }]}>
            {editing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={["#F97316", "#EF4444"]}
          style={styles.avatar}
        >
          <Text style={styles.avatarInitial}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        {!editing && (
          <>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {profile.name}
            </Text>
            {profile.email ? (
              <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
                {profile.email}
              </Text>
            ) : null}
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
              📍 {profile.location}
            </Text>
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
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {field.label}
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
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
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statValue, { color: "#F97316" }]}>
            {profile.helpedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            People Helped
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statValue, { color: "#F97316" }]}>
            {profile.requestsPosted}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Requests Posted
          </Text>
        </View>
      </View>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <View style={styles.myRequestsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            My Requests
          </Text>
          {myRequests.slice(0, 3).map((r) => (
            <View
              key={r.id}
              style={[
                styles.myReqItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.myReqTitle, { color: colors.foreground }]} numberOfLines={1}>
                {r.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      r.status === "active" ? "#DCFCE7" : "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: r.status === "active" ? "#166534" : "#92400E" },
                  ]}
                >
                  {r.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Mission */}
      <View
        style={[
          styles.missionCard,
          { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
        ]}
      >
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  loginLogoImg: {
    width: 160,
    height: 80,
    alignSelf: "center",
    marginBottom: 8,
  },
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
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
  googleBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4285F4",
  },
  googleBtnLabel: { fontSize: 14, fontWeight: "600" },

  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 6 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarInitial: { fontSize: 32, fontWeight: "800", color: "#fff" },
  profileName: { fontSize: 20, fontWeight: "700" },
  profileSub: { fontSize: 13 },

  formSection: { paddingHorizontal: 16, paddingBottom: 8 },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: "center" },

  myRequestsSection: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  myReqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  myReqTitle: { fontSize: 13, fontWeight: "500", flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginLeft: 8,
  },
  statusText: { fontSize: 11, fontWeight: "600" },

  missionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  missionText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
  },
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
