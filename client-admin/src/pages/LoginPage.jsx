import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BACKOFFICE_ROLES } from "../lib/roles.js";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (BACKOFFICE_ROLES.includes(user?.role)) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { identifier, password });
      if (!BACKOFFICE_ROLES.includes(response.data.user?.role)) {
        setError("Tài khoản này không có quyền vào trang quản trị.");
        return;
      }
      login(response.data.user);
      navigate("/admin", { replace: true });
    } catch {
      setError("Email/tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-fg">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold tracking-tight">
            Model<span className="text-accent-text">Shop</span> <span className="font-semibold text-zinc-400">Quản trị</span>
          </p>
        </div>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:block">
            <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight">Điều hành cửa hàng từ một nơi</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-400">Sản phẩm, đơn hàng, kho, mua hàng, kế toán và báo cáo, theo đúng quyền của từng vai trò.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-6 sm:p-8" aria-labelledby="login-title">
            <h2 id="login-title" className="text-2xl font-extrabold tracking-tight">
              Đăng nhập
            </h2>
            <p className="mt-2 text-sm text-zinc-400">Dùng tài khoản nội bộ (admin, nhân viên hoặc kế toán).</p>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-red-500/60 bg-red-500/10 p-3 text-sm font-medium text-fg">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-2">
              <label htmlFor="identifier" className="text-sm font-semibold text-zinc-200">
                Email hoặc tên đăng nhập
              </label>
              <input id="identifier" className="admin-input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
            </div>

            <div className="mt-4 grid gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-zinc-200">
                Mật khẩu
              </label>
              <input id="password" className="admin-input" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </div>

            <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="h-5 w-5" style={{ accentColor: "rgb(var(--accent))" }} />
              Hiện mật khẩu
            </label>

            <button disabled={loading} className="admin-button-primary mt-4 w-full">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
