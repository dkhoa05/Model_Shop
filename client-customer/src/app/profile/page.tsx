"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile(form);
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Account</p>
        <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Hồ sơ khách hàng</h1>
        <p className="mt-2 text-sm text-zinc-400">Thông tin này sẽ được tự động điền khi checkout.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        {saved && <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">Đã lưu hồ sơ.</div>}
        <div className="grid gap-4">
          <Field label="Họ tên"><input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Số điện thoại"><input className="input" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
          <Field label="Địa chỉ"><textarea className="input min-h-24 py-3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></Field>
          <Button type="submit">Lưu hồ sơ</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-zinc-300">{label}{children}</label>;
}
