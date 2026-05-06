import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile, loading } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Ajmer");

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Image
          source={require("@/assets/images/sahara-logo.png")}
          style={{ width: 160, height: 60 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (profile.name) {
    return <>{children}</>;
  }

  const handleJoin = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name to continue.");
      return;
    }
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      location: location.trim() || "Ajmer",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#78350F", "#92400E", "#B45309"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBox}
        >
          <Image
            source={require("@/assets/images/sahara-logo.png")}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>सहारा में आपका स्वागत है</Text>
          <Text style={styles.heroSub}>
            Welcome to Sahara{"\n"}Together we make a difference
          </Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Join the community</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            कृपया जारी रखने के लिए अपनी जानकारी भरें
          </Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Full Name *</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="आपका पूरा नाम"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="phone" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="mail" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="name@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>City</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="map-pin" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Ajmer"
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
            <Text style={styles.joinBtnText}>Join Sahara →</Text>
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            जुड़ने पर आप हमारी सेवा शर्तों से सहमत होते हैं
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16 },
  heroBox: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  heroLogo: { width: 140, height: 50, marginBottom: 16 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 19,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14 },
  joinBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  terms: { fontSize: 11, textAlign: "center", marginTop: 12 },
});
