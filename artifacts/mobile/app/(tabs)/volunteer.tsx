import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "");

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

type CommentItem = { id: string; userName: string; content: string; createdAt: string; isAnonymous: boolean };

function VolCommentsModal({
  requestId, myId, visible, onClose, onCommentAdded,
}: { requestId: string; myId: string; visible: boolean; onClose: () => void; onCommentAdded: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, apiToken } = useApp();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postAnon, setPostAnon] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetch(`${API_BASE}/api/requests/${requestId}/reactions${myId ? `?userId=${myId}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setComments(d.comments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [visible, requestId]);

  const postComment = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/api/requests/${requestId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken ? { "x-sahara-token": apiToken } : {}),
        },
        body: JSON.stringify({ userId: myId || undefined, userName: profile?.name ?? "Sahara User", content: text.trim(), isAnonymous: postAnon }),
      });
      const newComment = await res.json();
      if (newComment.id) { setComments((prev) => [newComment, ...prev]); setText(""); onCommentAdded(); }
    } catch {} finally { setPosting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={[volStyles.commentsSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
          <View style={volStyles.commentsSheetHandle} />
          <View style={volStyles.commentsHeader}>
            <Text style={[volStyles.commentsTitle, { color: colors.foreground }]}>💬 Comments</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator style={{ marginVertical: 24 }} color="#7C3AED" /> :
            comments.length === 0 ? <Text style={[volStyles.commentsEmpty, { color: colors.mutedForeground }]}>Koi comment nahi hai abhi. Pehle comment karein! 😊</Text> :
            <FlatList data={comments} keyExtractor={(c) => c.id} style={{ maxHeight: 260 }}
              renderItem={({ item: c }) => (
                <View style={volStyles.commentItem}>
                  <View style={[volStyles.commentAvatar, { backgroundColor: "#7C3AED22" }]}>
                    <Text style={{ fontSize: 13 }}>{c.isAnonymous ? "🕵️" : "👤"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[volStyles.commentUserName, { color: colors.foreground }]}>{c.userName}</Text>
                    <Text style={[volStyles.commentContent, { color: colors.foreground }]}>{c.content}</Text>
                    <Text style={[volStyles.commentTime, { color: colors.mutedForeground }]}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</Text>
                  </View>
                </View>
              )} />
          }
          <View style={volStyles.commentInputRow}>
            <TextInput style={[volStyles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Comment likhein…" placeholderTextColor="#9CA3AF" value={text} onChangeText={setText}
              maxLength={300} returnKeyType="send" onSubmitEditing={postComment} />
            <TouchableOpacity style={[volStyles.commentSendBtn, (!text.trim() || posting) && { opacity: 0.5 }]}
              onPress={postComment} disabled={!text.trim() || posting}>
              {posting ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={volStyles.commentAnonToggle} onPress={() => setPostAnon((v) => !v)}>
            <Text style={{ fontSize: 12, color: postAnon ? "#7C3AED" : colors.mutedForeground }}>
              {postAnon ? "🕵️ Anonymous mode ON" : "👤 Anonymous mode OFF"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ExploreCard({ item, myId }: { item: HelpRequest; myId: string }) {
  const colors = useColors();
  const { apiToken } = useApp();
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const isNeedHelp = item.helpType === "need_help";

  const [showMsg, setShowMsg] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState("");

  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!item.id) return;
    const url = myId
      ? `${API_BASE}/api/requests/${item.id}/reactions?userId=${myId}`
      : `${API_BASE}/api/requests/${item.id}/reactions`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setLikesCount(d.likesCount ?? 0); setLiked(d.liked ?? false); setCommentsCount(d.commentsCount ?? 0); })
      .catch(() => {});
  }, [item.id, myId]);

  const toggleLike = async () => {
    if (!myId || liking) return;
    setLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      await fetch(`${API_BASE}/api/requests/${item.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken ? { "x-sahara-token": apiToken } : {}),
        },
      });
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
    } finally { setLiking(false); }
  };

  const canMsg = !item.isAnonymous;

  const quickMsgText = item.helpType === "need_help"
    ? "मैं आपकी मदद करना चाहता हूं 🙏"
    : "मुझे आपकी मदद की जरूरत है 🙏";

  const doSend = async (text: string) => {
    setMsgError("");
    if (!text.trim() || msgSending) return;
    if (!myId) {
      setMsgError("❌ पहले Login करें");
      return;
    }
    if (item.userId === myId) {
      setMsgError("❌ यह आपकी अपनी request है");
      return;
    }
    if (!item.userId) {
      setMsgError("❌ इस user का account नहीं मिला");
      return;
    }
    setMsgSending(true);
    try {
      await socialApi.sendMessage(myId, item.userId, text.trim());
      setMsgSent(true);
      setMsgText("");
      setMsgError("");
      setTimeout(() => { setMsgSent(false); setShowMsg(false); }, 2500);
    } catch (e: any) {
      setMsgError("❌ " + (e?.message ?? "Message नहीं भेजा जा सका"));
    } finally {
      setMsgSending(false);
    }
  };

  const sendMsg = () => doSend(msgText);
  const sendQuickMsg = () => doSend(quickMsgText);

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
          <>
            <View style={styles.msgBtnRow}>
              <TouchableOpacity style={styles.msgOpenBtn} onPress={() => { setShowMsg(true); setMsgError(""); }}>
                <Feather name="message-circle" size={14} color="#fff" />
                <Text style={styles.msgOpenBtnText}>💬 Message भेजें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickMsgBtn}
                onPress={sendQuickMsg}
                disabled={msgSending}
              >
                {msgSending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.quickMsgBtnText}>
                      {item.helpType === "need_help" ? "🙋 मैं मदद करूंगा" : "🙏 मुझे मदद चाहिए"}
                    </Text>
                }
              </TouchableOpacity>
            </View>
            {!!msgError && (
              <Text style={styles.msgErrorText}>{msgError}</Text>
            )}
          </>
        )
      )}

      {/* Like / Comment / Share row */}
      <View style={styles.reactionRow}>
        <TouchableOpacity
          style={[styles.reactionBtn, liked && styles.reactionBtnActive]}
          onPress={toggleLike}
          disabled={!myId}
        >
          <Text style={[styles.reactionIcon, liked && { color: "#E11D48" }]}>
            {liked ? "❤️" : "🤍"}
          </Text>
          <Text style={[styles.reactionCount, liked && { color: "#E11D48" }]}>
            {likesCount > 0 ? likesCount : "Like"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reactionBtn} onPress={() => setShowComments(true)}>
          <Text style={styles.reactionIcon}>💬</Text>
          <Text style={styles.reactionCount}>
            {commentsCount > 0 ? commentsCount : "Comment"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reactionBtn} onPress={() => shareRequest(item)}>
          <Text style={styles.reactionIcon}>📤</Text>
          <Text style={styles.reactionCount}>Share</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <VolCommentsModal
          requestId={item.id}
          myId={myId}
          visible={showComments}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount((c) => c + 1)}
        />
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

  msgErrorText: {
    color: "#DC2626", fontSize: 12, fontWeight: "600", marginTop: 5,
  },
  msgBtnRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap",
  },
  msgOpenBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  msgOpenBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  quickMsgBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  quickMsgBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

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

  reactionRow: {
    flexDirection: "row", alignItems: "center",
    marginTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10,
  },
  reactionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 5,
  },
  reactionBtnActive: {},
  reactionIcon: { fontSize: 15 },
  reactionCount: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
});

const volStyles = StyleSheet.create({
  commentsSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingHorizontal: 16,
  },
  commentsSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 12,
  },
  commentsHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  commentsTitle: { fontSize: 16, fontWeight: "700" },
  commentsEmpty: { textAlign: "center", marginVertical: 24, fontSize: 13 },
  commentItem: { flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "flex-start" },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  commentUserName: { fontSize: 12, fontWeight: "700" },
  commentContent: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  commentTime: { fontSize: 11, marginTop: 3 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  commentInput: {
    flex: 1, borderRadius: 20,
    paddingHorizontal: 13, paddingVertical: Platform.OS === "ios" ? 9 : 7,
    fontSize: 13,
  },
  commentSendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center", justifyContent: "center",
  },
  commentAnonToggle: { alignSelf: "flex-start", marginTop: 6, paddingVertical: 2 },
});
