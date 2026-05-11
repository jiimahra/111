import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const VALUES = [
  { icon: "heart" as const, color: "#EC4899", title: "सेवा", desc: "हर इंसान की मदद करना हमारा धर्म है।" },
  { icon: "users" as const, color: "#7C3AED", title: "समुदाय", desc: "साथ मिलकर हम बड़े से बड़ा बदलाव ला सकते हैं।" },
  { icon: "shield" as const, color: "#22C55E", title: "विश्वास", desc: "हर user की privacy और safety हमारी ज़िम्मेदारी है।" },
  { icon: "zap" as const, color: "#F59E0B", title: "गति", desc: "ज़रूरत के समय तुरंत मदद मिलनी चाहिए।" },
];

const FEATURES = [
  { icon: "life-buoy" as const, color: "#7C3AED", label: "Help Requests", desc: "Food, medical, jobs, education — हर ज़रूरत के लिए" },
  { icon: "cpu" as const, color: "#EC4899", label: "AI सहायता", desc: "24/7 AI से तुरंत सवालों के जवाब" },
  { icon: "message-circle" as const, color: "#FF6B00", label: "Community Chat", desc: "Live voice & text से लोगों से जुड़ें" },
  { icon: "activity" as const, color: "#22C55E", label: "Hospital Finder", desc: "नज़दीकी अस्पताल और emergency contact" },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1A0050", "#7C3AED", "#EC4899", "#FF6B00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 0 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>About Sahara</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>सहारा के बारे में</Text>
          </View>
        </View>

        <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20 }}>
          <Image
            source={require("@/assets/images/sahara-logo.png")}
            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 14 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 1 }}>SAHARA</Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>साथ मिलकर हम बदलाव ला सकते हैं</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>v1.0</Text>
            </View>
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>🇮🇳 Made in India</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mission */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#7C3AED18", alignItems: "center", justifyContent: "center" }}>
              <Feather name="target" size={18} color="#7C3AED" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>हमारा मिशन</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Our Mission</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
            Sahara एक community-driven platform है जो भारत के हर कोने में लोगों को एक-दूसरे से जोड़ता है।{"\n\n"}
            हम मानते हैं कि हर इंसान में किसी की मदद करने की ताकत है — और हर ज़रूरतमंद को सही समय पर सही मदद मिलनी चाहिए।{"\n\n"}
            Food, medical, education, jobs — हर ज़रूरत के लिए Sahara हमेशा साथ है।
          </Text>
        </View>

        {/* Features */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EC489918", alignItems: "center", justifyContent: "center" }}>
              <Feather name="star" size={18} color="#EC4899" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>App की खासियतें</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Key Features</Text>
            </View>
          </View>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: f.color + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name={f.icon} size={18} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{f.label}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Values */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FF6B0018", alignItems: "center", justifyContent: "center" }}>
              <Feather name="award" size={18} color="#FF6B00" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>हमारे मूल्य</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Our Values</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {VALUES.map((v) => (
              <View key={v.title} style={{ width: "47%", backgroundColor: v.color + "10", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: v.color + "30" }}>
                <Feather name={v.icon} size={20} color={v.color} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: "800", color: v.color, marginBottom: 4 }}>{v.title}</Text>
                <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 17 }}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Founder */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#22C55E18", alignItems: "center", justifyContent: "center" }}>
              <Feather name="user" size={18} color="#22C55E" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Founder</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>संस्थापक</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#7C3AED20", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#7C3AED40" }}>
              <Text style={{ fontSize: 22 }}>👨‍💻</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>Nitin Mehra</Text>
              <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600" }}>नितिन मेहरा</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>नैनीताल, उत्तराखंड</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20, marginTop: 14, fontStyle: "italic" }}>
            "मैंने Sahara इसलिए बनाया क्योंकि मैं चाहता था कि technology से सिर्फ मुनाफा नहीं, बल्कि समाज का भला हो।"
          </Text>
        </View>

        {/* Contact */}
        <View style={{ backgroundColor: "#F0FDF4", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Feather name="mail" size={16} color="#166534" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534" }}>Contact / संपर्क</Text>
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:saharaapphelp@gmail.com")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#BBF7D0" }}
          >
            <Feather name="mail" size={15} color="#15803D" />
            <Text style={{ fontSize: 14, color: "#15803D", fontWeight: "600" }}>saharaapphelp@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://saharaapphelp.com")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10 }}
          >
            <Feather name="globe" size={15} color="#15803D" />
            <Text style={{ fontSize: 14, color: "#15803D", fontWeight: "600" }}>saharaapphelp.com</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>सहारा v1.0 · saharaapphelp.com</Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>नितिन मेहरा द्वारा स्थापित, नैनीताल</Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6 }}>© 2026 Sahara. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
