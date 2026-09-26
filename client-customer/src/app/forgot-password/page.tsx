"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/Button";
import { Field, Notice } from "@/components/form";
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
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={
        <Link href="/login" className="link">
          Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        {message && <Notice type="success">{message}</Notice>}
        {error && <Notice type="error">{error}</Notice>}
        <Field label="Email" required>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
        </Button>
      </form>
    </AuthShell>
  );
}
