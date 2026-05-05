import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
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

type FilterType = "all" | "human" | "animal" | "critical";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "human", label: "Human" },
  { key: "animal", label: "Animal" },
  { key: "critical", label: "Critical" },
];

export default function HomeScreen() {
  const { cases } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    const active = cases.filter((c) => c.status !== "resolved");
    switch (filter) {
      case "human":
        return active.filter((c) => c.type === "human");
      case "animal":
        return active.filter((c) => c.type === "animal");
      case "critical":
        return active.filter((c) => c.urgency === "critical");
      default:
        return active;
    }
  }, [cases, filter]);

  const activeCases = cases.filter((c) => c.status === "active").length;
  const criticalCases = cases.filter(
    (c) => c.urgency === "critical" && c.status !== "resolved"
  ).length;

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const ListHeader = (
    <>
      <LinearGradient
        colors={["#E85D04", "#BF4800"]}
        style={[styles.headerGradient, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>सहारा</Text>
            <Text style={styles.tagline}>
              हाथ मदद का, साथ इंसानियत का
            </Text>
          </View>
          <View style={styles.notifBtn}>
            <Feather name="bell" size={22} color="#fff" />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Feather name="alert-circle" size={14} color="#fff" />
            <Text style={styles.statPillText}>{activeCases} Active</Text>
          </View>
          <View style={styles.statPill}>
            <Feather name="zap" size={14} color="#fff" />
            <Text style={styles.statPillText}>{criticalCases} Critical</Text>
          </View>
        </View>
      </LinearGradient>

      <View
        style={[styles.filtersRow, { backgroundColor: colors.background }]}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f.key ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    filter === f.key ? "#fff" : colors.mutedForeground,
                },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<EmergencyCase>
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CaseCard item={item} />}
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
              No active cases
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              All clear in this category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  appName: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
    gap: 5,
  },
  statPillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
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
