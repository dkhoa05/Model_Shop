import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  /** false khi còn token nhưng chưa xong GET /auth/me (tránh F5 bị đẩy sang /login rồi về /admin/products) */
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem("token"));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    setAuthReady(false);
    api
      .get(`/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setToken("");
          localStorage.removeItem("token");
        }
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (jwt, userInfo) => {
    setToken(jwt);
    setUser(userInfo);
    localStorage.setItem("token", jwt);
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

