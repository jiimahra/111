import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
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

const getUserId = () => getSession()?.userId;

export const useAdminSession = () => {
  return getSession();
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminSession");
  window.location.href = import.meta.env.BASE_URL + "login";
};

export const useStats = () => {
  return useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      const res = await fetch(`/api/admin/stats?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!getUserId(),
  });
};

export const useUsers = () => {
  return useQuery<{ users: User[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      const res = await fetch(`/api/admin/users?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!getUserId(),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      const res = await fetch(`/api/admin/users/${id}?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useRequests = () => {
  return useQuery<{ requests: Request[] }>({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      const res = await fetch(`/api/admin/requests?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
    enabled: !!getUserId(),
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      const res = await fetch(`/api/admin/requests/${id}?userId=${userId}`, {
        method: "DELETE",
      });
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
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      const res = await fetch(`/api/admin/requests/${id}/status?userId=${userId}`, {
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
