import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
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
  distanceKm: number;
  distanceText: string;
  travelTime: string;
  open: boolean | null;
  phone: string | null;
  lat: number;
  lng: number;
  emergency: boolean;
  beds: string | null;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTime(km: number) {
  const mins = Math.round((km / 35) * 60);
  if (mins < 60) return `~${mins} मिनट`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h} घंटा`;
}

function isOpenNow(openingHours?: string): boolean | null {
  if (!openingHours) return null;
  if (openingHours === "24/7" || openingHours === "00:00-24:00") return true;
  try {
    const now = new Date();
    const day = now.getDay();
    const timeNow = now.getHours() * 60 + now.getMinutes();
    const dayMap: Record<number, string[]> = {
      0: ["Su"], 1: ["Mo"], 2: ["Tu"], 3: ["We"],
      4: ["Th"], 5: ["Fr"], 6: ["Sa"],
    };
    for (const part of openingHours.split(";").map((s) => s.trim())) {
      const m = part.match(/^(.+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
      if (!m) continue;
      if (!dayMap[day].some((d) => m[1].includes(d))) continue;
      const [oh, om] = m[2].split(":").map(Number);
      const [ch, cm] = m[3].split(":").map(Number);
      return timeNow >= oh * 60 + om && timeNow <= ch * 60 + cm;
    }
  } catch {}
  return null;
}

function buildAddress(tags: Record<string, string>) {
  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
  ]
    .filter(Boolean)
    .join(", ") || tags["is_in"] || "";
}

async function fetchNearbyHospitals(lat: number, lng: number): Promise<Hospital[]> {
  const query = `
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|veterinary|doctors"](around:100000,${lat},${lng});
  way["amenity"~"hospital|clinic|veterinary"](around:100000,${lat},${lng});
  node["healthcare"~"hospital|veterinary"](around:100000,${lat},${lng});
  way["healthcare"~"hospital|veterinary"](around:100000,${lat},${lng});
);
out center 120;
`.trim();

  const body = `data=${encodeURIComponent(query)}`;
  let lastError: any;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "SaharaApp/1.0 (community help app India)",
          Accept: "application/json",
        },
        body,
        signal: AbortSignal.timeout(24000),
      });
      if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue; }
      const data = await res.json();

      const seen = new Set<string>();
      return (data.elements as any[])
        .map((el: any) => {
          const tags: Record<string, string> = el.tags || {};
          const elLat: number = el.lat ?? el.center?.lat;
          const elLng: number = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) return null;

          const name = tags["name:hi"] || tags["name"] || tags["name:en"] || "अज्ञात अस्पताल";
          const amenity = tags["amenity"] || tags["healthcare"] || "";
          const isVet = amenity === "veterinary" || tags["healthcare"] === "veterinary";
          const km = Math.round(haversineKm(lat, lng, elLat, elLng) * 10) / 10;

          return {
            id: `${el.type}-${el.id}`,
            name,
            type: (isVet ? "vet" : "hospital") as "hospital" | "vet",
            address: buildAddress(tags),
            distanceKm: km,
            distanceText: `${km.toFixed(1)} km`,
            travelTime: estimateTime(km),
            open: isOpenNow(tags["opening_hours"]),
            phone: tags["phone"] || tags["contact:phone"] || null,
            lat: elLat,
            lng: elLng,
            emergency: tags["emergency"] === "yes",
            beds: tags["beds"] || null,
          } satisfies Hospital;
        })
        .filter((h): h is Hospital => {
          if (!h) return false;
          const key = `${h.name.toLowerCase().trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Failed");
}

function openDirections(lat: number, lng: number, name: string) {
  const encoded = encodeURIComponent(name);
  const ios = `maps://maps.apple.com/?daddr=${lat},${lng}&q=${encoded}`;
  const android = `geo:${lat},${lng}?q=${lat},${lng}(${encoded})`;
  const web = `https://maps.google.com/maps?daddr=${lat},${lng}`;

  const primary = Platform.OS === "ios" ? ios : android;
  Linking.canOpenURL(primary)
    .then((ok) => Linking.openURL(ok ? primary : web))
    .catch(() => Linking.openURL(web));
}

function HospitalCard({ item }: { item: Hospital }) {
  const colors = useColors();
  const isVet = item.type === "vet";
  const openColor = item.open === true ? "#166534" : item.open === false ? "#DC2626" : "#92400E";
  const openBg = item.open === true ? "#DCFCE7" : item.open === false ? "#FEE2E2" : "#FEF3C7";
  const openLabel = item.open === true ? "● खुला" : item.open === false ? "● बंद" : "● अज्ञात";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: isVet ? "#F0FDF4" : "#EFF6FF" }]}>
          <Text style={styles.iconEmoji}>{isVet ? "🐾" : "🏥"}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isVet ? "#DCFCE7" : "#DBEAFE" }]}>
              <Text style={[styles.badgeText, { color: isVet ? "#166534" : "#1E40AF" }]}>
                {isVet ? "पशु चिकित्सा" : "अस्पताल"}
              </Text>
            </View>
            {item.emergency && (
              <View style={[styles.badge, { backgroundColor: "#FEE2E2" }]}>
                <Text style={[styles.badgeText, { color: "#DC2626" }]}>🚨 Emergency</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: openBg }]}>
              <Text style={[styles.badgeText, { color: openColor }]}>{openLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {!!item.address && (
        <View style={styles.rowInfo}>
          <Feather name="map-pin" size={12} color="#7C3AED" />
          <Text style={[styles.smallText, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
      )}

      <View style={[styles.statsRow, { backgroundColor: colors.muted }]}>
        <View style={styles.statItem}>
          <Feather name="navigation" size={12} color="#7C3AED" />
          <Text style={[styles.statText, { color: colors.foreground }]}>{item.distanceText}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Feather name="clock" size={12} color="#EC4899" />
          <Text style={[styles.statText, { color: colors.foreground }]}>{item.travelTime}</Text>
        </View>
        {item.beds && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="activity" size={12} color="#FF6B00" />
              <Text style={[styles.statText, { color: colors.foreground }]}>{item.beds} बेड</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#7C3AED" }]}
          onPress={() => openDirections(item.lat, item.lng, item.name)}
        >
          <Feather name="navigation" size={13} color="#fff" />
          <Text style={styles.actionBtnText}>रास्ता देखें</Text>
        </TouchableOpacity>
        {item.phone && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#EC4899" }]}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
          >
            <Feather name="phone" size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Call</Text>
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "hospital" | "vet">("all");
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const loadHospitals = useCallback(async (lat: number, lng: number, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await fetchNearbyHospitals(lat, lng);
      setHospitals(result);
    } catch {
      setError("अस्पतालों की जानकारी नहीं आई। Internet check करें और दोबारा कोशिश करें।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is needed to find hospitals near you.");
      return;
    }
    setLoading(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(coords);
      setLocationGranted(true);
      await loadHospitals(coords.lat, coords.lng);
    } catch {
      setLoading(false);
      Alert.alert("Error", "Location fetch failed. Try again.");
    }
  };

  const filtered = filter === "all" ? hospitals : hospitals.filter((h) => h.type === filter);

  if (!locationGranted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={{ fontSize: 30, marginBottom: 4 }}>🏥</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>नज़दीकी अस्पताल</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            100 km के अंदर सभी अस्पताल और पशु चिकित्सालय
          </Text>
        </View>
        <View style={[styles.permCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.permIconBox}>
            <Feather name="map-pin" size={36} color="#7C3AED" />
          </View>
          <Text style={[styles.permTitle, { color: colors.foreground }]}>लोकेशन एक्सेस दें</Text>
          <Text style={[styles.permDesc, { color: colors.mutedForeground }]}>
            आपके आसपास के अस्पताल और पशु चिकित्सालय खोजने के लिए location permission जरूरी है।
          </Text>
          <View style={styles.featureList}>
            {[
              { icon: "navigation", text: "100 km के अंदर सभी अस्पताल" },
              { icon: "clock", text: "दूरी और समय की जानकारी" },
              { icon: "map", text: "Google Maps से सीधा रास्ता" },
              { icon: "heart", text: "मानव और पशु दोनों के लिए" },
            ].map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Feather name={f.icon as any} size={14} color="#7C3AED" />
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="map-pin" size={16} color="#fff" />
                <Text style={styles.locationBtnText}>लोकेशन एक्सेस दें</Text>
              </>
            )}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => userCoords && loadHospitals(userCoords.lat, userCoords.lng, true)}
            tintColor="#7C3AED"
            colors={["#7C3AED"]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={
          <>
            <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 30, marginBottom: 4 }}>🏥</Text>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>नज़दीकी अस्पताल</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {loading ? "खोज रहे हैं..." : `${hospitals.length} अस्पताल मिले (100 km के अंदर)`}
              </Text>
            </View>
            <View style={styles.filterRow}>
              {(["all", "hospital", "vet"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, { backgroundColor: filter === f ? "#7C3AED" : colors.muted }]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
                    {f === "all" ? "सभी" : f === "hospital" ? "🏥 अस्पताल" : "🐾 पशु चिकित्सा"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  आसपास के अस्पताल खोज रहे हैं...
                </Text>
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                  10-20 सेकंड लग सकते हैं
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={{ fontSize: 42 }}>⚠️</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => userCoords && loadHospitals(userCoords.lat, userCoords.lng)}
                >
                  <Text style={styles.retryText}>दोबारा कोशिश करें</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 42 }}>🔍</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  इस area में कोई अस्पताल नहीं मिला
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "700", marginBottom: 3 },
  headerSub: { fontSize: 13, textAlign: "center" },
  permCard: { margin: 20, padding: 24, borderRadius: 18, borderWidth: 1, alignItems: "center", gap: 12 },
  permIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#EDE9FE" },
  permTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  permDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  featureList: { gap: 8, alignSelf: "stretch", marginTop: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 13 },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#7C3AED", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8, minWidth: 200, justifyContent: "center" },
  locationBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 14, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  filterText: { fontSize: 13, fontWeight: "600" },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", gap: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  iconEmoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", marginBottom: 6, lineHeight: 20 },
  badgeRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  rowInfo: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  smallText: { fontSize: 12, flex: 1, lineHeight: 17 },
  statsRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 10, gap: 6 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  statText: { fontSize: 12, fontWeight: "600" },
  statDivider: { width: 1, height: 16, backgroundColor: "#DDD6FE" },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  emptyBox: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 14 },
  emptyText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  emptySubText: { fontSize: 13, textAlign: "center" },
  retryBtn: { backgroundColor: "#7C3AED", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
