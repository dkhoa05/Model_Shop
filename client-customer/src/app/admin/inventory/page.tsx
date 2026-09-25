"use client";

import AdminShell from "@/components/AdminShell";
import MetricCard from "@/components/MetricCard";
import { inventoryRows, stockMoves } from "@/lib/erp";
import { formatVND } from "@/utils/currency";
import { Boxes, CircleAlert, Warehouse } from "lucide-react";

export default function AdminInventoryPage() {
  const rows = inventoryRows();
  const lowStock = rows.filter((item) => item.stock <= item.reorderPoint);
  const value = rows.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <Header title="Inventory" desc="Theo dõi tồn kho, điểm đặt hàng lại, hàng giữ chỗ và lịch sử xuất nhập." />
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Giá trị tồn kho" value={formatVND(value)} icon={Warehouse} tone="text-cyan-300" />
          <MetricCard label="SKU" value={String(rows.length)} icon={Boxes} tone="text-red-300" />
          <MetricCard label="Cần nhập lại" value={String(lowStock.length)} icon={CircleAlert} tone="text-amber-300" />
        </section>
        <section className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr><th className="pb-3">SKU</th><th className="pb-3">Sản phẩm</th><th className="pb-3">Brand</th><th className="pb-3">Stock</th><th className="pb-3">Reserved</th><th className="pb-3">Reorder</th><th className="pb-3 text-right">Value</th></tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-zinc-800">
                  <td className="py-4 font-bold text-zinc-300">{item.sku}</td>
                  <td className="py-4 font-black text-white">{item.name}</td>
                  <td className="py-4 text-zinc-400">{item.brand}</td>
                  <td className="py-4 text-zinc-300">{item.stock}</td>
                  <td className="py-4 text-zinc-300">{item.reserved}</td>
                  <td className="py-4 text-zinc-300">{item.reorderPoint}</td>
                  <td className="py-4 text-right font-black text-red-300">{formatVND(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <h2 className="font-space-grotesk text-2xl font-black uppercase text-white">Stock moves</h2>
          <div className="mt-4 grid gap-3">
            {stockMoves.map((move) => (
              <div key={move.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-950 p-4 text-sm">
                <span className="font-black text-white">{move.reference}</span>
                <span className="text-zinc-400">{move.product}</span>
                <span className={move.type === "in" ? "text-emerald-300" : "text-red-300"}>{move.type.toUpperCase()} {move.quantity}</span>
                <span className="text-zinc-500">{move.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Admin</p><h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">{title}</h1><p className="mt-2 text-sm text-zinc-400">{desc}</p></div>;
}
