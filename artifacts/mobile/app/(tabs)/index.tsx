import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image as RNImage,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HelpRequest, useApp } from "@/contexts/AppContext";
import { useLang } from "@/contexts/LangContext";
import { socialApi } from "@/lib/social";
import { useTheme } from "@/contexts/ThemeContext";
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
  const msg = `${emoji} *Sahara – ${typeLabel}*\n\n📌 ${item.title}\n📍 ${item.location}\n\n${item.description}\n\n🌐 saharaapphelp.com`;
  Share.share({ message: msg, title: item.title });
}

function RequestCard({ item, myId }: { item: HelpRequest; myId: string }) {
  const colors = useColors();
  const { lang } = useLang();
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const isNeedHelp = item.helpType === "need_help";
  const catLabel = lang === "hi" ? cat?.hiLabel : cat?.enLabel;
  const hasMedia = item.mediaUrls && item.mediaUrls.length > 0;

  const [showMsg, setShowMsg] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState("");

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
    <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.requestCardTop}>
        <View style={[styles.catBadge, { backgroundColor: isNeedHelp ? "#FEF3C7" : "#DCFCE7" }]}>
          <Text style={styles.catEmoji}>{cat?.emoji}</Text>
          <Text style={[styles.catBadgeText, { color: isNeedHelp ? "#065F46" : "#166534" }]}>
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
      {hasMedia && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardMediaRow}
        >
          {item.mediaUrls!.map((url, i) => {
            const isVideo = url.match(/\.(mp4|mov|webm|3gp|avi)(\?|$)/i);
            return isVideo ? (
              <View key={i} style={styles.cardVideoThumb}>
                <Feather name="play-circle" size={28} color="#fff" />
                <Text style={styles.cardVideoLabel}>Video</Text>
              </View>
            ) : (
              <Image
                key={i}
                source={{ uri: url }}
                style={styles.cardImageThumb}
                contentFit="cover"
              />
            );
          })}
        </ScrollView>
      )}
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
          <Feather name="share-2" size={12} color="#7C3AED" />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.postedByRow}>
        <Feather name={item.isAnonymous ? "eye-off" : "user"} size={11} color={colors.mutedForeground} />
        <Text style={[styles.postedByText, { color: colors.mutedForeground }]}>
          {item.isAnonymous ? "🕵️ Anonymous" : item.postedBy}
        </Text>
      </View>

      {/* Inline Message Box */}
      {canMsg && (
        msgSent ? (
          <View style={styles.cardMsgSentRow}>
            <Feather name="check-circle" size={14} color="#16A34A" />
            <Text style={styles.cardMsgSentText}>Message bhej diya! ✓</Text>
          </View>
        ) : showMsg ? (
          <View style={styles.cardMsgBox}>
            <TextInput
              style={[styles.cardMsgInput, { backgroundColor: colors.muted, color: colors.foreground }]}
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
              style={[styles.cardMsgSendBtn, (!msgText.trim() || msgSending) && styles.cardMsgSendBtnOff]}
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
            <View style={styles.cardMsgBtnRow}>
              <TouchableOpacity style={styles.cardMsgOpenBtn} onPress={() => { setShowMsg(true); setMsgError(""); }}>
                <Feather name="message-circle" size={13} color="#fff" />
                <Text style={styles.cardMsgOpenBtnText}>💬 Message भेजें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardQuickMsgBtn}
                onPress={sendQuickMsg}
                disabled={msgSending}
              >
                {msgSending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.cardQuickMsgBtnText}>
                      {item.helpType === "need_help" ? "🙋 मैं मदद करूंगा" : "🙏 मुझे मदद चाहिए"}
                    </Text>
                }
              </TouchableOpacity>
            </View>
            {!!msgError && (
              <Text style={styles.cardMsgErrorText}>{msgError}</Text>
            )}
          </>
        )
      )}
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

function MenuDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { logout, profile } = useApp();

  const menuItems = [
    { icon: "home" as const, label: "Home", labelHi: "होम", onPress: () => { onClose(); router.push("/(tabs)/"); } },
    { icon: "search" as const, label: "Explore", labelHi: "एक्सप्लोर", onPress: () => { onClose(); router.push("/(tabs)/volunteer"); } },
    { icon: "plus-circle" as const, label: "Post Help", labelHi: "पोस्ट करें", onPress: () => { onClose(); router.push("/(tabs)/alert"); } },
    { icon: "activity" as const, label: "Hospitals", labelHi: "अस्पताल", onPress: () => { onClose(); router.push("/(tabs)/donate"); } },
    { icon: "cpu" as const, label: "AI Help", labelHi: "AI सहायता", onPress: () => { onClose(); router.push("/(tabs)/assist"); } },
    { icon: "message-circle" as const, label: "Chat", labelHi: "चैट", onPress: () => { onClose(); router.push("/(tabs)/people"); } },
    { icon: "user" as const, label: "Profile", labelHi: "प्रोफाइल", onPress: () => { onClose(); router.push("/(tabs)/profile"); } },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.drawerOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.drawer, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
              {/* Drawer Header */}
              <LinearGradient
                colors={["#2D0A6E", "#7C3AED", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.drawerHeader}
              >
                <RNImage
                  source={require("@/assets/images/sahara-logo.png")}
                  style={styles.drawerLogo}
                  resizeMode="contain"
                />
                <Text style={styles.drawerTagline}>साथ मिलकर हम बदलाव ला सकते हैं</Text>
              </LinearGradient>

              {/* Menu Items */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.drawerSectionLabel, { color: colors.mutedForeground }]}>MENU</Text>
                {menuItems.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                    onPress={item.onPress}
                  >
                    <View style={styles.drawerItemIcon}>
                      <Feather name={item.icon} size={18} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.drawerItemLabel, { color: colors.foreground }]}>{item.label}</Text>
                      <Text style={[styles.drawerItemHi, { color: colors.mutedForeground }]}>{item.labelHi}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}

                {/* Settings Section */}
                <Text style={[styles.drawerSectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>SETTINGS / सेटिंग्स</Text>

                <View style={[styles.drawerItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.drawerItemIcon}>
                    <Feather name="moon" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.drawerItemLabel, { color: colors.foreground }]}>Dark Mode</Text>
                    <Text style={[styles.drawerItemHi, { color: colors.mutedForeground }]}>डार्क मोड</Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#E5E7EB", true: "#7C3AED" }}
                    thumbColor="#fff"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                  onPress={() => { onClose(); router.push("/notifications-settings"); }}
                >
                  <View style={styles.drawerItemIcon}>
                    <Feather name="bell" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.drawerItemLabel, { color: colors.foreground }]}>Notifications</Text>
                    <Text style={[styles.drawerItemHi, { color: colors.mutedForeground }]}>सूचनाएं</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                  onPress={() => { onClose(); router.push("/privacy"); }}
                >
                  <View style={styles.drawerItemIcon}>
                    <Feather name="shield" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.drawerItemLabel, { color: colors.foreground }]}>Privacy & Security</Text>
                    <Text style={[styles.drawerItemHi, { color: colors.mutedForeground }]}>निजता एवं सुरक्षा</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                  onPress={() => { onClose(); router.push("/about"); }}
                >
                  <View style={styles.drawerItemIcon}>
                    <Feather name="info" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.drawerItemLabel, { color: colors.foreground }]}>About Sahara</Text>
                    <Text style={[styles.drawerItemHi, { color: colors.mutedForeground }]}>सहारा के बारे में</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                  onPress={() => { onClose(); router.push("/terms"); }}
                >
                  <View style={styles.drawerItemIcon}>
                    <Feather name="file-text" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.drawerItemLabel, { color: colors.foreground }]}>Terms of Service</Text>
                    <Text style={[styles.drawerItemHi, { color: colors.mutedForeground }]}>सेवा की शर्तें</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>

                <View style={{ height: 16 }} />
              </ScrollView>

              {/* Logout Button */}
              {!!profile.id && (
                <TouchableOpacity
                  style={[styles.drawerLogoutBtn, { borderTopColor: colors.border }]}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      if (Platform.OS === "web") {
                        if (typeof window !== "undefined" && window.confirm("Kya aap logout karna chahte hain?")) {
                          logout();
                        }
                      } else {
                        Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Logout", style: "destructive", onPress: logout },
                        ]);
                      }
                    }, 300);
                  }}
                >
                  <Feather name="log-out" size={18} color="#DC2626" />
                  <View>
                    <Text style={styles.drawerLogoutText}>Logout</Text>
                    <Text style={[styles.drawerItemHi, { color: "#EF4444" }]}>लॉगआउट</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Footer */}
              <View style={[styles.drawerFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
                <Text style={[styles.drawerFooterText, { color: colors.mutedForeground }]}>
                  Sahara v1.0 · saharaapphelp.com
                </Text>
                <Text style={[styles.drawerFooterText, { color: colors.mutedForeground }]}>
                  Founded by Nitin Mehra, Nainital
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function HomeScreen() {
  const { requests, profile } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, toggleLang, t } = useLang();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

      <MenuDrawer
        visible={showMenu}
        onClose={() => setShowMenu(false)}
      />

      <FlatList<HelpRequest>
        data={activeRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard item={item} myId={profile.id ?? ""} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <>
            {/* Top Nav */}
            <View style={[styles.navbar, { paddingTop: topPad + 8, backgroundColor: colors.navBg, borderBottomColor: colors.navBorder }]}>
              {/* Left: Hamburger Menu */}
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: colors.navBtnBg }]}
                onPress={() => setShowMenu(true)}
              >
                <Feather name="menu" size={22} color={colors.navIcon} />
              </TouchableOpacity>

              {/* Center: Logo */}
              <View style={styles.navLogo}>
                <RNImage
                  source={require("@/assets/images/sahara-logo.png")}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>

              {/* Right: Lang + Bell + Join */}
              <View style={styles.navRight}>
                <TouchableOpacity
                  style={[styles.langBtn, { backgroundColor: colors.navBtnBg, borderColor: colors.border }]}
                  onPress={toggleLang}
                >
                  <Text style={[styles.langBtnText, { color: colors.navIcon }]}>
                    {lang === "en" ? "हिं" : "EN"}
                  </Text>
                </TouchableOpacity>

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
              colors={["#2D0A6E", "#7C3AED", "#EC4899", "#FF6B00"]}
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
                    <Feather name="map-pin" size={14} color="#EC4899" />
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
                      {"मदद चाहिए"}{"  "}
                      <Text style={styles.ctaSub}>({t("requestHelp")})</Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ctaGiveHelp}
                    onPress={() => router.push("/(tabs)/alert")}
                  >
                    <View style={[styles.ctaDot, { backgroundColor: "#22C55E" }]} />
                    <Text style={styles.ctaGiveHelpText}>
                      {"मदद करना है"}{"  "}
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
                        backgroundColor: selectedCat === cat.key ? "#F3E8FF" : colors.card,
                        borderColor: selectedCat === cat.key ? "#7C3AED" : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
                  >
                    <Text style={styles.catCardEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catCardLabel, { color: selectedCat === cat.key ? "#7C3AED" : colors.foreground }]}>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navLogo: { flexDirection: "row", alignItems: "center" },
  logoImg: { width: 100, height: 34 },
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
    backgroundColor: "#7C3AED",
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
  ctaNeedHelp: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#EC4899", borderRadius: 10, paddingVertical: 14, gap: 8 },
  ctaGiveHelp: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FF6B00", borderRadius: 10, paddingVertical: 14, gap: 8 },
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
  viewAllText: { fontSize: 13, color: "#7C3AED", fontWeight: "600" },

  cardMediaRow: { gap: 8, paddingBottom: 10 },
  cardImageThumb: { width: 100, height: 80, borderRadius: 8, overflow: "hidden" },
  cardVideoThumb: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#2D0A6E",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cardVideoLabel: { color: "#fff", fontSize: 10, fontWeight: "600" },

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
  shareBtnText: { fontSize: 11, fontWeight: "600", color: "#7C3AED" },

  emptyState: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyText: { fontSize: 13 },

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

  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
  },
  drawer: {
    width: "78%",
    maxWidth: 320,
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 4, height: 0 },
    elevation: 20,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  drawerLogo: { width: 120, height: 40, marginBottom: 8 },
  drawerTagline: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontStyle: "italic" },
  drawerSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  drawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: { fontSize: 14, fontWeight: "700" },
  drawerItemHi: { fontSize: 11, marginTop: 1 },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  drawerLogoutText: { fontSize: 14, fontWeight: "700", color: "#DC2626" },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  drawerFooterText: { fontSize: 11 },

  postedByRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  postedByText: { fontSize: 11 },

  cardMsgErrorText: {
    color: "#DC2626", fontSize: 12, fontWeight: "600", marginTop: 5,
  },
  cardMsgBtnRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap",
  },
  cardMsgOpenBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardMsgOpenBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  cardQuickMsgBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardQuickMsgBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  cardMsgBox: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8,
  },
  cardMsgInput: {
    flex: 1, borderRadius: 20,
    paddingHorizontal: 13, paddingVertical: Platform.OS === "ios" ? 9 : 7,
    fontSize: 13,
  },
  cardMsgSendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#16A34A", shadowOpacity: 0.4, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardMsgSendBtnOff: { backgroundColor: "#D1D5DB", shadowOpacity: 0 },

  cardMsgSentRow: {
    flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8,
    backgroundColor: "#DCFCE7", borderRadius: 10, padding: 9,
  },
  cardMsgSentText: { fontSize: 12, fontWeight: "700", color: "#16A34A" },
});
