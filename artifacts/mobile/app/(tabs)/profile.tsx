import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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
  const { profile, donations, updateProfile } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
    });
    setEditing(false);
  };

  const handleEdit = () => {
    if (editing) {
      handleSave();
    } else {
      setName(profile.name);
      setPhone(profile.phone);
      setLocation(profile.location);
      setEditing(true);
    }
  };

  const recentDonations = donations.slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + 100 },
      ]}
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
        <TouchableOpacity onPress={handleEdit}>
          <Text style={[styles.editText, { color: colors.primary }]}>
            {editing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
        {!editing && (
          <>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {profile.name || "Set your name"}
            </Text>
            <Text
              style={[styles.profileLocation, { color: colors.mutedForeground }]}
            >
              {profile.location}
            </Text>
            {profile.phone !== "" && (
              <Text
                style={[
                  styles.profilePhone,
                  { color: colors.mutedForeground },
                ]}
              >
                {profile.phone}
              </Text>
            )}
          </>
        )}
      </View>

      {editing && (
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Full Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Your name"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Phone
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Location
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Your city"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
          />
        </View>
      )}

      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          My Impact
        </Text>
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="users" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {profile.casesHelped}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Cases Helped
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="heart" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              ₹{profile.totalDonated.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Donated
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="gift" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {donations.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Donations
            </Text>
          </View>
        </View>
      </View>

      {recentDonations.length > 0 && (
        <View style={styles.donationsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Donations
          </Text>
          {recentDonations.map((d) => (
            <View
              key={d.id}
              style={[
                styles.donationItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.donationIcon,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Feather name="heart" size={14} color={colors.primary} />
              </View>
              <View style={styles.donationDetails}>
                <Text
                  style={[styles.donationCase, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {d.caseTitle}
                </Text>
                <Text
                  style={[
                    styles.donationTime,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {new Date(d.timestamp).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
              <Text style={[styles.donationAmount, { color: colors.primary }]}>
                ₹{d.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View
        style={[
          styles.missionCard,
          { backgroundColor: colors.accent, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.missionText, { color: colors.primary }]}>
          "कोई भी अकेला महसूस न करे, क्योंकि हम सब एक-दूसरे का 'सहारा' हैं।"
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  editText: {
    fontSize: 15,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileLocation: {
    fontSize: 13,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  donationsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  donationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  donationIcon: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  donationDetails: {
    flex: 1,
  },
  donationCase: {
    fontSize: 13,
    fontWeight: "500",
  },
  donationTime: {
    fontSize: 11,
    marginTop: 1,
  },
  donationAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  missionCard: {
    marginHorizontal: 20,
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
});
