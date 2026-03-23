import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";

function EyeIcon({ show }) {
  if (show)
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4 4l3 3m14 0l3 3" />
    </svg>
  );
}

function safeRedirectPath(raw) {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const afterLogin = useMemo(() => safeRedirectPath(searchParams.get("redirect")), [searchParams]);
  const { user, login } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (user) navigate(afterLogin, { replace: true });
  }, [user, navigate, afterLogin]);

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post(`/auth/login`, { identifier, password });
      login(res.data.token, res.data.user);
      navigate(afterLogin, { replace: true });
    } catch (err) {
      setError("Tên đăng nhập/email hoặc mật khẩu không đúng.");
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Cột trái: nội dung trang trí */}
        <div
          className={
            "hidden md:flex flex-col justify-center rounded-2xl p-8 lg:p-12 min-h-[320px] " +
            (theme === "dark"
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
              : "bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200")
          }
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Model Shop
          </h1>
          <p className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
            Mô hình & Figure chính hãng. Xem sản phẩm không cần đăng nhập — đăng nhập để đặt hàng và theo dõi đơn.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:bg-cyan-500/20 dark:text-cyan-300">
              Gundam
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:bg-cyan-500/20 dark:text-cyan-300">
              Figure
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:bg-cyan-500/20 dark:text-cyan-300">
              Lego
            </span>
          </div>
        </div>

        {/* Cột phải: form */}
        <div className="max-w-sm mx-auto md:mx-0 w-full space-y-4">
          <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-slate-100">
            Đăng nhập
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Tên đăng nhập hoặc Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputClass}
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass + " pr-10"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className={
                  "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded " +
                  (theme === "dark" ? "text-slate-400 hover:text-cyan-400" : "text-slate-500 hover:text-rose-500")
                }
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <EyeIcon show={!showPassword} />
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 flex-wrap">
                {error}
                <Link
                  to="/forgot-password"
                  className={theme === "dark" ? "text-cyan-400 hover:underline" : "text-rose-600 hover:underline"}
                >
                  Quên mật khẩu?
                </Link>
              </p>
            )}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className={
                  "text-xs " +
                  (theme === "dark" ? "text-cyan-400 hover:text-cyan-300" : "text-rose-600 hover:text-rose-700")
                }
              >
                Quên mật khẩu?
              </Link>
            </div>
            <button
              type="submit"
              className={
                "w-full px-4 py-2 rounded-xl text-sm font-semibold transition " +
                (theme === "dark"
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "bg-rose-500 text-white hover:bg-rose-600")
              }
            >
              Đăng nhập
            </button>
          </form>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Chưa có tài khoản?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(afterLogin)}`}
              className={theme === "dark" ? "text-cyan-300 hover:text-cyan-200" : "text-rose-600 hover:text-rose-700"}
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
