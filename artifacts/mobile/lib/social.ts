const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

async function req<T>(path: string, options?: RequestInit & { body?: unknown }): Promise<T> {
  const res = await fetch(`${API_BASE}/api/social${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  requestStatus: "none" | "sent" | "received" | "friends";
  requestId?: string;
}

export interface FriendRequest {
  id: string;
  from: { id: string; name: string; location: string | null };
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  location: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  content: string;
  createdAt: string;
}

export const socialApi = {
  getUsers: (userId: string) =>
    req<SocialUser[]>(`/users?userId=${userId}`),

  sendRequest: (fromUserId: string, toUserId: string) =>
    req<{ ok: true }>("/friend-request", { method: "POST", body: { fromUserId, toUserId } }),

  cancelRequest: (requestId: string) =>
    req<{ ok: true }>(`/friend-request/${requestId}/cancel`, { method: "POST" }),

  getRequests: (userId: string) =>
    req<FriendRequest[]>(`/friend-requests?userId=${userId}`),

  acceptRequest: (requestId: string) =>
    req<{ ok: true }>(`/friend-request/${requestId}/accept`, { method: "POST" }),

  declineRequest: (requestId: string) =>
    req<{ ok: true }>(`/friend-request/${requestId}/decline`, { method: "POST" }),

  getFriends: (userId: string) =>
    req<Friend[]>(`/friends?userId=${userId}`),

  getMessages: (userId: string, friendId: string) =>
    req<ChatMessage[]>(`/messages?userId=${userId}&friendId=${friendId}`),

  sendMessage: (fromUserId: string, toUserId: string, content: string) =>
    req<ChatMessage>("/messages", { method: "POST", body: { fromUserId, toUserId, content } }),

  markRead: (userId: string, friendId: string) =>
    req<{ ok: true }>("/messages/read", { method: "POST", body: { userId, friendId } }),
};
