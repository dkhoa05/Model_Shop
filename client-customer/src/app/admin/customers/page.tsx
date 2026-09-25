"use client";

import { Crown, TrendingUp, Users } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import MetricCard from "@/components/MetricCard";
import { customers } from "@/lib/erp";
import { formatVND } from "@/utils/currency";

const tierStyles = {
  new: "bg-zinc-800 text-zinc-300",
  silver: "bg-cyan-500/15 text-cyan-200",
  gold: "bg-amber-500/15 text-amber-200",
  vip: "bg-red-500/15 text-red-200"
};

export default function CustomersPage() {
  const lifetimeValue = customers.reduce((sum, customer) => sum + customer.lifetimeValue, 0);
  const vipCount = customers.filter((customer) => customer.tier === "vip").length;

  return (
    <AdminShell>
      <section className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Customers</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-white">Hồ sơ khách hàng</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Quản lý thông tin khách, hạng thành viên, giá trị vòng đời và lịch sử đơn để phục vụ remarketing và chăm sóc sau bán.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Khách hàng" value={String(customers.length)} icon={Users} tone="text-cyan-300" />
          <MetricCard label="VIP collectors" value={String(vipCount)} icon={Crown} tone="text-red-300" />
          <MetricCard label="Lifetime value" value={formatVND(lifetimeValue)} icon={TrendingUp} tone="text-cyan-300" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {customers.map((customer) => (
            <article key={customer.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">{customer.name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{customer.email}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${tierStyles[customer.tier]}`}>
                  {customer.tier}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Điện thoại</dt>
                  <dd className="font-bold text-zinc-200">{customer.phone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Đơn gần nhất</dt>
                  <dd className="font-bold text-zinc-200">{customer.lastOrder}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Tổng chi tiêu</dt>
                  <dd className="font-black text-red-300">{formatVND(customer.lifetimeValue)}</dd>
                </div>
              </dl>
              <button className="mt-5 w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black uppercase text-white transition hover:border-red-500 hover:bg-red-500/10">
                Xem hồ sơ
              </button>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
