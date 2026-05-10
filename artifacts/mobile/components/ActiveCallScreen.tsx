import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCall } from "@/contexts/CallContext";

let RTCView: any = null;
try {
  RTCView = require("react-native-webrtc").RTCView;
} catch {
  // Not available in Expo Go
}

function useCallTimer(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function ActiveCallScreen() {
  const { activeCall, endCall, toggleMute } = useCall();
  const timer = useCallTimer(activeCall?.startedAt ?? null);
  const [speakerOn, setSpeakerOn] = useState(false);

  if (!activeCall) return null;

  const { peerName, isVideo, localStream, remoteStream, isMuted } = activeCall;
  const isConnected = !!remoteStream;

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.root}>
        {isVideo && RTCView && remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.audioBackground} />
        )}

        <View style={styles.overlay}>
          <View style={styles.topSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(peerName || "?")[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.peerName}>{peerName}</Text>
            <Text style={styles.status}>
              {isConnected ? timer : "Connecting…"}
            </Text>
            <View style={styles.callTypeBadge}>
              <Text style={styles.callTypeText}>
                {isVideo ? "📹 Video Call" : "🎙️ Voice Call"}
              </Text>
            </View>
          </View>

          {isVideo && RTCView && localStream && (
            <View style={styles.localVideoWrap}>
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
                zOrder={1}
              />
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={toggleMute}
            >
              <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
              <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>

            {isVideo && (
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => setSpeakerOn(!speakerOn)}
              >
                <Feather name="camera" size={24} color="#fff" />
                <Text style={styles.controlLabel}>Flip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => setSpeakerOn(!speakerOn)}
            >
              <Feather name="volume-2" size={24} color="#fff" />
              <Text style={styles.controlLabel}>Speaker</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.endBtn} onPress={endCall}>
              <Feather name="phone-off" size={28} color="#fff" />
              <Text style={styles.controlLabel}>End</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F172A" },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1E293B",
  },
  audioBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1E3A5F",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topSection: { alignItems: "center", gap: 10 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 4,
  },
  avatarText: { fontSize: 38, fontWeight: "800", color: "#fff" },
  peerName: { fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center" },
  status: { fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  callTypeBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  callTypeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  localVideoWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  localVideo: { flex: 1 },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    alignItems: "center",
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  controlBtnActive: { backgroundColor: "#374151" },
  controlLabel: { color: "#fff", fontSize: 10, fontWeight: "600" },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
});
