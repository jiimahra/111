import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Section = {
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  title: string;
  titleHi: string;
  points: { text: string; isBanned?: boolean }[];
};

const SECTIONS: Section[] = [
  {
    icon: "user-check",
    color: "#7C3AED",
    title: "App का उपयोग कौन कर सकता है?",
    titleHi: "Eligibility",
    points: [
      { text: "Sahara का उपयोग करने के लिए आपकी आयु कम से कम 13 वर्ष होनी चाहिए।" },
      { text: "App का उपयोग करके आप इन शर्तों से सहमत होते हैं।" },
      { text: "एक व्यक्ति केवल एक ही account बना सकता है।" },
      { text: "भारत के कानूनों का पालन करना अनिवार्य है।" },
    ],
  },
  {
    icon: "life-buoy",
    color: "#22C55E",
    title: "App का सही उपयोग",
    titleHi: "Allowed Use",
    points: [
      { text: "Food, medical, education, job — इन ज़रूरतों के लिए help request डालें।" },
      { text: "ज़रूरतमंद लोगों की मदद के लिए volunteer बनें।" },
      { text: "Community के साथ विनम्रता और सम्मान से बात करें।" },
      { text: "सच्ची और सटीक जानकारी share करें।" },
      { text: "किसी की समस्या जानकर उसे अनावश्यक delay किए बिना उत्तर दें।" },
    ],
  },
  {
    icon: "slash",
    color: "#DC2626",
    title: "प्रतिबंधित गतिविधियाँ",
    titleHi: "Banned Activities",
    points: [
      { text: "झूठी या भ्रामक help requests डालना — इससे ज़रूरी मदद में देरी होती है।", isBanned: true },
      { text: "किसी को भी धमकाना, परेशान करना या बदनाम करना।", isBanned: true },
      { text: "अश्लील, नफरत फैलाने वाली या हिंसक content share करना।", isBanned: true },
      { text: "दूसरे users की personal information का दुरुपयोग करना।", isBanned: true },
      { text: "Spam messages या unsolicited advertisements भेजना।", isBanned: true },
      { text: "किसी की पहचान चुराकर उनके नाम पर request डालना।", isBanned: true },
      { text: "App को hack करने, manipulate करने या exploit करने की कोशिश करना।", isBanned: true },
      { text: "नशीले पदार्थों, हथियारों या अवैध वस्तुओं का लेन-देन।", isBanned: true },
      { text: "बच्चों के साथ किसी भी प्रकार का अनुचित व्यवहार।", isBanned: true },
      { text: "धर्म, जाति, लिंग के आधार पर भेदभाव करना।", isBanned: true },
    ],
  },
  {
    icon: "file-text",
    color: "#EC4899",
    title: "Content की जिम्मेदारी",
    titleHi: "Content Responsibility",
    points: [
      { text: "आप जो भी content post करते हैं उसकी पूरी जिम्मेदारी आपकी है।" },
      { text: "Sahara team को किसी भी content को बिना notice के हटाने का अधिकार है।" },
      { text: "Copyrighted material बिना permission के share न करें।" },
      { text: "किसी की personal photo या video उनकी अनुमति के बिना share न करें।" },
    ],
  },
  {
    icon: "shield",
    color: "#FF6B00",
    title: "Account बंद होने की शर्तें",
    titleHi: "Account Suspension",
    points: [
      { text: "इन नियमों का उल्लंघन करने पर account तुरंत block या permanently ban किया जा सकता है।" },
      { text: "Ban की अवधि: 3 महीने, 6 महीने, 1 साल, 5 साल, या Permanent।" },
      { text: "अगर आपको लगता है बैन गलत है, तो saharaapphelp@gmail.com पर appeal करें।" },
      { text: "Permanent ban के मामले में नया account बनाने की भी अनुमति नहीं होगी।" },
    ],
  },
  {
    icon: "alert-triangle",
    color: "#F59E0B",
    title: "Disclaimer",
    titleHi: "अस्वीकरण",
    points: [
      { text: "Sahara एक community platform है — हम किसी भी help की guarantee नहीं देते।" },
      { text: "App में मिली जानकारी को professional medical/legal advice का विकल्प न मानें।" },
      { text: "Platform की availability और uptime की कोई guarantee नहीं है।" },
      { text: "Sahara किसी भी user के बीच हुए लेन-देन के लिए ज़िम्मेदार नहीं है।" },
    ],
  },
  {
    icon: "edit-3",
    color: "#6366F1",
    title: "Terms में बदलाव",
    titleHi: "Changes to Terms",
    points: [
      { text: "Sahara इन terms को कभी भी update करने का अधिकार रखता है।" },
      { text: "बड़े बदलाव होने पर app के ज़रिए notification दी जाएगी।" },
      { text: "App का उपयोग जारी रखना नई terms को स्वीकार करना माना जाएगा।" },
    ],
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bannedCount = SECTIONS.find((s) => s.icon === "slash")?.points.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0050", "#7C0000", "#DC2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 0 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>Terms of Service</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>सेवा की शर्तें</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="file-text" size={22} color="#fff" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>
            Sahara का उपयोग करने से पहले कृपया इन शर्तों को ध्यान से पढ़ें। App use करने का मतलब है आप इन सभी नियमों से सहमत हैं।
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="slash" size={12} color="#FCA5A5" />
              <Text style={{ color: "#FCA5A5", fontSize: 12, fontWeight: "700" }}>{bannedCount} Banned Activities</Text>
            </View>
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" }}>Last updated: मई 2026</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((sec) => (
          <View
            key={sec.title}
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: sec.icon === "slash" ? "#FECACA" : colors.border,
            } as any}
          >
            {/* Section Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: sec.color + "18",
                alignItems: "center", justifyContent: "center",
              }}>
                <Feather name={sec.icon} size={18} color={sec.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{sec.title}</Text>
                <Text style={{ fontSize: 11, color: sec.color, fontWeight: "600" }}>{sec.titleHi}</Text>
              </View>
            </View>

            {/* Points */}
            {sec.points.map((pt, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: i < sec.points.length - 1 ? 10 : 0,
                  backgroundColor: pt.isBanned ? "#FFF5F5" : "transparent",
                  borderRadius: pt.isBanned ? 10 : 0,
                  padding: pt.isBanned ? 10 : 0,
                }}
              >
                {pt.isBanned ? (
                  <Feather name="x-circle" size={15} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <View style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: sec.color,
                    marginTop: 7, flexShrink: 0,
                  }} />
                )}
                <Text style={{
                  fontSize: 13,
                  color: pt.isBanned ? "#7F1D1D" : colors.foreground,
                  lineHeight: 20,
                  flex: 1,
                  fontWeight: pt.isBanned ? "600" : "400",
                }}>
                  {pt.text}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Governing Law */}
        <View style={{ backgroundColor: "#EFF6FF", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#BFDBFE" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="flag" size={16} color="#1D4ED8" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#1D4ED8" }}>Governing Law / लागू कानून</Text>
          </View>
          <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 20 }}>
            ये Terms of Service भारत के कानूनों के अनुसार governed होंगे। किसी भी विवाद की स्थिति में नैनीताल, उत्तराखंड की courts का jurisdiction मान्य होगा।
          </Text>
        </View>

        {/* Contact */}
        <View style={{ backgroundColor: "#F0FDF4", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="mail" size={16} color="#166534" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534" }}>सवाल या शिकायत?</Text>
          </View>
          <Text style={{ fontSize: 13, color: "#166534", marginBottom: 10, lineHeight: 18 }}>
            किसी भी term के बारे में सवाल हो, या किसी user की शिकायत करनी हो — email करें:
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:saharaapphelp@gmail.com?subject=Terms%20Query%20-%20Sahara%20App")}
            style={{ backgroundColor: "#166534", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>saharaapphelp@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>© 2026 Sahara — नितिन मेहरा द्वारा स्थापित</Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>saharaapphelp.com · नैनीताल, उत्तराखंड</Text>
        </View>
      </ScrollView>
    </View>
  );
}
