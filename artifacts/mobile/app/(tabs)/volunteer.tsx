import { Feather } from "@expo/vector-icons";
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

import { HelpRequest, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { key: "all", label: "All", emoji: "🌟" },
  { key: "food", label: "Food", emoji: "🍲" },
  { key: "medical", label: "Medical", emoji: "🏥" },
  { key: "job", label: "Job", emoji: "💼" },
  { key: "animal", label: "Animal", emoji: "🐾" },
  { key: "education", label: "Education", emoji: "📚" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "need_help", label: "Need Help" },
  { key: "give_help", label: "Giving Help" },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ExploreCard({ item }: { item: HelpRequest }) {
  const colors = useColors();
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const isNeedHelp = item.helpType === "need_help";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.catBadge,
            { backgroundColor: isNeedHelp ? "#FEF3C7" : "#DCFCE7" },
          ]}
        >
          <Text style={styles.catEmoji}>{cat?.emoji}</Text>
          <Text
            style={[
              styles.catText,
              { color: isNeedHelp ? "#92400E" : "#166534" },
            ]}
          >
            {cat?.label}
          </Text>
        </View>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isNeedHelp ? "#FEE2E2" : "#DCFCE7" },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              { color: isNeedHelp ? "#DC2626" : "#16A34A" },
            ]}
          >
            {isNeedHelp ? "● Need Help" : "● Giving Help"}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.cardTitle, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text
        style={[styles.cardDesc, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {item.location}
          </Text>
        </View>
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          {timeAgo(item.timestamp)}
        </Text>
      </View>
      {item.contactPhone && (
        <TouchableOpacity
          style={styles.contactBtn}
        >
          <Feather name="phone" size={13} color="#1E3A5F" />
          <Text style={styles.contactBtnText}>Contact: {item.contactPhone}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const { requests } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCat, setSelectedCat] = useState("all");
  const [helpFilter, setHelpFilter] = useState("all");
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered = useMemo(() => {
    let list = requests.filter((r) => r.status !== "resolved");
    if (selectedCat !== "all") list = list.filter((r) => r.category === selectedCat);
    if (helpFilter !== "all") list = list.filter((r) => r.helpType === helpFilter);
    return list;
  }, [requests, selectedCat, helpFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<HelpRequest>
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExploreCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
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
                Explore / खोजें
              </Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                Browse all requests in your area
              </Text>
            </View>

            <View style={styles.filtersWrap}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        helpFilter === f.key ? "#1E3A5F" : colors.muted,
                    },
                  ]}
                  onPress={() => setHelpFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color:
                          helpFilter === f.key ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.catFiltersWrap}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor:
                        selectedCat === cat.key ? "#FFF7ED" : colors.card,
                      borderColor:
                        selectedCat === cat.key ? "#F97316" : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCat(cat.key)}
                >
                  <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.catChipText,
                      {
                        color:
                          selectedCat === cat.key
                            ? "#F97316"
                            : colors.foreground,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[styles.countText, { color: colors.mutedForeground }]}
            >
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} found
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No requests found
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              Try a different category or filter
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 0 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", marginBottom: 2 },
  headerSub: { fontSize: 13 },
  filtersWrap: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  catFiltersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  catChipEmoji: { fontSize: 13 },
  catChipText: { fontSize: 12, fontWeight: "600" },
  countText: { fontSize: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  catEmoji: { fontSize: 11 },
  catText: { fontSize: 11, fontWeight: "600" },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  typeText: { fontSize: 11, fontWeight: "600" },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4, lineHeight: 21 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  contactBtnText: { fontSize: 12, fontWeight: "600", color: "#1E3A5F" },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 13 },
});
