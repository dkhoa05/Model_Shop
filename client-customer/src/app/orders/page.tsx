"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { StatusPill } from "@/components/OrderStatus";
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

export default function OrdersPage() {
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setOrders([]);
      setLoaded(true);
      return;
    }
    apiFetch<ApiOrder[]>("/orders/my")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoaded(true));
  }, [user, ready]);

  if (!ready || (user && !loaded)) {
    return (
      <div className="space-y-4" role="status" aria-label="Đang tải đơn hàng">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    );
  }

  if (!user) {
    return <EmptyState title="Đăng nhập để xem đơn hàng" description="Lịch sử đơn hàng được lưu theo tài khoản của bạn. Đơn đặt không cần tài khoản có thể mở lại bằng liên kết trong email xác nhận." actionLabel="Đăng nhập" actionHref="/login" />;
  }

  if (orders.length === 0) {
    return <EmptyState title="Chưa có đơn hàng" description="Khi đặt hàng thành công, đơn sẽ xuất hiện tại đây để bạn theo dõi trạng thái." actionLabel="Tiếp tục mua sắm" actionHref="/products" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Đơn hàng của tôi</h1>
        <p className="mt-2 text-base text-zinc-400">Theo dõi trạng thái xử lý, thanh toán và giao hàng.</p>
      </div>

      <ul className="grid gap-3">
        {orders.map((order) => (
          <li key={order._id}>
            <Link href={`/orders/${order._id}`} className="group flex flex-col gap-4 rounded-[20px] border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-accent-text">{order.paymentRef || order._id}</p>
                <p className="mt-1 text-lg font-bold text-fg">
                  {order.items.length} sản phẩm, người nhận {order.recipientName || user.name}
                </p>
                <p className="mt-1 text-sm text-zinc-400">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                <StatusPill status={order.status} />
                <p className="text-xl font-extrabold text-fg">{formatVND(order.totalPrice)}</p>
              </div>
              <ChevronRight size={20} className="hidden text-zinc-500 transition group-hover:translate-x-1 group-hover:text-accent-text sm:block" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
