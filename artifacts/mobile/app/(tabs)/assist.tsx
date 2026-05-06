import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as FileSystem from "expo-file-system";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "मुझे भोजन की मदद चाहिए",
  "Nearby hospitals in Ajmer",
  "How do I post a help request?",
  "मैं किसी की मदद करना चाहता हूँ",
];

export default function AssistScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: Date.now().toString() + "u",
        role: "user",
        content: trimmed,
      };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok) throw new Error("API error");
        const data = (await res.json()) as { reply: string };
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "a", role: "assistant", content: data.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "e",
            role: "assistant",
            content: "माफ़ करें, अभी जवाब देने में दिक्कत है। थोड़ी देर बाद फिर कोशिश करें।",
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, loading]
  );

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) return;
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch {}
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setTranscribing(true);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return;

      if (Platform.OS === "web") {
        setInput("Voice input is available on the mobile app.");
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const res = await fetch(`${API_BASE}/api/ai/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: "audio/m4a" }),
      });

      if (res.ok) {
        const data = (await res.json()) as { transcript: string };
        if (data.transcript) {
          setInput(data.transcript);
        }
      }
    } catch {
    } finally {
      setTranscribing(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Image
              source={require("@/assets/images/sahara-logo.png")}
              style={styles.botAvatarImg}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const showMic = !input.trim() && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/sahara-logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>Sahara सहायक • Type या बोलकर पूछें</Text>
          </View>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* Recording banner */}
      {isRecording && (
        <View style={styles.recordingBanner}>
          <Animated.View style={[styles.recDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.recordingText}>सुन रहा हूँ… बोलें, फिर mic दबाएं</Text>
        </View>
      )}
      {transcribing && (
        <View style={styles.recordingBanner}>
          <ActivityIndicator size="small" color="#F97316" />
          <Text style={styles.recordingText}>आवाज़ समझ रहा हूँ…</Text>
        </View>
      )}

      {/* Messages or Empty State */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="message-circle" size={40} color="#F97316" />
          </View>
          <Text style={styles.emptyTitle}>नमस्ते! मैं Sahara AI हूँ 🙏</Text>
          <Text style={styles.emptySub}>
            लिखकर या 🎤 बोलकर — किसी भी मदद के बारे में पूछें
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* AI typing indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color="#F97316" />
            <Text style={styles.typingText}>Sahara AI सोच रहा है...</Text>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Mic button (left side when empty) */}
        {showMic && Platform.OS !== "web" && (
          <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : new Animated.Value(1) }] }}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={handleMicPress}
              disabled={transcribing}
            >
              <Feather name="mic" size={18} color={isRecording ? "#fff" : "#F97316"} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={
            isRecording ? "रुकिए, सुन रहा हूँ…" : "लिखें या 🎤 बोलें…"
          }
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          editable={!isRecording && !transcribing}
          returnKeyType="send"
        />

        {/* Send button (appears when there's text) */}
        {input.trim() ? (
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={loading}
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          Platform.OS === "web" && (
            <TouchableOpacity style={styles.sendBtnDisabled} disabled>
              <Feather name="send" size={18} color="#fff" />
            </TouchableOpacity>
          )
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7F5" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 80, height: 28 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
  recordingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" },
  recordingText: { fontSize: 13, color: "#92400E", fontWeight: "500" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  suggestions: { width: "100%", gap: 8 },
  suggestionChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  suggestionText: { color: "#F97316", fontSize: 13, fontWeight: "500" },
  messageList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: "row", marginBottom: 8, gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowBot: { justifyContent: "flex-start" },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    overflow: "hidden",
  },
  botAvatarImg: { width: 28, height: 28 },
  bubble: { maxWidth: "75%", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: "#F97316", borderBottomRightRadius: 4 },
  bubbleBot: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextBot: { color: "#111827" },
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  typingText: { fontSize: 12, color: "#6B7280" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
});
