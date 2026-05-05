import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmergencyCase } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const URGENCY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#16A34A",
};

const URGENCY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
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
  item: EmergencyCase;
  onPress?: () => void;
  onRespond?: () => void;
  onDonate?: () => void;
  showActions?: boolean;
}

export function CaseCard({
  item,
  onPress,
  onRespond,
  onDonate,
  showActions = false,
}: CaseCardProps) {
  const colors = useColors();
  const urgencyColor = URGENCY_COLORS[item.urgency];
  const isAnimal = item.type === "animal";
  const hasDonation = item.donationsGoal != null && item.donationsGoal > 0;
  const donationPercent = hasDonation
    ? Math.min((item.donationsReceived / item.donationsGoal!) * 100, 100)
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: urgencyColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.typeIconWrap,
            { backgroundColor: isAnimal ? "#ECFDF5" : "#EFF6FF" },
          ]}
        >
          {isAnimal ? (
            <MaterialCommunityIcons name="paw" size={16} color="#059669" />
          ) : (
            <Feather name="user" size={16} color="#2563EB" />
          )}
        </View>
        <View style={styles.titleWrap}>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
        <View
          style={[
            styles.urgencyBadge,
            { backgroundColor: urgencyColor + "18" },
          ]}
        >
          <View
            style={[styles.urgencyDot, { backgroundColor: urgencyColor }]}
          />
          <Text style={[styles.urgencyLabel, { color: urgencyColor }]}>
            {URGENCY_LABELS[item.urgency]}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.description, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {item.location}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {timeAgo(item.timestamp)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="users" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {item.volunteersResponded}/{item.volunteersNeeded}
          </Text>
        </View>
      </View>

      {hasDonation && (
        <View style={styles.donationRow}>
          <View style={[styles.donationBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.donationFill,
                {
                  width: `${donationPercent}%` as `${number}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.donationText, { color: colors.mutedForeground }]}>
            ₹{item.donationsReceived.toLocaleString()} / ₹
            {item.donationsGoal!.toLocaleString()}
          </Text>
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          {onRespond && item.status !== "resolved" && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.secondary },
              ]}
              onPress={onRespond}
            >
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Respond</Text>
            </TouchableOpacity>
          )}
          {onDonate && hasDonation && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={onDonate}
            >
              <Feather name="heart" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Donate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  typeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
  },
  urgencyDot: {
    width: 5,
    height: 5,
    borderRadius: 100,
  },
  urgencyLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  meta: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
  },
  donationRow: {
    marginTop: 10,
    gap: 4,
  },
  donationBar: {
    height: 5,
    borderRadius: 100,
    overflow: "hidden",
  },
  donationFill: {
    height: "100%",
    borderRadius: 100,
  },
  donationText: {
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
