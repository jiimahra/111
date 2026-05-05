import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CaseCard } from "@/components/CaseCard";
import { EmergencyCase, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const PRESET_AMOUNTS = [100, 200, 500, 1000];

export default function DonateScreen() {
  const { cases, donations, profile, addDonation } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [donating, setDonating] = useState(false);

  const donationCases = cases.filter(
    (c) =>
      c.donationsGoal != null && c.donationsGoal > 0 && c.status !== "resolved"
  );

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleDonate = async () => {
    const amount = customAmount ? parseInt(customAmount, 10) : selectedAmount;
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid donation amount.");
      return;
    }
    if (!selectedCase) return;
    setDonating(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addDonation(selectedCase.id, selectedCase.title, amount);
    setDonating(false);
    setSelectedCase(null);
    setCustomAmount("");
    setSelectedAmount(200);
    Alert.alert(
      "Donation Received",
      `₹${amount.toLocaleString()} donated to "${selectedCase.title}". Every rupee counts!`
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
          Donate
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          हर जान कीमती है, हर मदद ज़रूरी है
        </Text>
      </View>

      <View
        style={[styles.summaryCard, { backgroundColor: colors.primary }]}
      >
        <Feather name="heart" size={20} color="#fff" />
        <View style={styles.summaryText}>
          <Text style={styles.summaryAmount}>
            ₹{profile.totalDonated.toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>Total Donated by You</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryCount}>{donations.length}</Text>
          <Text style={styles.summaryCountLabel}>Donations</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Active Campaigns
      </Text>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<EmergencyCase>
        data={donationCases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CaseCard
            item={item}
            showActions
            onDonate={() => setSelectedCase(item)}
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="heart" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No active campaigns
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              Cases needing donations will appear here
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedCase}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCase(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Make a Donation
            </Text>
            {selectedCase && (
              <Text
                style={[
                  styles.modalCaseTitle,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={2}
              >
                {selectedCase.title}
              </Text>
            )}

            <Text
              style={[
                styles.modalSectionLabel,
                { color: colors.mutedForeground },
              ]}
            >
              Select Amount
            </Text>
            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor:
                        selectedAmount === amt && !customAmount
                          ? colors.primary
                          : colors.muted,
                    },
                  ]}
                  onPress={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      {
                        color:
                          selectedAmount === amt && !customAmount
                            ? "#fff"
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[
                styles.modalSectionLabel,
                { color: colors.mutedForeground },
              ]}
            >
              Or enter custom amount
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
                style={[
                  styles.currencySymbol,
                  { color: colors.mutedForeground },
                ]}
              >
                ₹
              </Text>
              <TextInput
                style={[styles.inputInRow, { color: colors.foreground }]}
                placeholder="Enter amount"
                placeholderTextColor={colors.mutedForeground}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.muted },
                ]}
                onPress={() => setSelectedCase(null)}
              >
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: donating ? 0.7 : 1,
                  },
                ]}
                onPress={handleDonate}
                disabled={donating}
              >
                <Feather name="heart" size={16} color="#fff" />
                <Text style={styles.confirmBtnText}>
                  {donating ? "Processing..." : "Donate Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  summaryRight: {
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  summaryCountLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalCaseTitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  presetBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 15,
    marginRight: 6,
  },
  inputInRow: {
    flex: 1,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
