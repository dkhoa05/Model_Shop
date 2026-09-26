"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { Notice } from "@/components/form";
import { OrderTimeline, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, StatusPill } from "@/components/OrderStatus";
import PaymentPanel from "@/components/PaymentPanel";
import SafeImg from "@/components/SafeImg";
import { apiFetch } from "@/lib/api";
import { getGuestOrderToken } from "@/lib/guestOrders";
import { formatVND } from "@/utils/currency";

interface ApiOrderItem {
  product?: { _id: string; name: string; brand?: string; images?: string[] };
  quantity: number;
  price: number;
}

interface ApiOrder {
  _id: string;
  paymentRef?: string;
  recipientName?: string;
  guestEmail?: string;
  customerNote?: string;
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
    setCancelError("");
    setCancelling(true);
    try {
      await apiFetch(`/orders/${params.id}/cancel`, { method: "POST", body: JSON.stringify({ token: getGuestOrderToken(params.id) }) });
      setConfirming(false);
      await loadOrder();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Không hủy được đơn hàng.");
    } finally {
      setCancelling(false);
    }
  };

  if (!loaded) return <div className="skeleton h-96" role="status" aria-label="Đang tải đơn hàng" />;

  if (!order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Nếu bạn đặt hàng không đăng nhập, hãy mở lại đơn bằng liên kết trong email xác nhận (trên cùng trình duyệt đã đặt hàng), hoặc liên hệ shop kèm mã đơn."
        actionLabel="Về trang sản phẩm"
        actionHref="/products"
      />
    );
  }

  const canCancel = order.status === "pending" && order.paymentStatus !== "paid";
  const needsPayment = order.paymentMethod !== "cod" && order.paymentStatus !== "paid" && order.status !== "cancelled";

  return (
    <div className="space-y-8">
      <nav aria-label="Đường dẫn" className="text-sm text-zinc-400">
        <ol className="flex gap-2">
          <li>
            <Link href="/orders" className="hover:text-fg">Đơn hàng</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-fg">{order.paymentRef || order._id}</li>
        </ol>
      </nav>

      <section className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 sm:p-8" aria-labelledby="order-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-text">Đơn hàng</p>
            <h1 id="order-title" className="mt-1 text-3xl font-extrabold tracking-tight text-fg">
              {order.paymentRef || order._id}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">Đặt lúc {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={order.status} />
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-semibold text-zinc-200">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${order.paymentStatus === "paid" ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-200"}`}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <OrderTimeline status={order.status} />
        </div>

        {canCancel && (
          <div className="mt-8 border-t border-zinc-800 pt-6">
            {confirming ? (
              <div role="alertdialog" aria-label="Xác nhận hủy đơn" className="flex flex-wrap items-center gap-3">
                <p className="text-[15px] font-semibold text-fg">Bạn chắc chắn muốn hủy đơn hàng này?</p>
                <Button variant="secondary" onClick={handleCancel} loading={cancelling}>
                  Có, hủy đơn
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Không, giữ đơn
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setConfirming(true)}>
                Hủy đơn hàng
              </Button>
            )}
            {cancelError && (
              <div className="mt-3">
                <Notice type="error">{cancelError}</Notice>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="grid content-start gap-6">
          {needsPayment && (
            <PaymentPanel orderId={order._id} paymentMethod={order.paymentMethod} paymentRef={order.paymentRef} total={order.totalPrice} proofUrl={order.paymentProofUrl} guestToken={getGuestOrderToken(order._id)} onSubmitted={loadOrder} />
          )}

          <section aria-labelledby="items-title">
            <h2 id="items-title" className="mb-4 text-xl font-extrabold text-fg">
              Sản phẩm
            </h2>
            <ul className="grid gap-3">
              {order.items.map((item, index) => (
                <li key={`${item.product?._id || index}`} className="flex gap-4 rounded-[20px] border border-zinc-800 bg-zinc-900 p-4">
                  <SafeImg src={item.product?.images?.[0]} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-400">{item.product?.brand || "ModelShop"}</p>
                    <p className="mt-0.5 text-base font-bold leading-snug text-fg">{item.product?.name || "Sản phẩm"}</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {formatVND(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-fg">{formatVND(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit rounded-[24px] border border-zinc-800 bg-zinc-900 p-6" aria-labelledby="ship-title">
          <h2 id="ship-title" className="text-xl font-extrabold text-fg">
            Thông tin nhận hàng
          </h2>
          <dl className="mt-4 grid gap-3 text-[15px]">
            {[
              ["Người nhận", order.recipientName || "Khách hàng"],
              ["Số điện thoại", order.phone],
              ...(order.guestEmail ? [["Email", order.guestEmail]] : []),
              ["Địa chỉ", order.address],
              ...(order.customerNote ? [["Ghi chú", order.customerNote]] : []),
              ...(order.couponCode ? [["Mã giảm giá", order.couponCode]] : [])
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-sm text-zinc-400">{term}</dt>
                <dd className="font-semibold text-fg">{value}</dd>
              </div>
            ))}
          </dl>

          <dl className="mt-6 grid gap-3 border-t border-zinc-800 pt-5 text-[15px]">
            <div className="flex justify-between text-zinc-300">
              <dt>Tạm tính</dt>
              <dd className="font-semibold text-fg">{formatVND(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-zinc-300">
              <dt>Vận chuyển</dt>
              <dd className="font-semibold text-fg">{order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-zinc-300">
                <dt>Giảm giá</dt>
                <dd className="font-semibold text-emerald-400">- {formatVND(order.discountAmount)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-zinc-800 pt-4">
              <dt className="font-bold text-fg">Tổng cộng</dt>
              <dd className="text-2xl font-extrabold text-fg">{formatVND(order.totalPrice)}</dd>
            </div>
          </dl>
          <Button href="/products" variant="outline" className="mt-6 w-full">
            Tiếp tục mua sắm
          </Button>
        </aside>
      </div>
    </div>
  );
}
