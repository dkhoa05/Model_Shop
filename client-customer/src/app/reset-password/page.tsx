"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/Button";
import { Field, Notice } from "@/components/form";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMismatch("");
    if (password !== confirm) {
      setMismatch("Mật khẩu nhập lại không khớp.");
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
    return (
      <Notice type="error">
        Liên kết không hợp lệ.{" "}
        <Link href="/forgot-password" className="link">
          Yêu cầu liên kết mới
        </Link>
      </Notice>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {message && (
        <Notice type="success">
          {message}{" "}
          <Link href="/login" className="link">
            Đăng nhập
          </Link>
        </Notice>
      )}
      {error && <Notice type="error">{error}</Notice>}
      <Field label="Mật khẩu mới" required hint="8 đến 72 ký tự, gồm cả chữ và số">
        <input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
      </Field>
      <Field label="Nhập lại mật khẩu" required error={mismatch}>
        <input className="input" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
      </Field>
      <Button type="submit" loading={loading} disabled={Boolean(message)} className="w-full">
        {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Đặt lại mật khẩu" description="Chọn mật khẩu mới cho tài khoản của bạn.">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
