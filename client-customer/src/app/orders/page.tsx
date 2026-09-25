"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatVND } from "@/utils/currency";

interface ApiOrder {
  _id: string;
  paymentRef?: string;
  recipientName?: string;
  items: unknown[];
  status: string;
  totalPrice: number;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy"
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoaded(true);
      return;
    }

    apiFetch<ApiOrder[]>("/orders/my")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoaded(true));
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        title="Đăng nhập để xem đơn hàng"
        description="Lịch sử đơn hàng được đồng bộ từ MongoDB theo tài khoản của bạn."
        actionLabel="Đăng nhập"
        actionHref="/login"
      />
    );
  }

  if (loaded && orders.length === 0) {
    return (
      <EmptyState
        title="Chưa có đơn hàng"
        description="Khi đặt hàng thành công, đơn sẽ xuất hiện tại đây để theo dõi trạng thái."
        actionLabel="Tiếp tục mua sắm"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Account</p>
        <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Lịch sử đơn hàng</h1>
        <p className="mt-2 text-sm text-zinc-400">Theo dõi trạng thái xử lý, thanh toán và giao hàng từ API thật.</p>
      </div>

      <section className="grid gap-4">
        {orders.map((order) => (
          <Link key={order._id} href={`/orders/${order._id}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 hover:border-red-500/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-red-400">{order.paymentRef || order._id}</p>
                <h2 className="mt-1 font-space-grotesk text-xl font-black text-white">{order.items.length} sản phẩm · {order.recipientName || user.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="text-left md:text-right">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{statusLabels[order.status] || order.status}</span>
                <p className="mt-3 text-xl font-black text-white">{formatVND(order.totalPrice)}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
