import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { identifier, password });
      if (response.data.user?.role !== "admin") {
        setError("Tài khoản này không có quyền admin.");
        return;
      }
      login(response.data.token, response.data.user);
      navigate("/admin", { replace: true });
    } catch {
      setError("Email/tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(220,38,38,0.2),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.14),transparent_32%)]" />
      <section className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">ModelShop Admin</p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-tight">
            Điều hành shop mô hình từ một dashboard.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Quản lý sản phẩm, đơn hàng, khách hàng, tồn kho, CRM và báo cáo doanh thu bằng dữ liệu thật từ MongoDB API.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Sales", "Inventory", "CRM"].map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-sm font-black text-cyan-200">{item}</p>
                <p className="mt-2 text-xs text-zinc-500">Realtime API</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-red-950/20 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-xl font-black text-red-300">M</div>
            <h2 className="text-2xl font-black uppercase">Đăng nhập admin</h2>
            <p className="mt-2 text-sm text-zinc-500">Dùng tài khoản admin để vào dashboard vận hành.</p>
          </div>

          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Tài khoản hoặc email
            <input className="admin-input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="admin@example.com" required />
          </label>

          <label className="mt-4 grid gap-2 text-sm font-bold text-zinc-300">
            Mật khẩu
            <div className="relative">
              <input className="admin-input pr-20" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-cyan-300">
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </label>

          {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}

          <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-red-600 text-sm font-black uppercase text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-70">
            {loading ? "Đang đăng nhập..." : "Vào dashboard"}
          </button>

          <p className="mt-5 text-center text-xs text-zinc-500">API: {import.meta.env.VITE_API_BASE || "http://localhost:5000/api"}</p>
        </form>
      </section>
    </main>
  );
}
