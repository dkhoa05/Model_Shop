"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export type UserRole = "customer" | "admin" | "staff" | "accountant";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** true khi đã hỏi server xong trạng thái đăng nhập */
  ready: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (payload: Omit<AuthUser, "id" | "role"> & { password: string; username?: string }) => Promise<AuthUser>;
  updateProfile: (payload: Partial<AuthUser>) => Promise<void>;
  logout: () => void;
}

interface ApiUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  address?: string;
  role: "user" | "admin" | "staff" | "accountant";
}

interface LoginResponse {
  user: ApiUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Nguồn sự thật là server (cookie httpOnly): hỏi /auth/me khi tải trang
  useEffect(() => {
    let cancelled = false;
    // dọn dữ liệu phiên cũ từng lưu trong localStorage
    window.localStorage.removeItem("model-shop-auth-token");
    window.localStorage.removeItem("model-shop-auth-user");
    apiFetch<ApiUser>("/auth/me")
      .then((me) => {
        if (!cancelled) setUser(mapApiUser(me));
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      });
      const nextUser = mapApiUser(response.user);
      setUser(nextUser);
      return nextUser;
    },
    []
  );

  const register = useCallback(
    async (payload: Omit<AuthUser, "id" | "role"> & { password: string; username?: string }) => {
      const username = (payload.username || payload.email.split("@")[0])
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();

      await apiFetch<{ id: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          username,
          email: payload.email,
          password: payload.password
        })
      });

      return login(payload.email, payload.password);
    },
    [login]
  );

  const updateProfile = useCallback(
    async (payload: Partial<AuthUser>) => {
      if (!user) return;
      const updated = await apiFetch<ApiUser>("/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          name: payload.name || user.name,
          phone: payload.phone ?? user.phone ?? "",
          address: payload.address ?? user.address ?? ""
        })
      });
      setUser({ ...user, ...mapApiUser(updated) });
    },
    [user]
  );

  const logout = useCallback(() => {
    setUser(null);
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, updateProfile, logout }),
    [login, logout, ready, register, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function mapApiUser(apiUser: ApiUser): AuthUser {
  return {
    id: apiUser.id || apiUser._id || "",
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone,
    address: apiUser.address,
    role: apiUser.role === "user" ? "customer" : apiUser.role
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
