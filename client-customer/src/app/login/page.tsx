"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/Button";
import { Field, Notice } from "@/components/form";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(identifier, password);
      if (user.role !== "customer") {
        window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5174";
        return;
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      description="Đăng nhập để theo dõi đơn hàng, lưu địa chỉ và dùng mã giảm giá."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="link">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        {error && <Notice type="error">{error}</Notice>}
        <Field label="Email hoặc tên đăng nhập" required>
          <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
        </Field>
        <Field label="Mật khẩu" required>
          <input className="input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--accent))]" />
            Hiện mật khẩu
          </label>
          <Link href="/forgot-password" className="link inline-flex min-h-11 items-center text-sm">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </AuthShell>
  );
}
