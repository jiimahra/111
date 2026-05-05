import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import { CaseType, UrgencyLevel, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const URGENCY_OPTIONS: {
  value: UrgencyLevel;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    value: "critical",
    label: "Critical",
    desc: "Life at immediate risk",
    color: "#DC2626",
  },
  {
    value: "high",
    label: "High",
    desc: "Urgent, hours to act",
    color: "#F97316",
  },
  {
    value: "medium",
    label: "Medium",
    desc: "Needs help within a day",
    color: "#F59E0B",
  },
  {
    value: "low",
    label: "Low",
    desc: "Can wait a few days",
    color: "#16A34A",
  },
];

const VOLUNTEER_COUNTS = [1, 2, 3, 5, 10];

export default function AlertScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCase, profile } = useApp();
  const [type, setType] = useState<CaseType>("human");
  const [urgency, setUrgency] = useState<UrgencyLevel>("high");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [volunteersNeeded, setVolunteersNeeded] = useState(2);
  const [donationsGoal, setDonationsGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in title, description, and location."
      );
      return;
    }
    setSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCase({
      type,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      urgency,
      reportedBy: profile.name || "Anonymous",
      volunteersNeeded,
      donationsGoal: donationsGoal ? parseInt(donationsGoal, 10) : undefined,
    });
    setTitle("");
    setDescription("");
    setLocation("");
    setDonationsGoal("");
    setVolunteersNeeded(2);
    setSubmitting(false);
    Alert.alert(
      "Alert Posted",
      "Your emergency alert has been posted. The community has been notified."
    );
  };

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
          Report Emergency
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Help arrives faster with clear details
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Emergency Type
        </Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              {
                borderColor:
                  type === "human" ? "#2563EB" : colors.border,
                backgroundColor:
                  type === "human" ? "#EFF6FF" : colors.card,
              },
            ]}
            onPress={() => setType("human")}
          >
            <Feather
              name="user"
              size={26}
              color={type === "human" ? "#2563EB" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.typeBtnLabel,
                {
                  color:
                    type === "human" ? "#2563EB" : colors.foreground,
                },
              ]}
            >
              Human
            </Text>
            <Text
              style={[styles.typeBtnSub, { color: colors.mutedForeground }]}
            >
              Person in crisis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              {
                borderColor:
                  type === "animal" ? "#059669" : colors.border,
                backgroundColor:
                  type === "animal" ? "#ECFDF5" : colors.card,
              },
            ]}
            onPress={() => setType("animal")}
          >
            <MaterialCommunityIcons
              name="paw"
              size={26}
              color={type === "animal" ? "#059669" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.typeBtnLabel,
                {
                  color:
                    type === "animal" ? "#059669" : colors.foreground,
                },
              ]}
            >
              Animal
            </Text>
            <Text
              style={[styles.typeBtnSub, { color: colors.mutedForeground }]}
            >
              Animal rescue
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Urgency Level
        </Text>
        <View style={styles.urgencyGrid}>
          {URGENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.urgencyBtn,
                {
                  borderColor:
                    urgency === opt.value ? opt.color : colors.border,
                  backgroundColor:
                    urgency === opt.value
                      ? opt.color + "12"
                      : colors.card,
                },
              ]}
              onPress={() => setUrgency(opt.value)}
            >
              <View
                style={[styles.urgencyDot, { backgroundColor: opt.color }]}
              />
              <View style={styles.urgencyTextWrap}>
                <Text
                  style={[
                    styles.urgencyBtnLabel,
                    {
                      color:
                        urgency === opt.value
                          ? opt.color
                          : colors.foreground,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.urgencyBtnSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {opt.desc}
                </Text>
              </View>
              {urgency === opt.value && (
                <Feather name="check" size={16} color={opt.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Title *
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
          placeholder="Brief description of the situation"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Description *
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Provide details — what happened, what's needed..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Location *
        </Text>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather
            name="map-pin"
            size={16}
            color={colors.mutedForeground}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.inputInRow, { color: colors.foreground }]}
            placeholder="Nearest landmark or address"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Volunteers Needed
        </Text>
        <View style={styles.counterRow}>
          {VOLUNTEER_COUNTS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.counterBtn,
                {
                  backgroundColor:
                    volunteersNeeded === n ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setVolunteersNeeded(n)}
            >
              <Text
                style={[
                  styles.counterBtnText,
                  {
                    color:
                      volunteersNeeded === n
                        ? "#fff"
                        : colors.mutedForeground,
                  },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Donation Goal (₹) — Optional
        </Text>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.currencySymbol, { color: colors.mutedForeground }]}
          >
            ₹
          </Text>
          <TextInput
            style={[styles.inputInRow, { color: colors.foreground }]}
            placeholder="Leave blank if donations not needed"
            placeholderTextColor={colors.mutedForeground}
            value={donationsGoal}
            onChangeText={setDonationsGoal}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              opacity: submitting ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Feather name="alert-triangle" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {submitting ? "Posting..." : "Post Emergency Alert"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
  },
  typeBtnLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  typeBtnSub: {
    fontSize: 11,
  },
  urgencyGrid: {
    gap: 8,
    marginBottom: 20,
  },
  urgencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 100,
  },
  urgencyTextWrap: {
    flex: 1,
  },
  urgencyBtnLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  urgencyBtnSub: {
    fontSize: 11,
    marginTop: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 15,
    marginRight: 6,
  },
  inputInRow: {
    flex: 1,
    fontSize: 14,
  },
  counterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
