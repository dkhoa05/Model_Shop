"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Bot, PackageX, ShoppingBag, Users, Wallet } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import Button from "@/components/Button";
import MetricCard from "@/components/MetricCard";
import { useAuth } from "@/context/AuthContext";
import { products } from "@/data/products";
import { erpSummary } from "@/lib/erp";
import { getOrders, orderStatusLabels, OrderRecord } from "@/lib/orders";
import { formatVND } from "@/utils/currency";

export default function AdminPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const revenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
  const customers = useMemo(() => new Set(orders.map((order) => order.customer.email)).size, [orders]);
  const summary = erpSummary();

  if (!user || user.role !== "admin") {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <section className="max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
          <h1 className="font-space-grotesk text-3xl font-black uppercase text-white">Admin dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Bạn cần đăng nhập tài khoản admin để xem tổng quan vận hành.</p>
          <Button href="/login" className="mt-6">Đăng nhập admin</Button>
        </section>
      </div>
    );
  }

  const kpis = [
    { label: "Doanh thu", value: formatVND(revenue), icon: Wallet, tone: "text-emerald-300" },
    { label: "Đơn hàng", value: String(orders.length), icon: ShoppingBag, tone: "text-red-300" },
    { label: "Khách hàng", value: String(customers), icon: Users, tone: "text-cyan-300" },
    { label: "Tồn kho", value: formatVND(summary.inventoryValue), icon: PackageX, tone: "text-amber-300" }
  ];

  return (
    <AdminShell>
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Operations center</p>
          <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Admin dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">Tổng quan eCommerce, tồn kho, khách hàng, AI insight và đơn hàng.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/admin/orders" variant="outline">Quản lý đơn</Button>
          <Button href="/admin/products" variant="secondary">Quản lý sản phẩm</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="inline-flex items-center gap-2 font-space-grotesk text-2xl font-black uppercase text-white"><BarChart3 size={22} /> Đơn hàng mới</h2>
            <Link href="/admin/orders" className="text-sm font-black uppercase text-red-400 hover:text-red-300">Xem tất cả</Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="border-b border-zinc-800 pb-3">Mã đơn</th>
                  <th className="border-b border-zinc-800 pb-3">Khách hàng</th>
                  <th className="border-b border-zinc-800 pb-3">Sản phẩm</th>
                  <th className="border-b border-zinc-800 pb-3">Trạng thái</th>
                  <th className="border-b border-zinc-800 pb-3 text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-zinc-800/70">
                    <td className="py-4 font-black text-white">{order.id}</td>
                    <td className="py-4 text-zinc-300">{order.customer.name}</td>
                    <td className="py-4 text-zinc-400">{order.items[0]?.name}</td>
                    <td className="py-4"><span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-200">{orderStatusLabels[order.status]}</span></td>
                    <td className="py-4 text-right font-black text-red-300">{formatVND(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <h2 className="inline-flex items-center gap-2 font-space-grotesk text-2xl font-black uppercase text-white"><Bot size={22} /> AI vận hành</h2>
          <div className="mt-5 grid gap-4">
            {[
              "RG Sazabi và Tamiya Cutter đang có tỉ lệ mua kèm tốt. Nên tạo bundle giảm 5%.",
              "MGEX Strike Freedom có nhu cầu pre-order cao, cần cảnh báo nếu slot còn dưới 20.",
              "Sản phẩm tồn kho thấp nên ưu tiên nhập lại trước chiến dịch sale cuối tuần."
            ].map((insight) => (
              <p key={insight} className="rounded-xl border border-cyan-400/20 bg-zinc-950/70 p-4 text-sm leading-6 text-cyan-50">{insight}</p>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
        <h2 className="font-space-grotesk text-2xl font-black uppercase text-white">Tồn kho cần chú ý</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.filter((product) => product.stock <= 8).map((product) => (
            <article key={product.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <img src={product.images[0]} alt={product.name} className="h-28 w-full rounded-xl object-cover" />
              <h3 className="mt-3 line-clamp-2 text-sm font-black text-white">{product.name}</h3>
              <p className="mt-2 text-xs font-bold text-amber-300">Tồn kho: {product.stock}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
    </AdminShell>
  );
}
