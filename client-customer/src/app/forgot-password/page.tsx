"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h1 className="font-space-grotesk text-3xl font-black uppercase text-white">Quên mật khẩu</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-200">{message}</p>}
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Đang gửi..." : "Gửi liên kết"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-400">
          <Link href="/login" className="font-bold text-red-400 hover:text-red-300">Quay lại đăng nhập</Link>
        </p>
      </section>
    </div>
  );
}
