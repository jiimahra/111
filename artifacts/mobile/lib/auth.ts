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
    return postJson<{ user: AuthUser }>("/auth/signup", input);
  },
  login(input: { email: string; password: string }) {
    return postJson<{ user: AuthUser }>("/auth/login", input);
  },
  forgotPassword(email: string) {
    return postJson<{ ok: true; message: string }>("/auth/forgot-password", { email });
  },
  resetPassword(input: { email: string; code: string; newPassword: string }) {
    return postJson<{ user: AuthUser }>("/auth/reset-password", input);
  },
};
