export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const API_BASE = `${API_BASE_URL}/api`;

export function getAuthToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("model-shop-auth-token") || "";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || `API error ${response.status}`);
  }

  return payload as T;
}
