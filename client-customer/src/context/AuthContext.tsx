"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export type UserRole = "customer" | "admin";

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
  token: string;
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
  role: "user" | "admin";
}

interface LoginResponse {
  token: string;
  user: ApiUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_KEY = "model-shop-auth-user";
const TOKEN_KEY = "model-shop-auth-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY) || "";
    const rawUser = window.localStorage.getItem(AUTH_KEY);
    setToken(storedToken);

    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser) as AuthUser);
      } catch {
        window.localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const persist = useCallback((nextUser: AuthUser, nextToken?: string) => {
    setUser(nextUser);
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));

    if (nextToken) {
      setToken(nextToken);
      window.localStorage.setItem(TOKEN_KEY, nextToken);
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      });
      const nextUser = mapApiUser(response.user);
      persist(nextUser, response.token);
      return nextUser;
    },
    [persist]
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

      try {
        const updated = await apiFetch<ApiUser>("/auth/me", {
          method: "PUT",
          body: JSON.stringify({
            name: payload.name || user.name,
            phone: payload.phone || user.phone || ""
          })
        });
        persist({ ...user, ...mapApiUser(updated), address: payload.address || user.address });
      } catch {
        const nextUser = { ...user, ...payload };
        setUser(nextUser);
        window.localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));
      }
    },
    [persist, user]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken("");
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, register, updateProfile, logout }),
    [login, logout, register, token, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function mapApiUser(apiUser: ApiUser): AuthUser {
  return {
    id: apiUser.id || apiUser._id || "",
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone,
    role: apiUser.role === "admin" ? "admin" : "customer"
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
