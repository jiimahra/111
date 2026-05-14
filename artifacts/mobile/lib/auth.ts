const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "");

export interface AuthUser {
  id: string;
  saharaId: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  photoUrl?: string | null;
}

async function patchJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* no-op */
  }
  if (!res.ok) {
    const msg = data?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* no-op */
  }
  if (!res.ok) {
    // Special handling for account_blocked
    if (data?.error === "account_blocked") {
      const err: any = new Error("account_blocked");
      err.banInfo = {
        blockedUntil: data.blockedUntil ?? null,
        isPermanent: data.isPermanent ?? false,
        blockReason: data.blockReason ?? null,
      };
      throw err;
    }
    const msg = data?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export const authApi = {
  signup(input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    location?: string;
  }) {
    return postJson<{ user: AuthUser; apiToken?: string }>("/auth/signup", input);
  },
  login(input: { email: string; password: string }) {
    return postJson<{ user: AuthUser; apiToken?: string }>("/auth/login", input);
  },
  googleLogin(accessToken: string) {
    return postJson<{ user: AuthUser; apiToken?: string }>("/auth/google", { accessToken });
  },
  googleSignup(accessToken: string) {
    return postJson<{ user: AuthUser; apiToken?: string }>("/auth/google-signup", { accessToken });
  },
  forgotPassword(email: string) {
    return postJson<{ ok: true; message: string }>("/auth/forgot-password", { email });
  },
  resetPassword(input: { email: string; code: string; newPassword: string }) {
    return postJson<{ user: AuthUser; apiToken?: string }>("/auth/reset-password", input);
  },
  updatePhoto(input: { photoUrl: string }, token: string) {
    return patchJson<{ ok: true }>("/auth/photo", { photoUrl: input.photoUrl }, token);
  },
};
