"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import Button from "@/components/Button";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password })
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đặt lại được mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <p className="text-sm text-zinc-300">Liên kết không hợp lệ. <Link href="/forgot-password" className="font-bold text-red-400">Yêu cầu liên kết mới</Link></p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-zinc-300">
        Mật khẩu mới (8+ ký tự, gồm chữ và số)
        <input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-zinc-300">
        Nhập lại mật khẩu
        <input className="input" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </label>
      {message && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-200">
          {message} <Link href="/login" className="underline">Đăng nhập</Link>
        </p>
      )}
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || Boolean(message)}>{loading ? "Đang lưu..." : "Đặt lại mật khẩu"}</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h1 className="font-space-grotesk text-3xl font-black uppercase text-white">Đặt lại mật khẩu</h1>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </div>
  );
}
