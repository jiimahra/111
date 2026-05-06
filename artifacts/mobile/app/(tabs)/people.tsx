import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { socialApi, type Friend, type FriendRequest, type SocialUser } from "@/lib/social";

const GREEN = "#059669";
const DARK = "#064E3B";

type Tab = "people" | "requests" | "friends";

export default function PeopleScreen() {
  const { profile } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("people");

  const [users, setUsers] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
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
      const [u, r, f] = await Promise.all([
        socialApi.getUsers(userId),
        socialApi.getRequests(userId),
        socialApi.getFriends(userId),
      ]);
      setUsers(u);
      setRequests(r);
      setFriends(f);
    } catch (e: any) {
      if (!silent) Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
    pollRef.current = setInterval(() => loadAll(true), 5000);
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

  const tabCount: Record<Tab, number> = {
    people: users.length,
    requests: requests.length,
    friends: friends.length,
  };

  const TABS: { key: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "people", label: "People", icon: "users" },
    { key: "requests", label: "Requests", icon: "user-plus" },
    { key: "friends", label: "Friends", icon: "heart" },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSub}>Connect with people around you</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Feather name={t.icon} size={15} color={active ? GREEN : "#9CA3AF"} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {tabCount[t.key] > 0 && (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                    {tabCount[t.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search (People tab only) */}
      {tab === "people" && (
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or city…"
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

      {loading ? (
        <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* PEOPLE */}
          {tab === "people" && (
            <FlatList
              data={filteredUsers}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={GREEN} />}
              ListEmptyComponent={<EmptyState icon="users" text="No users found" />}
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

          {/* REQUESTS */}
          {tab === "requests" && (
            <FlatList
              data={requests}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={GREEN} />}
              ListEmptyComponent={<EmptyState icon="inbox" text="No friend requests" />}
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

          {/* FRIENDS */}
          {tab === "friends" && (
            <FlatList
              data={friends}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={GREEN} />}
              ListEmptyComponent={<EmptyState icon="heart" text="No friends yet — send some requests!" />}
              renderItem={({ item }) => (
                <FriendCard
                  friend={item}
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

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

function UserCard({ user, busy, onSend, onCancel, onChat }: {
  user: SocialUser;
  busy: boolean;
  onSend: () => void;
  onCancel: () => void;
  onChat: () => void;
}) {
  const isFriend = user.requestStatus === "friends";
  const isSent = user.requestStatus === "sent";
  const isReceived = user.requestStatus === "received";

  return (
    <View style={styles.card}>
      <Avatar name={user.name} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardName}>{user.name}</Text>
        <Text style={styles.saharaIdBadge}>
          ID: {user.saharaId.slice(0,3)}-{user.saharaId.slice(3,6)}-{user.saharaId.slice(6)}
        </Text>
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

function RequestCard({ request, busyAccept, busyDecline, onAccept, onDecline }: {
  request: FriendRequest;
  busyAccept: boolean;
  busyDecline: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.card}>
      <Avatar name={request.from.name} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardName}>{request.from.name}</Text>
        {request.from.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name="map-pin" size={11} color="#9CA3AF" />
            <Text style={styles.cardSub}>{request.from.location}</Text>
          </View>
        ) : null}
        <Text style={[styles.cardSub, { marginTop: 4 }]}>
          Wants to connect with you
        </Text>
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

function FriendCard({ friend, onChat }: { friend: Friend; onChat: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onChat} activeOpacity={0.75}>
      <Avatar name={friend.name} />
      {friend.unreadCount > 0 && (
        <View style={styles.unreadDot}>
          <Text style={styles.unreadDotText}>{friend.unreadCount}</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardName}>{friend.name}</Text>
        {friend.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name="map-pin" size={11} color="#9CA3AF" />
            <Text style={styles.cardSub}>{friend.location}</Text>
          </View>
        ) : null}
        {friend.unreadCount > 0 && (
          <Text style={[styles.cardSub, { color: GREEN, fontWeight: "700", marginTop: 2 }]}>
            {friend.unreadCount} new message{friend.unreadCount > 1 ? "s" : ""}
          </Text>
        )}
      </View>
      <View style={styles.chatBtn}>
        <Feather name="message-circle" size={14} color="#fff" />
        <Text style={styles.chatBtnText}>Chat</Text>
      </View>
    </TouchableOpacity>
  );
}

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingHorizontal: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: GREEN },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  tabLabelActive: { color: GREEN },
  badge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  badgeActive: { backgroundColor: "#DCFCE7" },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#6B7280" },
  badgeTextActive: { color: GREEN },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  avatar: {
    backgroundColor: DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800" },

  unreadDot: {
    position: "absolute",
    top: 12,
    left: 44,
    backgroundColor: GREEN,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 1,
  },
  unreadDotText: { fontSize: 10, fontWeight: "800", color: "#fff", paddingHorizontal: 2 },

  cardName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSub: { fontSize: 12, color: "#9CA3AF" },
  saharaIdBadge: { fontSize: 11, color: "#059669", fontWeight: "700", marginTop: 1, letterSpacing: 0.5 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  cancelBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  cancelBtnText: { color: "#6B7280", fontWeight: "600", fontSize: 13 },

  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1E3A5F",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
});
