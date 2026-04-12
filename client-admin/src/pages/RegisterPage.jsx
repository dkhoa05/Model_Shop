import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post(`/auth/register`, { name, username, email, password });
      setSuccess("Đăng ký thành công! Đang chuyển tới trang đăng nhập...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError("Email hoặc tên đăng nhập đã tồn tại, hoặc dữ liệu không hợp lệ.");
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Cột trái */}
        <div
          className={
            "hidden md:flex flex-col justify-center rounded-2xl p-8 lg:p-12 min-h-[320px] " +
            (theme === "dark"
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
              : "bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200")
          }
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Tạo tài khoản
          </h1>
          <p className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
            Đăng ký để mua sắm mô hình, theo dõi đơn hàng và nhận ưu đãi.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• Xem và đặt hàng sản phẩm</li>
            <li>• Theo dõi đơn hàng</li>
            <li>• Lưu thông tin giao hàng</li>
          </ul>
        </div>

        {/* Cột phải: form */}
        <div className="max-w-sm mx-auto md:mx-0 w-full space-y-4">
          <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-slate-100">
            Đăng ký
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              placeholder="Họ tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
            <input
              placeholder="Tên đăng nhập (không dấu)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-rose-600 dark:text-cyan-300">{success}</p>}
            <button
              type="submit"
              className={
                "w-full px-4 py-2 rounded-xl text-sm font-semibold transition " +
                (theme === "dark"
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "bg-rose-500 text-white hover:bg-rose-600")
              }
            >
              Đăng ký
            </button>
          </form>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className={theme === "dark" ? "text-cyan-300 hover:text-cyan-200" : "text-rose-600 hover:text-rose-700"}
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
