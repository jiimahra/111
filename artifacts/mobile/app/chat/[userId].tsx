import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useCall } from "@/contexts/CallContext";
import { socialApi, type ChatMessage } from "@/lib/social";

const GREEN = "#7C3AED";
const NAVY = "#EC4899";

export default function ChatScreen() {
  const { userId: friendId, name: friendName } = useLocalSearchParams<{ userId: string; name: string }>();
  const { profile } = useApp();
  const { startCall } = useCall();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  const myId = profile.id ?? "";

  const fetchOnlineStatus = useCallback(async () => {
    if (!friendId) return;
    try {
      const status = await socialApi.getOnlineStatus(friendId);
      setIsOnline(status.isOnline);
      setLastSeen(status.lastSeen);
    } catch { /* silent */ }
  }, [friendId]);

  const handleCall = useCallback(async (isVideo: boolean) => {
    if (!friendId || !friendName || calling) return;
    setCalling(true);
    try {
      await startCall(friendId, friendName, isVideo);
    } catch (e: any) {
      Alert.alert("Call Failed", e?.message ?? "Could not start call.");
    } finally {
      setCalling(false);
    }
  }, [friendId, friendName, calling, startCall]);

  useEffect(() => {
    if (friendName) {
      navigation.setOptions({
        title: friendName,
        headerTitle: () => (
          <ChatHeader name={friendName} isOnline={isOnline} lastSeen={lastSeen} />
        ),
        headerRight: () => (
          <View style={{ flexDirection: "row", gap: 6, marginRight: 4 }}>
            <TouchableOpacity
              style={headerStyles.callBtn}
              onPress={() => handleCall(false)}
              disabled={calling}
            >
              <Feather name="phone" size={19} color={GREEN} />
            </TouchableOpacity>
            <TouchableOpacity
              style={headerStyles.callBtn}
              onPress={() => handleCall(true)}
              disabled={calling}
            >
              <Feather name="video" size={19} color={GREEN} />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [friendName, navigation, isOnline, lastSeen, handleCall, calling]);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!myId || !friendId) return;
    try {
      const msgs = await socialApi.getMessages(myId, friendId);
      setMessages(msgs);
      await socialApi.markRead(myId, friendId);
    } catch (e: any) {
      if (!silent) Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, [myId, friendId]);

  useEffect(() => {
    fetchMessages();
    fetchOnlineStatus();

    pollRef.current = setInterval(() => fetchMessages(true), 3000);
    onlineRef.current = setInterval(() => fetchOnlineStatus(), 5000);

    if (myId) {
      void socialApi.heartbeat(myId);
      heartbeatRef.current = setInterval(() => {
        void socialApi.heartbeat(myId);
      }, 30_000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (onlineRef.current) clearInterval(onlineRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [fetchMessages, fetchOnlineStatus, myId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setSending(true);
    try {
      const msg = await socialApi.sendMessage(myId, friendId, content);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.fromUserId === myId;
    const prev = messages[index - 1];
    const showTime =
      !prev ||
      new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;

    return (
      <>
        {showTime && (
          <Text style={styles.timeLabel}>
            {formatTime(item.createdAt)}
          </Text>
        )}
        <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
          {!isMe && (
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {(friendName ?? "?")[0].toUpperCase()}
              </Text>
              {isOnline && <View style={styles.avatarOnlineDot} />}
            </View>
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
              {item.content}
            </Text>
          </View>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GREEN} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Feather name="message-circle" size={32} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptyHint}>Say hello to {friendName}! 👋</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
          renderItem={renderItem}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.textInput}
          placeholder={`Message ${friendName ?? ""}…`}
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatHeader({ name, isOnline, lastSeen }: { name: string; isOnline: boolean; lastSeen: string | null }) {
  const subtitle = isOnline ? "Online" : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : "Offline";
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
      <View style={styles.headerStatusRow}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10B981" : "#9CA3AF" }]} />
        <Text style={[styles.headerStatus, { color: isOnline ? "#10B981" : "#9CA3AF" }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const headerStyles = StyleSheet.create({
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

  headerContainer: { alignItems: "center" },
  headerName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerStatusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  headerStatus: { fontSize: 11, fontWeight: "600" },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyHint: { fontSize: 14, color: "#9CA3AF" },

  messageList: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },

  timeLabel: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginVertical: 10,
  },

  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 2 },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowThem: { justifyContent: "flex-start" },

  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  avatarSmallText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#F9FAFB",
  },

  bubble: {
    maxWidth: "72%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: "#fff" },
  bubbleTextThem: { color: "#111827" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    color: "#111827",
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: "#D1D5DB", shadowOpacity: 0 },
});
