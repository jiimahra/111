import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ActiveCallScreen } from "@/components/ActiveCallScreen";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { CallProvider, useCall } from "@/contexts/CallContext";
import { LangProvider } from "@/contexts/LangContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { registerForPushNotifications } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function CallRoomJoiner() {
  const { profile } = useApp();
  const { joinCallRoom } = useCall();
  useEffect(() => {
    if (profile.id && profile.name) {
      joinCallRoom(profile.id, profile.name);
    }
  }, [profile.id, profile.name, joinCallRoom]);
  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ban" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen
        name="chat/[userId]"
        options={{ headerShown: true, title: "Chat", headerTintColor: "#059669" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <CallProvider>
              <ThemeProvider>
                <LangProvider>
                  <GestureHandlerRootView>
                    <KeyboardProvider>
                      <CallRoomJoiner />
                      <RootLayoutNav />
                      <IncomingCallModal />
                      <ActiveCallScreen />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </LangProvider>
              </ThemeProvider>
            </CallProvider>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
