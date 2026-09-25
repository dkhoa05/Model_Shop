"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

export default function ProfilePage() {
  const { user, ready, updateProfile } = useAuth();
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwNotice, setPwNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || ""
      });
    }
  }, [user]);

  if (!ready) return <div className="min-h-72 rounded-2xl border border-zinc-800 bg-zinc-900/70" />;

  if (!user) {
    return (
      <EmptyState
        title="Bạn chưa đăng nhập"
        description="Đăng nhập hoặc đăng ký để lưu thông tin mua hàng và checkout nhanh hơn."
        actionLabel="Đăng nhập"
        actionHref="/login"
      />
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      await updateProfile(form);
      setNotice({ type: "ok", text: "Đã lưu hồ sơ." });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Không lưu được hồ sơ." });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPwNotice(null);
    try {
      const res = await apiFetch<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next })
      });
      setPw({ current: "", next: "" });
      setPwNotice({ type: "ok", text: res.message });
    } catch (err) {
      setPwNotice({ type: "error", text: err instanceof Error ? err.message : "Không đổi được mật khẩu." });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Account</p>
        <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Hồ sơ khách hàng</h1>
        <p className="mt-2 text-sm text-zinc-400">Thông tin này sẽ được tự động điền khi checkout.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        {notice && <Notice {...notice} />}
        <div className="grid gap-4">
          <Field label="Họ tên"><input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></Field>
          <Field label="Số điện thoại"><input className="input" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></Field>
          <Field label="Email"><input className="input opacity-60" value={form.email} readOnly /></Field>
          <Field label="Địa chỉ giao hàng mặc định"><textarea className="input min-h-24 py-3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></Field>
          <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu hồ sơ"}</Button>
        </div>
      </form>

      <form onSubmit={handlePassword} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h2 className="font-space-grotesk text-xl font-black uppercase text-white">Đổi mật khẩu</h2>
        {pwNotice && <div className="mt-4"><Notice {...pwNotice} /></div>}
        <div className="mt-4 grid gap-4">
          <Field label="Mật khẩu hiện tại"><input className="input" type="password" value={pw.current} onChange={(e) => setPw((c) => ({ ...c, current: e.target.value }))} required /></Field>
          <Field label="Mật khẩu mới (8+ ký tự, gồm chữ và số)"><input className="input" type="password" minLength={8} value={pw.next} onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))} required /></Field>
          <Button type="submit">Đổi mật khẩu</Button>
        </div>
      </form>
    </div>
  );
}

function Notice({ type, text }: { type: "ok" | "error"; text: string }) {
  const cls = type === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300";
  return <div className={`mb-5 rounded-xl border p-4 text-sm font-bold ${cls}`}>{text}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-zinc-300">{label}{children}</label>;
}
