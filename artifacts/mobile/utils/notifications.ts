import { Platform } from "react-native";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

let Notifications: any = null;
let notificationsAvailable = false;

try {
  Notifications = require("expo-notifications");
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationsAvailable = true;
  }
} catch {
  notificationsAvailable = false;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web" || !notificationsAvailable || !Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    await registerTokenWithServer(token.data);
    return token.data;
  } catch {
    return null;
  }
}

async function registerTokenWithServer(token: string) {
  try {
    await fetch(`${API_BASE}/api/notifications/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
  }
}

export async function notifyNewRequest(
  params: { title: string; category: string; helpType: string; location: string },
  token?: string,
) {
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/notifications/new-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sahara-token": token },
      body: JSON.stringify(params),
    });
  } catch {
  }
}

export async function scheduleLocalNotification(title: string, body: string) {
  if (Platform.OS === "web" || !notificationsAvailable || !Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
  }
}
