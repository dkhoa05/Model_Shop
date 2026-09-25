"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", address: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      router.push("/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center">
      <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Customer profile</p>
        <h1 className="mt-3 font-space-grotesk text-3xl font-black uppercase text-white">Đăng ký khách hàng</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Tạo hồ sơ để checkout nhanh, lưu địa chỉ và nhận ưu đãi thành viên.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên"><input className="input" value={form.name} onChange={(event) => update("name", event.target.value)} required /></Field>
            <Field label="Số điện thoại"><input className="input" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username"><input className="input" value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="nguyenvana" /></Field>
            <Field label="Email"><input className="input" value={form.email} onChange={(event) => update("email", event.target.value)} type="email" required /></Field>
          </div>
          <Field label="Địa chỉ mặc định"><textarea className="input min-h-24 py-3" value={form.address} onChange={(event) => update("address", event.target.value)} required /></Field>
          <Field label="Mật khẩu"><input className="input" value={form.password} onChange={(event) => update("password", event.target.value)} type="password" minLength={8} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,72}" title="8-72 ký tự, gồm chữ và số" required /></Field>
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo tài khoản"}</Button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Đã có tài khoản? <Link href="/login" className="font-bold text-red-400 hover:text-red-300">Đăng nhập</Link>
        </p>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-zinc-300">{label}{children}</label>;
}
