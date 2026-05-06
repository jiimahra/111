import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HelpRequest, useApp } from "@/contexts/AppContext";
import { useLang } from "@/contexts/LangContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { key: "food", emoji: "🍲", enLabel: "Food", hiLabel: "भोजन" },
  { key: "medical", emoji: "🏥", enLabel: "Medical", hiLabel: "चिकित्सा" },
  { key: "job", emoji: "💼", enLabel: "Job", hiLabel: "रोजगार" },
  { key: "animal", emoji: "🐾", enLabel: "Animal", hiLabel: "पशु" },
  { key: "education", emoji: "📚", enLabel: "Education", hiLabel: "शिक्षा" },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shareRequest(item: HelpRequest) {
  const catEmojis: Record<string, string> = {
    food: "🍲", medical: "🏥", job: "💼", animal: "🐾", education: "📚",
  };
  const emoji = catEmojis[item.category] ?? "🆘";
  const typeLabel = item.helpType === "need_help" ? "🆘 मदद चाहिए" : "🤝 मदद मिल सकती है";
  const msg = `${emoji} *Sahara – ${typeLabel}*\n\n📌 ${item.title}\n📍 ${item.location}\n\n${item.description}${item.contactPhone ? `\n\n📞 ${item.contactPhone}` : ""}\n\n🌐 saharaapphelp.com`;
  Share.share({ message: msg, title: item.title });
}

function RequestCard({ item }: { item: HelpRequest }) {
  const colors = useColors();
  const { lang } = useLang();
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const isNeedHelp = item.helpType === "need_help";
  const catLabel = lang === "hi" ? cat?.hiLabel : cat?.enLabel;

  return (
    <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.requestCardTop}>
        <View style={[styles.catBadge, { backgroundColor: isNeedHelp ? "#FEF3C7" : "#DCFCE7" }]}>
          <Text style={styles.catEmoji}>{cat?.emoji}</Text>
          <Text style={[styles.catBadgeText, { color: isNeedHelp ? "#92400E" : "#166534" }]}>
            {catLabel}
          </Text>
        </View>
        <View style={[styles.helpTypeBadge, { backgroundColor: isNeedHelp ? "#FEE2E2" : "#DCFCE7" }]}>
          <Text style={[styles.helpTypeBadgeText, { color: isNeedHelp ? "#DC2626" : "#16A34A" }]}>
            {isNeedHelp ? "● Need Help" : "● Giving Help"}
          </Text>
        </View>
      </View>
      <Text style={[styles.requestTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.requestDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.requestMeta}>
        <Feather name="map-pin" size={12} color={colors.mutedForeground} />
        <Text style={[styles.requestMetaText, { color: colors.mutedForeground }]}>{item.location}</Text>
        <Text style={[styles.requestMetaDot, { color: colors.mutedForeground }]}>·</Text>
        <Text style={[styles.requestMetaText, { color: colors.mutedForeground }]}>{timeAgo(item.timestamp)}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.muted }]}
          onPress={() => shareRequest(item)}
        >
          <Feather name="share-2" size={12} color="#F97316" />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NotificationsModal({
  visible,
  onClose,
  requests,
}: {
  visible: boolean;
  onClose: () => void;
  requests: HelpRequest[];
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recent = requests.filter((r) => r.status !== "resolved").slice(0, 15);

  const catEmojis: Record<string, string> = {
    food: "🍲", medical: "🏥", job: "💼", animal: "🐾", education: "📚",
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top + 8, backgroundColor: colors.navBg, borderBottomColor: colors.navBorder }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>🔔 Notifications / सूचनाएं</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.notifEmpty}>
            <Text style={styles.notifEmptyEmoji}>🔕</Text>
            <Text style={[styles.notifEmptyText, { color: colors.mutedForeground }]}>
              No new requests at the moment
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <Text style={[styles.notifSubtitle, { color: colors.mutedForeground }]}>
              {recent.length} active requests near you
            </Text>
            {recent.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  onClose();
                  router.push("/(tabs)/volunteer");
                }}
              >
                <View style={[styles.notifIconBox, { backgroundColor: item.helpType === "need_help" ? "#FEF3C7" : "#DCFCE7" }]}>
                  <Text style={{ fontSize: 20 }}>{catEmojis[item.category]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.notifItemMeta, { color: colors.mutedForeground }]}>
                    📍 {item.location} · {timeAgo(item.timestamp)}
                  </Text>
                </View>
                <View style={[styles.notifDot, { backgroundColor: item.helpType === "need_help" ? "#EF4444" : "#22C55E" }]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { requests } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, toggleLang, t } = useLang();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showNotif, setShowNotif] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const unreadCount = requests.filter((r) => r.status !== "resolved").length;

  const activeRequests = useMemo(() => {
    let list = requests.filter((r) => r.status !== "resolved");
    if (selectedCat) list = list.filter((r) => r.category === selectedCat);
    if (search.trim())
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.location.toLowerCase().includes(search.toLowerCase())
      );
    return list;
  }, [requests, selectedCat, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NotificationsModal
        visible={showNotif}
        onClose={() => setShowNotif(false)}
        requests={requests}
      />

      <FlatList<HelpRequest>
        data={activeRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <>
            {/* Top Nav */}
            <View style={[styles.navbar, { paddingTop: topPad + 8, backgroundColor: colors.navBg, borderBottomColor: colors.navBorder }]}>
              <View style={styles.navLogo}>
                <Image
                  source={require("@/assets/images/sahara-logo.png")}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.navRight}>
                {/* Language toggle */}
                <TouchableOpacity
                  style={[styles.langBtn, { backgroundColor: colors.navBtnBg, borderColor: colors.border }]}
                  onPress={toggleLang}
                >
                  <Text style={[styles.langBtnText, { color: colors.navIcon }]}>
                    {lang === "en" ? "हिं" : "EN"}
                  </Text>
                </TouchableOpacity>

                {/* Bell with badge */}
                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: colors.navBtnBg }]}
                  onPress={() => setShowNotif(true)}
                >
                  <Feather name="bell" size={20} color={colors.navIcon} />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => router.push("/(tabs)/profile")}
                >
                  <Text style={styles.joinBtnText}>{t("joinNow")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero */}
            <LinearGradient
              colors={["#78350F", "#92400E", "#B45309"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{t("together")}</Text>
                <Text style={styles.heroHindi}>{t("subHero")}</Text>

                <View style={styles.searchRow}>
                  <View style={styles.searchBox}>
                    <Feather name="search" size={16} color="#6B7280" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t("searchPlaceholder")}
                      placeholderTextColor="#9CA3AF"
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                  <View style={styles.locationBox}>
                    <Feather name="map-pin" size={14} color="#F97316" />
                    <Text style={styles.locationText}>Ajmer</Text>
                  </View>
                </View>

                <View style={styles.ctaRow}>
                  <TouchableOpacity
                    style={styles.ctaNeedHelp}
                    onPress={() => router.push("/(tabs)/alert")}
                  >
                    <View style={styles.ctaDot} />
                    <Text style={styles.ctaNeedHelpText}>
                      {lang === "hi" ? "मदद चाहिए" : "मदद चाहिए"}{"  "}
                      <Text style={styles.ctaSub}>({t("requestHelp")})</Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ctaGiveHelp}
                    onPress={() => router.push("/(tabs)/alert")}
                  >
                    <View style={[styles.ctaDot, { backgroundColor: "#22C55E" }]} />
                    <Text style={styles.ctaGiveHelpText}>
                      {lang === "hi" ? "मदद करना है" : "मदद करना है"}{"  "}
                      <Text style={styles.ctaSub2}>({t("offerHelp")})</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t("categories")} / {lang === "hi" ? "Categories" : "श्रेणियां"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.catCard,
                      {
                        backgroundColor: selectedCat === cat.key ? "#FFF7ED" : colors.card,
                        borderColor: selectedCat === cat.key ? "#F97316" : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
                  >
                    <Text style={styles.catCardEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catCardLabel, { color: selectedCat === cat.key ? "#F97316" : colors.foreground }]}>
                      {lang === "hi" ? cat.hiLabel : cat.enLabel}
                    </Text>
                    <Text style={[styles.catCardSub, { color: colors.mutedForeground }]}>
                      {lang === "hi" ? cat.enLabel : cat.hiLabel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Recent Requests Header */}
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t("recentRequests")} / {lang === "hi" ? "Recent Requests" : "हाल की जरूरतें"}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/volunteer")}>
                <Text style={styles.viewAllText}>{t("viewAll")}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🙏</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No recent requests found.
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Be the first to post a request!
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

  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  navLogo: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoImg: { width: 110, height: 36 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  langBtnText: { fontSize: 12, fontWeight: "700" },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  joinBtn: {
    backgroundColor: "#F97316",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  hero: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 28 },
  heroOverlay: { gap: 0 },
  heroTitle: { fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 40, marginBottom: 8 },
  heroHindi: { fontSize: 16, color: "rgba(255,255,255,0.9)", textAlign: "center", marginBottom: 20, fontStyle: "italic" },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: "#111827" },
  locationBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  locationText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  ctaRow: { backgroundColor: "#fff", borderRadius: 14, padding: 6, flexDirection: "row", gap: 6 },
  ctaNeedHelp: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1E3A5F", borderRadius: 10, paddingVertical: 14, gap: 8 },
  ctaGiveHelp: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F97316", borderRadius: 10, paddingVertical: 14, gap: 8 },
  ctaDot: { width: 8, height: 8, borderRadius: 100, backgroundColor: "#EF4444" },
  ctaNeedHelpText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  ctaGiveHelpText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  ctaSub: { fontWeight: "400", fontSize: 11, color: "rgba(255,255,255,0.8)" },
  ctaSub2: { fontWeight: "400", fontSize: 11, color: "rgba(255,255,255,0.8)" },

  categoriesSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  categoriesRow: { gap: 10, paddingRight: 16 },
  catCard: { alignItems: "center", justifyContent: "center", width: 90, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  catCardEmoji: { fontSize: 28 },
  catCardLabel: { fontSize: 13, fontWeight: "700" },
  catCardSub: { fontSize: 10 },

  recentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  viewAllText: { fontSize: 13, color: "#F97316", fontWeight: "600" },

  requestCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  requestCardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  catEmoji: { fontSize: 12 },
  catBadgeText: { fontSize: 11, fontWeight: "600" },
  helpTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  helpTypeBadgeText: { fontSize: 11, fontWeight: "600" },
  requestTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4, lineHeight: 21 },
  requestDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  requestMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  requestMetaText: { fontSize: 11 },
  requestMetaDot: { fontSize: 11 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  shareBtnText: { fontSize: 11, fontWeight: "600", color: "#F97316" },

  emptyState: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyText: { fontSize: 13 },

  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  notifSubtitle: { fontSize: 13, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  notifIconBox: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  notifItemTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  notifItemMeta: { fontSize: 11 },
  notifDot: { width: 8, height: 8, borderRadius: 4 },
  notifEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
  notifEmptyEmoji: { fontSize: 48 },
  notifEmptyText: { fontSize: 14 },
});
