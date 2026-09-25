import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  /** false cho tới khi GET /auth/me xong (tránh F5 bị đẩy sang /login) */
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // dọn token cũ (phiên bản trước lưu trong localStorage)
    try {
      localStorage.removeItem("token");
    } catch {
      /* ignore */
    }
    api
      .get("/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Gọi sau khi POST /auth/login thành công (cookie đã được server set) */
  const login = useCallback((userInfo) => setUser(userInfo), []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* cookie sẽ tự hết hạn */
    }
    setUser(null);
  }, []);

  // `token` giữ lại để tương thích các trang cũ (sẽ dọn ở Plan B)
  return (
    <AuthContext.Provider value={{ user, token: user ? "session" : "", authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
