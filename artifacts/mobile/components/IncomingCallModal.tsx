import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCall } from "@/contexts/CallContext";

export function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!incomingCall) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [incomingCall, pulseAnim]);

  if (!incomingCall) return null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.callType}>
            {incomingCall.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Voice Call"}
          </Text>

          <Animated.View style={[styles.avatarWrap, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(incomingCall.fromName || "?")[0].toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          <Text style={styles.callerName}>{incomingCall.fromName}</Text>
          <Text style={styles.callerSub}>Sahara पर आपको call कर रहा है</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
              <Feather name="phone-off" size={28} color="#fff" />
              <Text style={styles.btnLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
              <Feather name={incomingCall.isVideo ? "video" : "phone"} size={28} color="#fff" />
              <Text style={styles.btnLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#1E3A5F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 12,
  },
  callType: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  avatarWrap: {
    marginVertical: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
  },
  callerName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  callerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  btnRow: {
    flexDirection: "row",
    gap: 48,
    marginTop: 24,
  },
  rejectBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  btnLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
