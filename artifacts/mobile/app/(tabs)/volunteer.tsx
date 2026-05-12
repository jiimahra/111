import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HelpRequest, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { socialApi } from "@/lib/social";

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

function shareRequest(item: HelpRequest) {
  const catEmojis: Record<string, string> = {
    food: "🍲", medical: "🏥", job: "💼", animal: "🐾", education: "📚",
  };
  const emoji = catEmojis[item.category] ?? "🆘";
  const typeLabel = item.helpType === "need_help" ? "🆘 मदद चाहिए" : "🤝 मदद मिल सकती है";
  const msg = `${emoji} *Sahara – ${typeLabel}*\n\n📌 ${item.title}\n📍 ${item.location}\n\n${item.description}\n\n🌐 saharaapphelp.com`;
  Share.share({ message: msg, title: item.title });
}

function ExploreCard({ item, myId }: { item: HelpRequest; myId: string }) {
  const colors = useColors();
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const isNeedHelp = item.helpType === "need_help";

  const [showMsg, setShowMsg] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  const canMsg = !item.isAnonymous && !!item.userId && item.userId !== myId && !!myId;

  const sendMsg = async () => {
    if (!msgText.trim() || msgSending || !item.userId || !myId) return;
    setMsgSending(true);
    try {
      await socialApi.sendMessage(myId, item.userId, msgText.trim());
      setMsgSent(true);
      setMsgText("");
      setTimeout(() => { setMsgSent(false); setShowMsg(false); }, 2500);
    } catch {
      Alert.alert("Error", "Message नहीं भेजा जा सका। दोबारा try करें।");
    } finally {
      setMsgSending(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.catBadge, { backgroundColor: isNeedHelp ? "#FEF3C7" : "#DCFCE7" }]}>
          <Text style={styles.catEmoji}>{cat?.emoji}</Text>
          <Text style={[styles.catText, { color: isNeedHelp ? "#065F46" : "#166534" }]}>
            {cat?.label}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: isNeedHelp ? "#FEE2E2" : "#DCFCE7" }]}>
          <Text style={[styles.typeText, { color: isNeedHelp ? "#DC2626" : "#16A34A" }]}>
            {isNeedHelp ? "● Need Help" : "● Giving Help"}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.location}</Text>
        </View>
        <View style={styles.metaRight}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{timeAgo(item.timestamp)}</Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.muted }]}
            onPress={() => shareRequest(item)}
          >
            <Feather name="share-2" size={13} color="#7C3AED" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message Box */}
      {canMsg && (
        msgSent ? (
          <View style={styles.sentRow}>
            <Feather name="check-circle" size={15} color="#16A34A" />
            <Text style={styles.sentText}>Message bhej diya! ✓</Text>
          </View>
        ) : showMsg ? (
          <View style={styles.msgBox}>
            <TextInput
              style={[styles.msgInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Message likhein…"
              placeholderTextColor="#9CA3AF"
              value={msgText}
              onChangeText={setMsgText}
              maxLength={500}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={sendMsg}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!msgText.trim() || msgSending) && styles.sendBtnOff]}
              onPress={sendMsg}
              disabled={!msgText.trim() || msgSending}
            >
              {msgSending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="send" size={15} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.msgOpenBtn} onPress={() => setShowMsg(true)}>
            <Feather name="message-circle" size={14} color="#fff" />
            <Text style={styles.msgOpenBtnText}>💬 Message भेजें</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const { requests, profile } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const myId = profile.id ?? "";

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (r.status === "resolved") return false;
      if (selectedCat !== "all" && r.category !== selectedCat) return false;
      if (selectedFilter !== "all" && r.helpType !== selectedFilter) return false;
      return true;
    });
  }, [requests, selectedCat, selectedFilter]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.navBg, borderBottomColor: colors.navBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>अन्वेषण करें</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>अपने क्षेत्र में सभी अनुरोध ब्राउज़ करें</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 6 }}>
            {/* Help type filter */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                    selectedFilter === f.key && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, { color: colors.mutedForeground }, selectedFilter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category filter */}
            <View style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[
                    styles.catChip,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                    selectedCat === c.key && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCat(c.key)}
                >
                  <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catChipText, { color: colors.mutedForeground }, selectedCat === c.key && styles.catChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {filtered.length} अनुरोध मिले
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>कोई अनुरोध नहीं मिला</Text>
          </View>
        }
        renderItem={({ item }) => <ExploreCard item={item} myId={myId} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  headerSub: { fontSize: 13, marginTop: 2 },

  list: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  filterChipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },

  catRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
  },
  catChipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  catChipEmoji: { fontSize: 13 },
  catChipText: { fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: "#fff" },

  countText: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: "600" },

  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  cardTop: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  catBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  catEmoji: { fontSize: 13 },
  catText: { fontSize: 11, fontWeight: "700" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: "700" },

  cardTitle: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  cardDesc: { fontSize: 13, lineHeight: 18 },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 11 },

  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  shareBtnText: { fontSize: 11, fontWeight: "600", color: "#7C3AED" },

  msgOpenBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  msgOpenBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  msgBox: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6,
  },
  msgInput: {
    flex: 1, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#16A34A", shadowOpacity: 0.4, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  sendBtnOff: { backgroundColor: "#D1D5DB", shadowOpacity: 0 },

  sentRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6,
    backgroundColor: "#DCFCE7", borderRadius: 10, padding: 10,
  },
  sentText: { fontSize: 13, fontWeight: "700", color: "#16A34A" },
});
