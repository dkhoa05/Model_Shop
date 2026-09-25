"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getOrders, orderStatusLabels, OrderRecord, OrderStatus, updateOrderStatus } from "@/lib/orders";
import { formatVND } from "@/utils/currency";

const statuses: OrderStatus[] = ["pending", "confirmed", "packing", "shipping", "completed", "cancelled"];

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  if (!user || user.role !== "admin") {
    return <EmptyState title="Không có quyền truy cập" description="Bạn cần đăng nhập tài khoản admin để quản lý đơn hàng." actionLabel="Đăng nhập admin" actionHref="/login" />;
  }

  return (
    <AdminShell>
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Admin</p>
        <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Quản lý đơn hàng</h1>
        <p className="mt-2 text-sm text-zinc-400">Đổi trạng thái đơn, xem thông tin khách hàng và giá trị đơn.</p>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="border-b border-zinc-800 pb-3">Mã đơn</th>
              <th className="border-b border-zinc-800 pb-3">Khách hàng</th>
              <th className="border-b border-zinc-800 pb-3">Sản phẩm</th>
              <th className="border-b border-zinc-800 pb-3">Tổng</th>
              <th className="border-b border-zinc-800 pb-3">Trạng thái</th>
              <th className="border-b border-zinc-800 pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-zinc-800/70">
                <td className="py-4 font-black text-white">{order.id}</td>
                <td className="py-4 text-zinc-300">
                  <p>{order.customer.name}</p>
                  <p className="text-xs text-zinc-500">{order.customer.phone}</p>
                </td>
                <td className="py-4 text-zinc-400">{order.items.length} món</td>
                <td className="py-4 font-black text-red-300">{formatVND(order.total)}</td>
                <td className="py-4">
                  <select
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                    value={order.status}
                    onChange={(event) => setOrders(updateOrderStatus(order.id, event.target.value as OrderStatus))}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{orderStatusLabels[status]}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 text-right">
                  <Link href={`/orders/${order.id}`} className="text-sm font-black text-red-400 hover:text-red-300">Xem</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
    </AdminShell>
  );
}
