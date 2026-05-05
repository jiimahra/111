import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { HelpRequest } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍲",
  medical: "🏥",
  job: "💼",
  animal: "🐾",
  education: "📚",
};

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface CaseCardProps {
  item: HelpRequest;
  onPress?: () => void;
}

export function CaseCard({ item, onPress }: CaseCardProps) {
  const colors = useColors();
  const isNeedHelp = item.helpType === "need_help";
  const emoji = CATEGORY_EMOJI[item.category] ?? "🙏";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.catBadge,
            { backgroundColor: isNeedHelp ? "#FEF3C7" : "#DCFCE7" },
          ]}
        >
          <Text style={styles.catEmoji}>{emoji}</Text>
          <Text
            style={[
              styles.catText,
              { color: isNeedHelp ? "#92400E" : "#166534" },
            ]}
          >
            {item.category}
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

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text
        style={[styles.description, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.meta}>
        <Feather name="map-pin" size={12} color={colors.mutedForeground} />
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          {item.location}
        </Text>
        <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>·</Text>
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          {timeAgo(item.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
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
  title: { fontSize: 15, fontWeight: "700", marginBottom: 4, lineHeight: 21 },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  metaDot: { fontSize: 11 },
});
