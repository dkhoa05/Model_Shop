"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/Button";
import { Field, Notice } from "@/components/form";
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
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Tạo hồ sơ để đặt hàng nhanh hơn và theo dõi đơn dễ dàng."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="link">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        {error && <Notice type="error">{error}</Notice>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Họ tên" required>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" required />
          </Field>
          <Field label="Số điện thoại" required>
            <input className="input" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" required />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tên đăng nhập" hint="3 đến 30 ký tự: chữ thường, số, dấu _ . -">
            <input className="input" value={form.username} onChange={(e) => update("username", e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Email" required>
            <input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required />
          </Field>
        </div>
        <Field label="Địa chỉ mặc định" required>
          <textarea className="input min-h-24" value={form.address} onChange={(e) => update("address", e.target.value)} autoComplete="street-address" required />
        </Field>
        <Field label="Mật khẩu" required hint="8 đến 72 ký tự, gồm cả chữ và số">
          <input className="input" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" minLength={8} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,72}" title="8 đến 72 ký tự, gồm chữ và số" required />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Đang tạo..." : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthShell>
  );
}
