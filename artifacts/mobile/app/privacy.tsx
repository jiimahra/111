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
  points: string[];
};

const SECTIONS: Section[] = [
  {
    icon: "database",
    color: "#7C3AED",
    title: "Data We Collect",
    titleHi: "हम क्या डेटा इकट्ठा करते हैं",
    points: [
      "आपका नाम, email और phone number (registration के समय)",
      "आपकी location (help requests के लिए)",
      "Profile photo (यदि आप upload करते हैं)",
      "Help requests और chat messages",
      "App usage analytics (anonymous)",
    ],
  },
  {
    icon: "lock",
    color: "#EC4899",
    title: "How We Use Your Data",
    titleHi: "आपका डेटा कैसे उपयोग होता है",
    points: [
      "Community में help requests match करने के लिए",
      "आपके account की पहचान और सुरक्षा के लिए",
      "Push notifications भेजने के लिए",
      "App की quality और performance सुधारने के लिए",
      "Fraud और abuse रोकने के लिए",
    ],
  },
  {
    icon: "share-2",
    color: "#FF6B00",
    title: "Data Sharing",
    titleHi: "डेटा शेयरिंग",
    points: [
      "हम आपका personal data किसी third party को नहीं बेचते",
      "Help requests app के सभी users को दिखती हैं",
      "Chat messages सिर्फ sender और receiver देख सकते हैं",
      "Legal requirement पर government agencies को data share किया जा सकता है",
    ],
  },
  {
    icon: "shield",
    color: "#22C55E",
    title: "Account Security",
    titleHi: "Account की सुरक्षा",
    points: [
      "Strong password रखें — कम से कम 8 characters",
      "अपना password किसी के साथ share न करें",
      "किसी suspicious link पर click न करें",
      "अगर account compromise हो तो तुरंत email करें",
      "Sahara team कभी भी OTP या password नहीं मांगती",
    ],
  },
  {
    icon: "eye-off",
    color: "#F59E0B",
    title: "Your Privacy Rights",
    titleHi: "आपके Privacy अधिकार",
    points: [
      "आप अपना account और data कभी भी delete कर सकते हैं",
      "आप अपनी profile information update कर सकते हैं",
      "आप notifications बंद कर सकते हैं",
      "Data export के लिए हमसे email करें",
    ],
  },
];

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1A0050", "#7C3AED", "#EC4899"]}
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
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>Privacy & Security</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>निजता एवं सुरक्षा</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="shield" size={22} color="#fff" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>
            Sahara आपकी privacy को सर्वोच्च प्राथमिकता देता है। यह policy बताती है कि हम आपका data कैसे collect, use और protect करते हैं।
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
            Last updated: मई 2026
          </Text>
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
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: sec.color + "18", alignItems: "center", justifyContent: "center" }}>
                <Feather name={sec.icon} size={18} color={sec.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{sec.title}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{sec.titleHi}</Text>
              </View>
            </View>
            {sec.points.map((pt, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: i < sec.points.length - 1 ? 10 : 0 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sec.color, marginTop: 7, flexShrink: 0 }} />
                <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20, flex: 1 }}>{pt}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={{ backgroundColor: "#F0FDF4", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="mail" size={16} color="#166534" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534" }}>Privacy के बारे में कोई सवाल?</Text>
          </View>
          <Text style={{ fontSize: 13, color: "#166534", marginBottom: 10, lineHeight: 18 }}>
            हमसे email करें — हम 48 घंटे में जवाब देते हैं।
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:saharaapphelp@gmail.com?subject=Privacy%20Query%20-%20Sahara%20App")}
            style={{ backgroundColor: "#166534", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>saharaapphelp@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
