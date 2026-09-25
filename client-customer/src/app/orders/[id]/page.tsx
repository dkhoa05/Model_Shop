"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { apiFetch } from "@/lib/api";
import { getGuestOrderToken } from "@/lib/guestOrders";
import PaymentPanel from "@/components/PaymentPanel";
import { formatVND } from "@/utils/currency";

interface ApiOrderItem {
  product?: {
    _id: string;
    name: string;
    brand?: string;
    images?: string[];
  };
  quantity: number;
  price: number;
}

interface ApiOrder {
  _id: string;
  paymentRef?: string;
  recipientName?: string;
  guestEmail?: string;
  address: string;
  phone: string;
  items: ApiOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProofUrl?: string;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy"
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(() => {
    const guestToken = getGuestOrderToken(params.id);
    const request = guestToken
      ? apiFetch<ApiOrder>(`/orders/guest/${params.id}?token=${encodeURIComponent(guestToken)}`)
      : apiFetch<ApiOrder[]>("/orders/my").then((orders) => orders.find((item) => item._id === params.id) || null);

    return request
      .then((result) => setOrder(result))
      .catch(() => setOrder(null))
      .finally(() => setLoaded(true));
  }, [params.id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleCancel = async () => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    setCancelError("");
    setCancelling(true);
    try {
      await apiFetch(`/orders/${params.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ token: getGuestOrderToken(params.id) })
      });
      await loadOrder();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Không hủy được đơn hàng.");
    } finally {
      setCancelling(false);
    }
  };

  if (loaded && !order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Nếu bạn đặt hàng không đăng nhập, hãy mở lại đơn trên cùng trình duyệt đã đặt hàng, hoặc liên hệ shop kèm mã đơn."
        actionLabel="Về trang sản phẩm"
        actionHref="/products"
      />
    );
  }

  if (!order) {
    return <div className="min-h-72 rounded-2xl border border-zinc-800 bg-zinc-900/70" />;
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm font-bold text-zinc-500" aria-label="Breadcrumb">
        Home / Orders / <span className="text-zinc-300">{order.paymentRef || order._id}</span>
      </nav>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Order placed</p>
            <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">{order.paymentRef || order._id}</h1>
            <p className="mt-2 text-sm text-zinc-400">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-200">{statusLabels[order.status] || order.status}</span>
            <span className="rounded-full bg-zinc-950 px-3 py-1 text-sm font-bold text-zinc-300">{order.paymentMethod.toUpperCase()}</span>
            <span className="rounded-full bg-zinc-950 px-3 py-1 text-sm font-bold text-zinc-300">{order.paymentStatus}</span>
          </div>
          {order.status === "pending" && order.paymentStatus !== "paid" && (
            <div className="w-full">
              <button onClick={handleCancel} disabled={cancelling} className="rounded-xl border border-red-500/40 px-4 py-2 text-xs font-black uppercase text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
              </button>
              {cancelError && <p className="mt-2 text-sm font-bold text-red-300">{cancelError}</p>}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          {order.paymentMethod !== "cod" && order.paymentStatus !== "paid" && order.status !== "cancelled" && (
            <PaymentPanel
              orderId={order._id}
              paymentMethod={order.paymentMethod}
              paymentRef={order.paymentRef}
              total={order.totalPrice}
              proofUrl={order.paymentProofUrl}
              guestToken={getGuestOrderToken(order._id)}
              onSubmitted={loadOrder}
            />
          )}
          {order.items.map((item, index) => (
            <article key={`${item.product?._id || index}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex gap-4">
                <Link href="/products" className="h-24 w-24 overflow-hidden rounded-xl bg-zinc-950">
                  <img src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=800"} alt={item.product?.name || "Sản phẩm"} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-300">{item.product?.brand || "ModelShop"}</p>
                  <h2 className="mt-1 font-space-grotesk text-lg font-black text-white">{item.product?.name || "Sản phẩm"}</h2>
                  <p className="mt-2 text-sm text-zinc-400">Số lượng: {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-red-400">{formatVND(item.price * item.quantity)}</p>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <h2 className="font-space-grotesk text-xl font-black uppercase text-white">Thông tin nhận hàng</h2>
          <div className="mt-4 grid gap-2 text-sm text-zinc-400">
            <p><span className="font-bold text-zinc-200">Tên:</span> {order.recipientName || "Khách hàng"}</p>
            <p><span className="font-bold text-zinc-200">SĐT:</span> {order.phone}</p>
            {order.guestEmail && <p><span className="font-bold text-zinc-200">Email:</span> {order.guestEmail}</p>}
            <p><span className="font-bold text-zinc-200">Địa chỉ:</span> {order.address}</p>
            {order.couponCode && <p><span className="font-bold text-zinc-200">Coupon:</span> {order.couponCode}</p>}
          </div>

          <div className="mt-5 grid gap-3 border-t border-zinc-800 pt-5 text-sm">
            <Row label="Subtotal" value={formatVND(order.subtotal)} />
            <Row label="Shipping" value={order.shippingFee === 0 ? "Free" : formatVND(order.shippingFee)} />
            <Row label="Discount" value={formatVND(order.discountAmount)} />
            <Row label="Total" value={formatVND(order.totalPrice)} strong />
          </div>
          <Button href="/products" variant="outline" className="mt-5 w-full">Tiếp tục mua sắm</Button>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-lg font-black text-white" : "text-zinc-400"}`}>
      <span>{label}</span>
      <span className={strong ? "text-red-400" : "font-bold text-zinc-100"}>{value}</span>
    </div>
  );
}
