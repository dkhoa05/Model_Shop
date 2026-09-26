"use client";

import { useState } from "react";
import CheckoutForm from "@/components/CheckoutForm";
import EmptyState from "@/components/EmptyState";
import { Notice } from "@/components/form";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";

export default function CheckoutPage() {
  const { cartItems, subtotal, shipping, syncNotices } = useCart();
  const [summary, setSummary] = useState({ deliveryType: "delivery", discount: 0 });
  const shippingFee = summary.deliveryType === "pickup" ? 0 : shipping;
  const total = Math.max(0, subtotal - summary.discount + shippingFee);

  if (cartItems.length === 0) {
    return (
      <EmptyState title="Chưa có sản phẩm để thanh toán" description="Thêm sản phẩm vào giỏ hàng trước khi điền thông tin thanh toán." actionLabel="Xem sản phẩm" actionHref="/products" />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Thanh toán</h1>
      {syncNotices.length > 0 && (
        <Notice type="info">
          {syncNotices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </Notice>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_26rem]">
        <section className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 sm:p-8" aria-label="Thông tin đặt hàng">
          <CheckoutForm onSummaryChange={setSummary} />
        </section>

        <aside className="h-fit rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 lg:sticky lg:top-24" aria-labelledby="order-summary">
          <h2 id="order-summary" className="text-xl font-extrabold text-fg">
            Đơn hàng của bạn
          </h2>
          <ul className="mt-5 grid gap-4">
            {cartItems.map((item) => (
              <li key={item.product.id} className="flex items-center gap-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  <ProductImage src={item.product.images[0]} alt="" sizes="64px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-fg">{item.product.name}</p>
                  <p className="mt-0.5 text-sm text-zinc-400">Số lượng: {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-fg">{formatVND(item.product.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-3 border-t border-zinc-800 pt-5 text-[15px]">
            <div className="flex justify-between text-zinc-300">
              <dt>Tạm tính</dt>
              <dd className="font-semibold text-fg">{formatVND(subtotal)}</dd>
            </div>
            {summary.discount > 0 && (
              <div className="flex justify-between text-zinc-300">
                <dt>Giảm giá</dt>
                <dd className="font-semibold text-emerald-400">- {formatVND(summary.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-zinc-300">
              <dt>Vận chuyển</dt>
              <dd className="font-semibold text-fg">{shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-zinc-800 pt-4">
              <dt className="font-bold text-fg">Tổng cộng</dt>
              <dd className="text-2xl font-extrabold text-fg">{formatVND(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
