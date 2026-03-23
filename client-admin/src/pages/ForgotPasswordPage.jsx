import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const { theme } = useTheme();

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setDone(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div
          className={
            "hidden md:flex flex-col justify-center rounded-2xl p-8 lg:p-12 min-h-[280px] " +
            (theme === "dark"
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
              : "bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200")
          }
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Quên mật khẩu
          </h1>
          <p className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
            Nhập email đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu. (Demo: link hiển thị ngay bên dưới.)
          </p>
        </div>

        <div className="max-w-sm mx-auto md:mx-0 w-full space-y-4">
          <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-slate-100">
            Nhập email
          </h2>
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className={
                  "w-full px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 " +
                  (theme === "dark"
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    : "bg-rose-500 text-white hover:bg-rose-600")
                }
              >
                {loading ? "Đang xử lý..." : "Gửi link đặt lại mật khẩu"}
              </button>
            </form>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300">{done.message}</p>
              {done.resetLink && (
                <p className="text-xs break-all">
                  <a
                    href={done.resetLink}
                    className={theme === "dark" ? "text-cyan-400 hover:underline" : "text-rose-600 hover:underline"}
                  >
                    {done.resetLink}
                  </a>
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            <Link
              to="/login"
              className={theme === "dark" ? "text-cyan-300 hover:text-cyan-200" : "text-rose-600 hover:text-rose-700"}
            >
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
