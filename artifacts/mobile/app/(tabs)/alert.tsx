import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HelpCategory, HelpType, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { notifyNewRequest, scheduleLocalNotification } from "@/utils/notifications";

const MAX_VIDEO_SECONDS = 600;

const CATEGORIES: { key: HelpCategory; label: string; hindi: string; emoji: string }[] = [
  { key: "food", label: "Food", hindi: "भोजन", emoji: "🍲" },
  { key: "medical", label: "Medical", hindi: "चिकित्सा", emoji: "🏥" },
  { key: "job", label: "Job", hindi: "रोजगार", emoji: "💼" },
  { key: "animal", label: "Animal", hindi: "पशु", emoji: "🐾" },
  { key: "education", label: "Education", hindi: "शिक्षा", emoji: "📚" },
];

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

interface PickedMedia {
  uri: string;
  type: "image" | "video";
  name: string;
  mimeType: string;
}

export default function PostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addRequest, profile } = useApp();
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [helpType, setHelpType] = useState<HelpType>("need_help");
  const [category, setCategory] = useState<HelpCategory>("medical");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleChoose = (type: HelpType) => {
    setHelpType(type);
    setStep("form");
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos and videos to attach media."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (media.length >= 5) {
      Alert.alert("Limit reached", "You can attach up to 5 photos/videos.");
      return;
    }
    const granted = await requestPermission();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - media.length,
    });

    if (!result.canceled) {
      const newMedia: PickedMedia[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: "image" as const,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      }));
      setMedia((prev) => [...prev, ...newMedia].slice(0, 5));
    }
  };

  const pickVideo = async () => {
    if (media.length >= 5) {
      Alert.alert("Limit reached", "You can attach up to 5 photos/videos.");
      return;
    }
    const granted = await requestPermission();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.duration && asset.duration > MAX_VIDEO_SECONDS * 1000) {
        Alert.alert("Video too long", "Video must be 10 minutes or less.");
        return;
      }
      setMedia((prev) =>
        [
          ...prev,
          {
            uri: asset.uri,
            type: "video" as const,
            name: asset.fileName ?? `video_${Date.now()}.mp4`,
            mimeType: asset.mimeType ?? "video/mp4",
          },
        ].slice(0, 5)
      );
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const openCamera = async () => {
    if (media.length >= 5) {
      Alert.alert("Limit reached", "You can attach up to 5 photos/videos.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === "video";
      if (isVideo && asset.duration && asset.duration > MAX_VIDEO_SECONDS * 1000) {
        Alert.alert("Video too long", "Video must be 10 minutes or less.");
        return;
      }
      setMedia((prev) =>
        [
          ...prev,
          {
            uri: asset.uri,
            type: isVideo ? ("video" as const) : ("image" as const),
            name: asset.fileName ?? `media_${Date.now()}`,
            mimeType: asset.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg"),
          },
        ].slice(0, 5)
      );
    }
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (media.length === 0) return [];
    setUploading(true);
    try {
      const formData = new FormData();
      for (const item of media) {
        formData.append("files", {
          uri: item.uri,
          name: item.name,
          type: item.mimeType,
        } as unknown as Blob);
      }
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json() as { urls: string[] };
      return json.urls;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert("Missing Info", "Please fill title, description and location.");
      return;
    }
    setSubmitting(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      let mediaUrls: string[] = [];
      if (media.length > 0) {
        try {
          mediaUrls = await uploadMedia();
        } catch {
          Alert.alert(
            "Upload failed",
            "Could not upload media. Do you want to post without it?",
            [
              { text: "Cancel", style: "cancel", onPress: () => setSubmitting(false) },
              {
                text: "Post without media",
                onPress: async () => {
                  await submitRequest([]);
                },
              },
            ]
          );
          return;
        }
      }

      await submitRequest(mediaUrls);
    } catch {
      Alert.alert("Error", "Could not post request. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRequest = async (mediaUrls: string[]) => {
    await addRequest({
      category,
      helpType,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      postedBy: profile.name || "Anonymous",
      contactPhone: isAnonymous ? undefined : (phone.trim() || undefined),
      mediaUrls,
      isAnonymous,
    });

    void notifyNewRequest({
      title: title.trim(),
      category,
      helpType,
      location: location.trim(),
    });

    void scheduleLocalNotification(
      "Posted! 🙏",
      helpType === "need_help"
        ? "Your request has been posted. Someone will reach out soon."
        : "Your offer to help has been posted. People in need will contact you."
    );

    setTitle("");
    setDescription("");
    setLocation("");
    setPhone("");
    setMedia([]);
    setIsAnonymous(false);
    setStep("choose");
    Alert.alert(
      "Posted! 🙏",
      helpType === "need_help"
        ? "Your request has been posted. Someone will reach out soon."
        : "Your offer to help has been posted. People in need will contact you."
    );
  };

  if (step === "choose") {
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            मदद करें / Help
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Choose how you want to participate
          </Text>
        </View>

        <View style={styles.chooseContent}>
          <Text style={[styles.chooseQuestion, { color: colors.foreground }]}>
            What would you like to do?
          </Text>

          <TouchableOpacity
            style={styles.chooseCardNeed}
            onPress={() => handleChoose("need_help")}
          >
            <LinearGradient
              colors={["#1E3A5F", "#2D5A8E"]}
              style={styles.chooseCardGrad}
            >
              <View style={styles.chooseCardDot}>
                <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
              </View>
              <Text style={styles.chooseCardTitle}>मदद चाहिए</Text>
              <Text style={styles.chooseCardSub}>(Request Help)</Text>
              <Text style={styles.chooseCardDesc}>
                I need help with food, medical, job, animals or education
              </Text>
              <View style={styles.chooseArrow}>
                <Feather name="arrow-right" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chooseCardGive}
            onPress={() => handleChoose("give_help")}
          >
            <LinearGradient
              colors={["#047857", "#059669"]}
              style={styles.chooseCardGrad}
            >
              <View style={styles.chooseCardDot}>
                <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
              </View>
              <Text style={styles.chooseCardTitle}>मदद करना है</Text>
              <Text style={styles.chooseCardSub}>(Give Help)</Text>
              <Text style={styles.chooseCardDesc}>
                I want to offer help — food, medical support, job, or education
              </Text>
              <View style={styles.chooseArrow}>
                <Feather name="arrow-right" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const accentColor = helpType === "need_help" ? "#1E3A5F" : "#059669";

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
        <TouchableOpacity onPress={() => setStep("choose")} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {helpType === "need_help" ? "मदद चाहिए" : "मदद करना है"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {helpType === "need_help" ? "Request Help" : "Give Help"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.formScroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Category / श्रेणी
        </Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catOption,
                {
                  backgroundColor:
                    category === cat.key ? "#ECFDF5" : colors.card,
                  borderColor:
                    category === cat.key ? "#059669" : colors.border,
                },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={styles.catOptionEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.catOptionHindi,
                  {
                    color:
                      category === cat.key ? "#059669" : colors.foreground,
                  },
                ]}
              >
                {cat.hindi}
              </Text>
              <Text
                style={[styles.catOptionLabel, { color: colors.mutedForeground }]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Title *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Brief title of your request..."
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Description *
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Describe your situation in detail..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Location *
        </Text>
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="map-pin" size={16} color="#059669" />
          <TextInput
            style={[styles.inputInRow, { color: colors.foreground }]}
            placeholder="Area or landmark..."
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Contact Phone (Optional)
        </Text>
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="phone" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.inputInRow, { color: colors.foreground }]}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Photo / Video (Optional)
        </Text>
        <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>
          फ़ोटो या वीडियो जोड़ें (वीडियो अधिकतम 10 मिनट) · Max 5 files
        </Text>

        <View style={styles.mediaBtnRow}>
          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={openCamera}
          >
            <Feather name="camera" size={18} color={accentColor} />
            <Text style={[styles.mediaBtnText, { color: accentColor }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={pickImage}
          >
            <Feather name="image" size={18} color={accentColor} />
            <Text style={[styles.mediaBtnText, { color: accentColor }]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={pickVideo}
          >
            <Feather name="video" size={18} color={accentColor} />
            <Text style={[styles.mediaBtnText, { color: accentColor }]}>Video</Text>
          </TouchableOpacity>
        </View>

        {media.length > 0 && (
          <View style={styles.previewRow}>
            {media.map((item, index) => (
              <View key={index} style={styles.previewItem}>
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.previewThumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.previewThumb, styles.videoThumb]}>
                    <Feather name="video" size={24} color="#fff" />
                    <Text style={styles.videoLabel}>Video</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeMedia(index)}
                >
                  <Feather name="x" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.anonymousRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.anonymousLeft}>
            <Text style={styles.anonymousIcon}>🕵️</Text>
            <View>
              <Text style={[styles.anonymousLabel, { color: colors.foreground }]}>Anonymous Post</Text>
              <Text style={[styles.anonymousSub, { color: colors.mutedForeground }]}>
                {isAnonymous ? "आपका नाम छुपा रहेगा" : "आपका नाम दिखेगा"}
              </Text>
            </View>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: "#E5E7EB", true: "#059669" }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: accentColor,
              opacity: submitting || uploading ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitting || uploading}
        >
          {(submitting || uploading) ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitBtnText}>
                {uploading ? "Uploading media..." : "Posting..."}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.submitBtnText}>
                {helpType === "need_help" ? "Post Request" : "Post Offer"}
              </Text>
              <Feather name="send" size={17} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },

  chooseContent: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 16 },
  chooseQuestion: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  chooseCardNeed: { borderRadius: 16, overflow: "hidden" },
  chooseCardGive: { borderRadius: 16, overflow: "hidden" },
  chooseCardGrad: { padding: 24, minHeight: 140 },
  chooseCardDot: { marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 100 },
  chooseCardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  chooseCardSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 10,
  },
  chooseCardDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  chooseArrow: {
    position: "absolute",
    right: 20,
    top: "50%",
  },

  formScroll: { paddingHorizontal: 16, paddingTop: 20 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  catOption: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 60,
    gap: 3,
  },
  catOptionEmoji: { fontSize: 22 },
  catOptionHindi: { fontSize: 12, fontWeight: "700" },
  catOptionLabel: { fontSize: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  textArea: { height: 100, paddingTop: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  inputInRow: { flex: 1, fontSize: 14 },

  mediaHint: { fontSize: 11, marginBottom: 10, marginTop: -4 },
  mediaBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  mediaBtnText: { fontSize: 13, fontWeight: "600" },

  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  previewItem: { position: "relative" },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
  },
  videoThumb: {
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  videoLabel: { color: "#fff", fontSize: 10, fontWeight: "600" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  anonymousRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  anonymousLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  anonymousIcon: { fontSize: 22 },
  anonymousLabel: { fontSize: 14, fontWeight: "700" },
  anonymousSub: { fontSize: 11, marginTop: 2 },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
