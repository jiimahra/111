import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
  token: string;
}

export interface Stats {
  totalUsers: number;
  totalRequests: number;
  activeRequests: number;
  resolvedRequests: number;
  newUsersThisWeek: number;
  newRequestsThisWeek: number;
  byCategory: { category: string; count: number }[];
  byHelpType: { helpType: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

export interface User {
  id: string;
  saharaId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  createdAt: string;
  lastSeen: string | null;
  isAdmin: boolean | null;
  blockedUntil: string | null;
  blockReason: string | null;
}

export interface Request {
  id: string;
  userId: string;
  category: string;
  helpType: string;
  title: string;
  description: string;
  location: string;
  status: string;
  contactPhone: string;
  postedBy: string;
  mediaUrls: string[] | null;
  createdAt: string;
}

const getSession = (): AdminSession | null => {
  const session = localStorage.getItem("adminSession");
  return session ? JSON.parse(session) : null;
};

const getToken = (): string | undefined => getSession()?.token;

export const useAdminSession = () => {
  return getSession();
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminSession");
  window.location.href = import.meta.env.BASE_URL + "login";
};

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> ?? {}),
      ...authHeaders(),
    },
  });
}

export const useStats = () => {
  return useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/stats`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!getToken(),
  });
};

export const useUsers = () => {
  return useQuery<{ users: User[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!getToken(),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, duration, reason }: { id: string; duration: string; reason?: string }) => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/users/${id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to block user");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/users/${id}/unblock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to unblock user");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useRequests = () => {
  return useQuery<{ requests: Request[] }>({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/requests`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
    enabled: !!getToken(),
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!getToken()) throw new Error("Unauthorized");
      const res = await apiFetch(`/api/admin/requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};
