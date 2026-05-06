import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Hospital {
  id: string;
  name: string;
  type: "hospital" | "vet";
  address: string;
  distance: string;
  phone?: string;
  open: boolean;
}

const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "1",
    name: "Jawaharlal Nehru Hospital",
    type: "hospital",
    address: "JLN Marg, Ajmer, Rajasthan 305001",
    distance: "1.2 km",
    phone: "01452-629100",
    open: true,
  },
  {
    id: "2",
    name: "Mahatma Gandhi District Hospital",
    type: "hospital",
    address: "Hospital Road, Nasirabad, Ajmer",
    distance: "2.8 km",
    phone: "01452-627001",
    open: true,
  },
  {
    id: "3",
    name: "Pushkar Animal Hospital & Veterinary Clinic",
    type: "vet",
    address: "Pushkar Road, Ajmer",
    distance: "3.5 km",
    phone: "9828012345",
    open: true,
  },
  {
    id: "4",
    name: "Apollo Clinic Ajmer",
    type: "hospital",
    address: "Vaishali Nagar, Ajmer",
    distance: "4.1 km",
    phone: "1800-103-1555",
    open: false,
  },
  {
    id: "5",
    name: "Government Veterinary Hospital",
    type: "vet",
    address: "Ramganj, Ajmer",
    distance: "5.0 km",
    phone: "01452-628800",
    open: true,
  },
];

function HospitalCard({ item }: { item: Hospital }) {
  const colors = useColors();
  const isVet = item.type === "vet";

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
            styles.iconBox,
            { backgroundColor: isVet ? "#ECFDF5" : "#EFF6FF" },
          ]}
        >
          <Text style={styles.iconEmoji}>{isVet ? "🐾" : "🏥"}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View style={styles.typeBadgeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isVet ? "#DCFCE7" : "#DBEAFE" },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: isVet ? "#166534" : "#1E40AF" },
                ]}
              >
                {isVet ? "Veterinary" : "Hospital"}
              </Text>
            </View>
            <View
              style={[
                styles.openBadge,
                { backgroundColor: item.open ? "#DCFCE7" : "#FEE2E2" },
              ]}
            >
              <Text
                style={[
                  styles.openBadgeText,
                  { color: item.open ? "#166534" : "#DC2626" },
                ]}
              >
                {item.open ? "● Open" : "● Closed"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={12} color="#059669" />
        <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
          {item.address}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.distanceRow}>
          <Feather name="navigation" size={12} color={colors.mutedForeground} />
          <Text style={[styles.distanceText, { color: colors.mutedForeground }]}>
            {item.distance}
          </Text>
        </View>
        {item.phone && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
          >
            <Feather name="phone" size={13} color="#1E3A5F" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function HospitalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [locationGranted, setLocationGranted] = useState(false);
  const [filter, setFilter] = useState<"all" | "hospital" | "vet">("all");
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered =
    filter === "all"
      ? MOCK_HOSPITALS
      : MOCK_HOSPITALS.filter((h) => h.type === filter);

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setLocationGranted(true);
    } else {
      Alert.alert(
        "Permission Denied",
        "Location access is needed to find hospitals near you."
      );
    }
  };

  if (!locationGranted) {
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
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 22 }}>🏥</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Nearby Hospitals
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Find hospitals and veterinary clinics around you
          </Text>
        </View>

        <View style={styles.permissionCard}>
          <View
            style={[
              styles.permIconBox,
              { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
            ]}
          >
            <Feather name="map-pin" size={32} color="#059669" />
          </View>
          <Text style={[styles.permTitle, { color: colors.foreground }]}>
            लोकेशन एक्सेस आवश्यक
          </Text>
          <Text style={[styles.permDesc, { color: colors.mutedForeground }]}>
            अपने आसपास के अस्पताल और पशु चिकित्सा क्लीनिक खोजने के लिए कृपया
            लोकेशन परमिशन दें।
          </Text>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleGetLocation}
          >
            <Feather name="map-pin" size={16} color="#fff" />
            <Text style={styles.locationBtnText}>लोकेशन एक्सेस दें</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<Hospital>
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HospitalCard item={item} />}
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
              <View style={styles.headerIcon}>
                <Text style={{ fontSize: 22 }}>🏥</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Nearby Hospitals
              </Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                Hospitals & veterinary clinics near Ajmer
              </Text>
            </View>

            <View style={styles.filterRow}>
              {(["all", "hospital", "vet"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        filter === f ? "#1E3A5F" : colors.muted,
                    },
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: filter === f ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {f === "all" ? "All" : f === "hospital" ? "🏥 Hospitals" : "🐾 Veterinary"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {},
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerIcon: { marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700", marginBottom: 3 },
  headerSub: { fontSize: 13, textAlign: "center" },

  permissionCard: {
    margin: 24,
    padding: 28,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  permIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  permTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  permDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  locationBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  filterText: { fontSize: 13, fontWeight: "600" },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: { flexDirection: "row", gap: 12, marginBottom: 10 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", marginBottom: 6, lineHeight: 20 },
  typeBadgeRow: { flexDirection: "row", gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  openBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  openBadgeText: { fontSize: 11, fontWeight: "600" },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 10,
  },
  addressText: { fontSize: 12, flex: 1, lineHeight: 17 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  distanceText: { fontSize: 12, fontWeight: "500" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: { fontSize: 13, fontWeight: "600", color: "#1E3A5F" },
});
