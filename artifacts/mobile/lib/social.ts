const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

let _apiToken: string | null = null;

export function setApiToken(token: string | null) {
  _apiToken = token;
}

function authHeader(): Record<string, string> {
  return _apiToken ? { "x-sahara-token": _apiToken } : {};
}

async function req<T>(path: string, options?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  const res = await fetch(`${API_BASE}/api/social${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch { /* no-op */ }
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface SocialUser {
  id: string;
  saharaId: string;
  name: string;
  location: string | null;
  photoUrl?: string | null;
  requestStatus: "none" | "sent" | "received" | "friends";
  requestId?: string;
}

export interface FriendRequest {
  id: string;
  from: { id: string; name: string; location: string | null; photoUrl?: string | null };
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  location: string | null;
  photoUrl?: string | null;
  unreadCount: number;
  isOnline?: boolean;
}

export interface ConversationPartner {
  id: string;
  name: string;
  location: string | null;
  photoUrl?: string | null;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string | null;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  content: string;
  createdAt: string;
}

export const socialApi = {
  getUsers: (_userId: string) =>
    req<SocialUser[]>(`/users?userId=${_userId}`),

  sendRequest: (_fromUserId: string, toUserId: string) =>
    req<{ ok: true }>("/friend-request", { method: "POST", body: { toUserId } }),

  cancelRequest: (requestId: string) =>
    req<{ ok: true }>(`/friend-request/${requestId}/cancel`, { method: "POST" }),

  getRequests: (_userId: string) =>
    req<FriendRequest[]>(`/friend-requests?userId=${_userId}`),

  acceptRequest: (requestId: string) =>
    req<{ ok: true }>(`/friend-request/${requestId}/accept`, { method: "POST" }),

  declineRequest: (requestId: string) =>
    req<{ ok: true }>(`/friend-request/${requestId}/decline`, { method: "POST" }),

  getFriends: (_userId: string) =>
    req<Friend[]>(`/friends?userId=${_userId}`),

  getMessages: (_userId: string, friendId: string) =>
    req<ChatMessage[]>(`/messages?friendId=${friendId}`),

  sendMessage: (_fromUserId: string, toUserId: string, content: string) =>
    req<ChatMessage>("/messages", { method: "POST", body: { toUserId, content } }),

  markRead: (_userId: string, friendId: string) =>
    req<{ ok: true }>("/messages/read", { method: "POST", body: { friendId } }),

  heartbeat: (_userId: string) =>
    req<{ ok: true }>("/heartbeat", { method: "POST", body: {} }),

  getOnlineStatus: (userId: string) =>
    req<{ isOnline: boolean; lastSeen: string | null }>(`/online-status/${userId}`),

  getConversations: (_userId: string) =>
    req<ConversationPartner[]>(`/conversations?userId=${_userId}`),

  unfriend: (_userId: string, friendId: string) =>
    req<{ ok: true }>("/unfriend", { method: "POST", body: { friendId } }),
};
