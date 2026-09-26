"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { Field, Notice } from "@/components/form";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

type Msg = { type: "success" | "error"; text: string } | null;

export default function ProfilePage() {
  const { user, ready, updateProfile } = useAuth();
  const [notice, setNotice] = useState<Msg>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwNotice, setPwNotice] = useState<Msg>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", email: user.email || "", address: user.address || "" });
    }
  }, [user]);

  if (!ready) return <div className="skeleton h-72" role="status" aria-label="Đang tải" />;

  if (!user) {
    return <EmptyState title="Bạn chưa đăng nhập" description="Đăng nhập hoặc đăng ký để lưu thông tin mua hàng và đặt hàng nhanh hơn." actionLabel="Đăng nhập" actionHref="/login" />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      await updateProfile(form);
      setNotice({ type: "success", text: "Đã lưu hồ sơ." });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Không lưu được hồ sơ." });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPwNotice(null);
    setPwBusy(true);
    try {
      const res = await apiFetch<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next })
      });
      setPw({ current: "", next: "" });
      setPwNotice({ type: "success", text: res.message });
    } catch (err) {
      setPwNotice({ type: "error", text: err instanceof Error ? err.message : "Không đổi được mật khẩu." });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Hồ sơ của tôi</h1>
        <p className="mt-2 text-base text-zinc-400">Thông tin này được điền sẵn khi bạn thanh toán.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
        <h2 className="text-xl font-extrabold text-fg">Thông tin cá nhân</h2>
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Họ tên" required>
            <input className="input" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} autoComplete="name" required />
          </Field>
          <Field label="Số điện thoại">
            <input className="input" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} autoComplete="tel" />
          </Field>
        </div>
        <Field label="Email" hint="Email đăng nhập, không thể thay đổi tại đây">
          <input className="input opacity-70" value={form.email} readOnly />
        </Field>
        <Field label="Địa chỉ giao hàng mặc định">
          <textarea className="input min-h-24" value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} autoComplete="street-address" />
        </Field>
        <Button type="submit" loading={saving} className="w-fit">
          Lưu hồ sơ
        </Button>
      </form>

      <form onSubmit={handlePassword} className="grid gap-5 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
        <h2 className="text-xl font-extrabold text-fg">Đổi mật khẩu</h2>
        {pwNotice && <Notice type={pwNotice.type}>{pwNotice.text}</Notice>}
        <Field label="Mật khẩu hiện tại" required>
          <input className="input" type="password" value={pw.current} onChange={(e) => setPw((c) => ({ ...c, current: e.target.value }))} autoComplete="current-password" required />
        </Field>
        <Field label="Mật khẩu mới" required hint="8 đến 72 ký tự, gồm cả chữ và số">
          <input className="input" type="password" minLength={8} value={pw.next} onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))} autoComplete="new-password" required />
        </Field>
        <Button type="submit" loading={pwBusy} className="w-fit">
          Đổi mật khẩu
        </Button>
      </form>
    </div>
  );
}
