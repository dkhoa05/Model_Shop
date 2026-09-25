"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(identifier, password);
      router.push(user.role === "admin" ? "/admin" : "/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Account</p>
        <h1 className="mt-3 font-space-grotesk text-3xl font-black uppercase text-white">Đăng nhập</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Đăng nhập để lưu thông tin giao hàng, xem lịch sử đơn, dùng mã giảm giá và truy cập dashboard nếu là admin.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Email hoặc username
            <input className="input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Mật khẩu
            <input className="input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Chưa có tài khoản? <Link href="/register" className="font-bold text-red-400 hover:text-red-300">Đăng ký ngay</Link>
        </p>
        <p className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs leading-5 text-cyan-100">
          Admin mặc định: admin / admin
        </p>
      </section>
    </div>
  );
}
