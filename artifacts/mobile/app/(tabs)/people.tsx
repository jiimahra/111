import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { socialApi, type Friend, type FriendRequest, type SocialUser, type ConversationPartner } from "@/lib/social";

const PURPLE = "#7C3AED";
const DARK = "#2D0A6E";
const GREEN_DOT = "#22C55E";

type Tab = "friends" | "help" | "allfriends" | "requests" | "people";

export default function PeopleScreen() {
  const { profile } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");

  const [users, setUsers] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = profile.id ?? "";

  const loadAll = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const [u, r, f, c] = await Promise.all([
        socialApi.getUsers(userId),
        socialApi.getRequests(userId),
        socialApi.getFriends(userId),
        socialApi.getConversations(userId),
      ]);
      setUsers(u);
      setRequests(r);
      setFriends(f);
      setConversations(c);
    } catch (e: any) {
      if (!silent) Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
    pollRef.current = setInterval(() => loadAll(true), 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadAll]);

  const do_ = async (key: string, fn: () => Promise<unknown>) => {
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      await fn();
      await loadAll(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
    u.saharaId.includes(search.replace(/-/g, "")),
  );

  // Help tab = conversations with non-friends
  const friendIds = new Set(friends.map((f) => f.id));
  const helpConvos = conversations.filter((c) => !friendIds.has(c.id));

  const tabDefs: { key: Tab; label: string; icon: keyof typeof Feather.glyphMap; count?: number }[] = [
    { key: "friends", label: "Friends", icon: "heart", count: friends.length },
    { key: "help", label: "Help", icon: "life-buoy", count: helpConvos.filter((c) => c.unreadCount > 0).length || undefined },
    { key: "allfriends", label: "All Friends", icon: "users", count: friends.length },
    { key: "requests", label: "Requests", icon: "user-plus", count: requests.length },
    { key: "people", label: "People", icon: "globe", count: users.length },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerSub}>Connect with people around you</Text>
      </View>

      {/* Scrollable Tab Bar */}
      <View style={styles.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {tabDefs.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Feather name={t.icon} size={14} color={active ? PURPLE : "#9CA3AF"} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                {!!t.count && t.count > 0 && (
                  <View style={[styles.badge, active && styles.badgeActive]}>
                    <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{t.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search (People tab only) */}
      {tab === "people" && (
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Name ya city se search karein…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* All Friends header with count */}
      {tab === "allfriends" && (
        <View style={styles.allFriendsHeader}>
          <Feather name="users" size={16} color={PURPLE} />
          <Text style={styles.allFriendsHeaderText}>
            कुल दोस्त: <Text style={styles.allFriendsCount}>{friends.length}</Text>
          </Text>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlinePillText}>{friends.filter((f) => f.isOnline).length} Online</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={PURPLE} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* FRIENDS TAB */}
          {tab === "friends" && (
            <FlatList
              data={friends}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={PURPLE} />}
              ListEmptyComponent={<EmptyState icon="heart" text={"Koi friend nahi hai abhi\nRequest bhejo aur connect karo!"} />}
              renderItem={({ item }) => (
                <FriendCard
                  friend={item}
                  showUnfriend={false}
                  onChat={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.id, name: item.name } })}
                  onUnfriend={() => {}}
                  unfriendBusy={false}
                />
              )}
            />
          )}

          {/* HELP TAB */}
          {tab === "help" && (
            <FlatList
              data={helpConvos}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={PURPLE} />}
              ListEmptyComponent={<EmptyState icon="life-buoy" text={"Kisi ne abhi tak request ke\nmadhyam se message nahi kiya"} />}
              renderItem={({ item }) => (
                <ConvoCard
                  partner={item}
                  onChat={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.id, name: item.name } })}
                />
              )}
            />
          )}

          {/* ALL FRIENDS TAB */}
          {tab === "allfriends" && (
            <FlatList
              data={friends}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={PURPLE} />}
              ListEmptyComponent={<EmptyState icon="users" text={"Koi friend nahi hai abhi\nRequest bhejo aur connect karo!"} />}
              renderItem={({ item }) => (
                <FriendCard
                  friend={item}
                  showUnfriend={true}
                  onChat={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.id, name: item.name } })}
                  onUnfriend={() => do_(`unfriend_${item.id}`, () => socialApi.unfriend(userId, item.id))}
                  unfriendBusy={!!busy[`unfriend_${item.id}`]}
                />
              )}
            />
          )}

          {/* REQUESTS TAB */}
          {tab === "requests" && (
            <FlatList
              data={requests}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={PURPLE} />}
              ListEmptyComponent={<EmptyState icon="inbox" text="Koi friend request nahi hai" />}
              renderItem={({ item }) => (
                <RequestCard
                  request={item}
                  busyAccept={!!busy[`accept_${item.id}`]}
                  busyDecline={!!busy[`decline_${item.id}`]}
                  onAccept={() => do_(`accept_${item.id}`, () => socialApi.acceptRequest(item.id))}
                  onDecline={() => do_(`decline_${item.id}`, () => socialApi.declineRequest(item.id))}
                />
              )}
            />
          )}

          {/* PEOPLE TAB */}
          {tab === "people" && (
            <FlatList
              data={filteredUsers}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={PURPLE} />}
              ListEmptyComponent={<EmptyState icon="users" text="Koi user nahi mila" />}
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  busy={!!busy[item.id]}
                  onSend={() => do_(item.id, () => socialApi.sendRequest(userId, item.id))}
                  onCancel={() => do_(item.id, () => socialApi.cancelRequest(item.requestId!))}
                  onChat={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.id, name: item.name } })}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ name, photoUrl, size = 44, isOnline }: { name: string; photoUrl?: string | null; size?: number; isOnline?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={{ position: "relative" }}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
      {isOnline && (
        <View style={[styles.onlineIndicator, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, bottom: 0, right: 0 }]} />
      )}
    </View>
  );
}

/* ─── FriendCard (used in Friends + All Friends tabs) ──────────────────── */
function FriendCard({ friend, showUnfriend, onChat, onUnfriend, unfriendBusy }: {
  friend: Friend;
  showUnfriend: boolean;
  onChat: () => void;
  onUnfriend: () => void;
  unfriendBusy: boolean;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onChat} activeOpacity={0.75}>
      <View style={{ position: "relative" }}>
        <Avatar name={friend.name} photoUrl={friend.photoUrl} isOnline={friend.isOnline} />
        {friend.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{friend.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{friend.name}</Text>
          {friend.isOnline && <Text style={styles.onlineLabel}>● Online</Text>}
        </View>
        {friend.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name="map-pin" size={11} color="#9CA3AF" />
            <Text style={styles.cardSub}>{friend.location}</Text>
          </View>
        ) : null}
        {friend.unreadCount > 0 && (
          <Text style={[styles.cardSub, { color: PURPLE, fontWeight: "700", marginTop: 2 }]}>
            {friend.unreadCount} नया message
          </Text>
        )}
      </View>
      <View style={{ gap: 8, alignItems: "flex-end" }}>
        <View style={styles.chatBtn}>
          <Feather name="message-circle" size={14} color="#fff" />
          <Text style={styles.chatBtnText}>Chat</Text>
        </View>
        {showUnfriend && (
          <TouchableOpacity
            style={styles.unfriendBtn}
            onPress={(e) => { e.stopPropagation?.(); onUnfriend(); }}
            disabled={unfriendBusy}
          >
            {unfriendBusy
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <Text style={styles.unfriendBtnText}>Unfriend</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ─── ConvoCard (Help tab) ──────────────────────────────────────────────── */
function ConvoCard({ partner, onChat }: { partner: ConversationPartner; onChat: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onChat} activeOpacity={0.75}>
      <View style={{ position: "relative" }}>
        <Avatar name={partner.name} photoUrl={partner.photoUrl} isOnline={partner.isOnline} />
        {partner.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{partner.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{partner.name}</Text>
          {partner.isOnline && <Text style={styles.onlineLabel}>● Online</Text>}
        </View>
        {partner.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name="map-pin" size={11} color="#9CA3AF" />
            <Text style={styles.cardSub}>{partner.location}</Text>
          </View>
        ) : null}
        {partner.lastMessage ? (
          <Text style={styles.lastMsg} numberOfLines={1}>
            {partner.lastMessage}
          </Text>
        ) : null}
      </View>
      <View style={styles.chatBtn}>
        <Feather name="message-circle" size={14} color="#fff" />
        <Text style={styles.chatBtnText}>Chat</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ─── UserCard (People tab) ─────────────────────────────────────────────── */
function UserCard({ user, busy, onSend, onCancel, onChat }: {
  user: SocialUser; busy: boolean; onSend: () => void; onCancel: () => void; onChat: () => void;
}) {
  const isFriend = user.requestStatus === "friends";
  const isSent = user.requestStatus === "sent";
  const isReceived = user.requestStatus === "received";
  return (
    <View style={styles.card}>
      <Avatar name={user.name} photoUrl={user.photoUrl} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardName}>{user.name}</Text>
        <Text style={styles.saharaIdBadge}>ID: {user.saharaId.slice(0,3)}-{user.saharaId.slice(3,6)}-{user.saharaId.slice(6)}</Text>
        {user.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name="map-pin" size={11} color="#9CA3AF" />
            <Text style={styles.cardSub}>{user.location}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 8, alignItems: "flex-end" }}>
        {isFriend && (
          <TouchableOpacity style={styles.chatBtn} onPress={onChat}>
            <Feather name="message-circle" size={14} color="#fff" />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}
        {isSent && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
            {busy ? <ActivityIndicator size="small" color="#6B7280" /> : <Text style={styles.cancelBtnText}>Sent ✓</Text>}
          </TouchableOpacity>
        )}
        {isReceived && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={onSend} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Accept</Text>}
            </TouchableOpacity>
          </View>
        )}
        {user.requestStatus === "none" && (
          <TouchableOpacity style={styles.addBtn} onPress={onSend} disabled={busy}>
            {busy ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Feather name="user-plus" size={13} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── RequestCard ───────────────────────────────────────────────────────── */
function RequestCard({ request, busyAccept, busyDecline, onAccept, onDecline }: {
  request: FriendRequest; busyAccept: boolean; busyDecline: boolean; onAccept: () => void; onDecline: () => void;
}) {
  return (
    <View style={styles.card}>
      <Avatar name={request.from.name} photoUrl={request.from.photoUrl} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardName}>{request.from.name}</Text>
        {request.from.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name="map-pin" size={11} color="#9CA3AF" />
            <Text style={styles.cardSub}>{request.from.location}</Text>
          </View>
        ) : null}
        <Text style={[styles.cardSub, { marginTop: 4 }]}>आपसे connect karna chahte hain</Text>
      </View>
      <View style={{ gap: 8 }}>
        <TouchableOpacity style={styles.addBtn} onPress={onAccept} disabled={busyAccept || busyDecline}>
          {busyAccept ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Accept</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDecline} disabled={busyAccept || busyDecline}>
          {busyDecline ? <ActivityIndicator size="small" color="#6B7280" /> : <Text style={styles.cancelBtnText}>Decline</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── EmptyState ────────────────────────────────────────────────────────── */
function EmptyState({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={28} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  tabBarWrap: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  tabBar: { paddingHorizontal: 8, gap: 2, flexDirection: "row" },
  tabBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 10, gap: 5,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: PURPLE },
  tabLabel: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
  tabLabelActive: { color: PURPLE },
  badge: {
    backgroundColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 5,
    paddingVertical: 1, minWidth: 18, alignItems: "center",
  },
  badgeActive: { backgroundColor: "#EDE9FE" },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#6B7280" },
  badgeTextActive: { color: PURPLE },

  allFriendsHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#F5F3FF", borderBottomWidth: 1, borderBottomColor: "#EDE9FE",
  },
  allFriendsHeaderText: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "600" },
  allFriendsCount: { color: PURPLE, fontWeight: "800" },
  onlinePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#DCFCE7", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_DOT },
  onlinePillText: { fontSize: 12, fontWeight: "700", color: "#16A34A" },

  searchRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 12, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 12 : 9,
    gap: 10, borderWidth: 1, borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  avatar: { backgroundColor: DARK, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800" },

  onlineIndicator: {
    position: "absolute", backgroundColor: GREEN_DOT,
    borderWidth: 2, borderColor: "#fff",
  },

  unreadBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: PURPLE, borderRadius: 10, minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff", zIndex: 1,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", paddingHorizontal: 2 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  onlineLabel: { fontSize: 11, fontWeight: "700", color: GREEN_DOT },
  cardSub: { fontSize: 12, color: "#9CA3AF" },
  lastMsg: { fontSize: 12, color: "#6B7280", marginTop: 3, fontStyle: "italic" },
  saharaIdBadge: { fontSize: 11, color: PURPLE, fontWeight: "700", marginTop: 1, letterSpacing: 0.5 },

  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: PURPLE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  cancelBtn: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB",
  },
  cancelBtnText: { color: "#6B7280", fontWeight: "600", fontSize: 13 },

  chatBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: PURPLE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  unfriendBtn: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FEF2F2",
  },
  unfriendBtnText: { color: "#EF4444", fontWeight: "600", fontSize: 12 },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
});
