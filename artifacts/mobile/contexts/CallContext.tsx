import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { io, type Socket } from "socket.io-client";

let RTCPeerConnection: any = null;
let RTCIceCandidate: any = null;
let RTCSessionDescription: any = null;
let mediaDevices: any = null;

try {
  const webrtc = require("react-native-webrtc");
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  mediaDevices = webrtc.mediaDevices;
} catch {
  // Not available in Expo Go — feature works in published app
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

export interface IncomingCall {
  from: string;
  fromName: string;
  isVideo: boolean;
  offer: unknown;
}

export interface ActiveCall {
  peerId: string;
  peerName: string;
  isVideo: boolean;
  localStream: any;
  remoteStream: any;
  isMuted: boolean;
  startedAt: number;
}

interface CallContextType {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  isCallAvailable: boolean;
  startCall: (calleeId: string, calleeName: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  joinCallRoom: (userId: string, userName: string) => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<any>(null);
  const myIdRef = useRef<string>("");
  const myNameRef = useRef<string>("");

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const isCallAvailable = RTCPeerConnection !== null;

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch { /* ignore */ }
      pcRef.current = null;
    }
    setIncomingCall(null);
    setActiveCall((prev) => {
      if (prev?.localStream) {
        try { prev.localStream.getTracks().forEach((t: any) => t.stop()); } catch { /* ignore */ }
      }
      return null;
    });
  }, []);

  const createPC = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.addEventListener("icecandidate", (event: any) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          to: peerId,
          candidate: event.candidate,
        });
      }
    });

    pc.addEventListener("track", (event: any) => {
      const remoteStream = event.streams?.[0] ?? null;
      if (remoteStream) {
        setActiveCall((prev) => prev ? { ...prev, remoteStream } : null);
      }
    });

    pc.addEventListener("connectionstatechange", () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        cleanup();
      }
    });

    return pc;
  }, [cleanup]);

  const getMedia = useCallback(async (isVideo: boolean) => {
    if (!mediaDevices) throw new Error("WebRTC not available in Expo Go");
    return await mediaDevices.getUserMedia({
      audio: true,
      video: isVideo ? { facingMode: "user", width: 640, height: 480 } : false,
    });
  }, []);

  const startCall = useCallback(async (calleeId: string, calleeName: string, isVideo: boolean) => {
    if (!isCallAvailable) {
      Alert.alert(
        `${isVideo ? "Video" : "Voice"} Call उपलब्ध नहीं`,
        "यह feature Expo Go में support नहीं करता। Published Sahara app में पूरी तरह काम करेगा।",
      );
      return;
    }
    if (!socketRef.current) {
      Alert.alert(
        "Connection नहीं है",
        "Server से connect नहीं हो पाया। Internet check करें और dobara try करें।",
      );
      return;
    }

    try {
      const stream = await getMedia(isVideo);
      const pc = createPC(calleeId);
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
      await pc.setLocalDescription(offer);

      setActiveCall({
        peerId: calleeId,
        peerName: calleeName,
        isVideo,
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        startedAt: Date.now(),
      });

      socketRef.current.emit("call-user", {
        to: calleeId,
        from: myIdRef.current,
        fromName: myNameRef.current,
        isVideo,
        offer,
      });
    } catch (err: any) {
      cleanup();
      Alert.alert("Call Failed", err?.message ?? "Could not start call. Check microphone permissions.");
    }
  }, [isCallAvailable, getMedia, createPC, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !isCallAvailable || !socketRef.current) return;
    const { from, fromName, isVideo, offer } = incomingCall;

    try {
      const stream = await getMedia(isVideo);
      const pc = createPC(from);
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setIncomingCall(null);
      setActiveCall({
        peerId: from,
        peerName: fromName,
        isVideo,
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        startedAt: Date.now(),
      });

      socketRef.current.emit("call-accepted", { to: from, answer });
    } catch (err: any) {
      cleanup();
      Alert.alert("Call Failed", err?.message ?? "Could not accept call.");
    }
  }, [incomingCall, isCallAvailable, getMedia, createPC, cleanup]);

  const rejectCall = useCallback(() => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit("call-rejected", { to: incomingCall.from });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (activeCall && socketRef.current) {
      socketRef.current.emit("call-ended", { to: activeCall.peerId });
    }
    cleanup();
  }, [activeCall, cleanup]);

  const toggleMute = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const newMuted = !prev.isMuted;
      try {
        prev.localStream?.getAudioTracks?.()?.forEach((track: any) => {
          track.enabled = !newMuted;
        });
      } catch { /* ignore */ }
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  const joinCallRoom = useCallback((userId: string, userName: string) => {
    myIdRef.current = userId;
    myNameRef.current = userName;
    if (socketRef.current && userId) {
      socketRef.current.emit("join-room", userId);
    }
  }, []);

  useEffect(() => {
    const wsUrl = API_BASE;
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("incoming-call", (data: IncomingCall) => {
      setIncomingCall(data);
    });

    socket.on("call-accepted", async ({ answer }: { answer: any }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch { /* ignore */ }
      }
    });

    socket.on("call-rejected", () => {
      Alert.alert("Call Declined", "The person declined your call.");
      cleanup();
    });

    socket.on("call-ended", () => {
      cleanup();
    });

    socket.on("ice-candidate", async ({ candidate }: { candidate: any }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch { /* ignore */ }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [cleanup]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        isCallAvailable,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        joinCallRoom,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
