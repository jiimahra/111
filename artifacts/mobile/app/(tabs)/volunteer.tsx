import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CaseCard } from "@/components/CaseCard";
import { EmergencyCase, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function VolunteerScreen() {
  const { cases, profile, toggleVolunteer, respondToCase } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const needsHelp = cases.filter(
    (c) =>
      c.volunteersResponded < c.volunteersNeeded && c.status !== "resolved"
  );
  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleRespond = (item: EmergencyCase) => {
    const name = profile.name || "Volunteer";
    if (item.respondedBy.includes(name)) {
      Alert.alert(
        "Already Responded",
        "You have already offered to help with this case."
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    respondToCase(item.id);
    Alert.alert(
      "Thank You!",
      "You have been added as a volunteer. Be safe and stay compassionate!"
    );
  };

  const ListHeader = (
    <>
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
          Volunteer Network
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Your compassion makes a difference
        </Text>
      </View>

      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: profile.isVolunteerActive
              ? "#ECFDF5"
              : colors.card,
            borderColor: profile.isVolunteerActive
              ? "#059669"
              : colors.border,
          },
        ]}
      >
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: profile.isVolunteerActive
                  ? "#059669"
                  : colors.mutedForeground,
              },
            ]}
          />
          <View>
            <Text
              style={[
                styles.statusTitle,
                {
                  color: profile.isVolunteerActive
                    ? "#059669"
                    : colors.foreground,
                },
              ]}
            >
              {profile.isVolunteerActive ? "You are Active" : "You are Inactive"}
            </Text>
            <Text
              style={[styles.statusSub, { color: colors.mutedForeground }]}
            >
              {profile.isVolunteerActive
                ? "Showing up for those in need"
                : "Toggle to help nearby cases"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            {
              backgroundColor: profile.isVolunteerActive
                ? "#059669"
                : colors.muted,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleVolunteer();
          }}
        >
          <Text
            style={[
              styles.toggleBtnText,
              {
                color: profile.isVolunteerActive
                  ? "#fff"
                  : colors.mutedForeground,
              },
            ]}
          >
            {profile.isVolunteerActive ? "Active" : "Activate"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
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
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {needsHelp.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Need Help Now
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Cases Needing Volunteers
      </Text>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<EmergencyCase>
        data={needsHelp}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CaseCard
            item={item}
            showActions
            onRespond={() => handleRespond(item)}
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather
              name="check-circle"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              All caught up!
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              No cases need volunteers right now
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 100,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusSub: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
  },
});
