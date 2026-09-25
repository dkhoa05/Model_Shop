"use client";

import AdminShell from "@/components/AdminShell";
import MetricCard from "@/components/MetricCard";
import { purchaseOrders } from "@/lib/erp";
import { formatVND } from "@/utils/currency";
import { PackagePlus, Truck } from "lucide-react";

export default function AdminPurchasePage() {
  const total = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
  return (
    <AdminShell>
      <div className="space-y-6">
        <Header title="Purchase" desc="Quản lý nhà cung cấp, đơn nhập hàng, ETA và lịch về kho." />
        <section className="grid gap-4 md:grid-cols-2">
          <MetricCard label="PO value" value={formatVND(total)} icon={PackagePlus} tone="text-red-300" />
          <MetricCard label="Incoming shipments" value={String(purchaseOrders.length)} icon={Truck} tone="text-cyan-300" />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          {purchaseOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <div className="flex items-center justify-between gap-3"><p className="font-black text-red-400">{order.id}</p><span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-300">{order.status}</span></div>
              <h2 className="mt-3 font-space-grotesk text-xl font-black text-white">{order.vendor}</h2>
              <p className="mt-2 text-sm text-zinc-400">ETA: {order.eta}</p>
              <ul className="mt-4 grid gap-2 text-sm text-zinc-300">{order.items.map((item) => <li key={item} className="rounded-xl bg-zinc-950 p-3">{item}</li>)}</ul>
              <p className="mt-5 text-2xl font-black text-white">{formatVND(order.total)}</p>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Admin</p><h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">{title}</h1><p className="mt-2 text-sm text-zinc-400">{desc}</p></div>;
}
