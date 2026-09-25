"use client";

import { useState } from "react";
import CheckoutForm from "@/components/CheckoutForm";
import EmptyState from "@/components/EmptyState";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";

export default function CheckoutPage() {
  const { cartItems, subtotal, shipping, syncNotices } = useCart();
  const [summary, setSummary] = useState({ deliveryType: "delivery", discount: 0 });
  const shippingFee = summary.deliveryType === "pickup" ? 0 : shipping;
  const total = Math.max(0, subtotal - summary.discount + shippingFee);

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm để thanh toán"
        description="Thêm sản phẩm vào giỏ hàng trước khi điền thông tin checkout."
        actionLabel="Xem sản phẩm"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm font-bold text-zinc-500" aria-label="Breadcrumb">
        Home / Cart / <span className="text-zinc-300">Checkout</span>
      </nav>
      <h1 className="font-space-grotesk text-4xl font-black uppercase text-white">Checkout</h1>
      {syncNotices.length > 0 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          {syncNotices.map((notice) => <p key={notice}>{notice}</p>)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h2 className="mb-5 font-space-grotesk text-xl font-black uppercase text-white">Customer information</h2>
          <CheckoutForm onSummaryChange={setSummary} />
        </section>

        <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 lg:sticky lg:top-28">
          <h2 className="font-space-grotesk text-xl font-black uppercase text-white">Order summary</h2>
          <div className="mt-5 grid gap-4">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex gap-3 border-b border-zinc-800 pb-4">
                <img src={item.product.images[0]} alt={item.product.name} className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{item.product.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-red-400">{formatVND(item.product.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 text-sm">
            <Row label="Subtotal" value={formatVND(subtotal)} />
            {summary.discount > 0 && <Row label="Discount" value={`- ${formatVND(summary.discount)}`} />}
            <Row label="Shipping" value={shippingFee === 0 ? "Free" : formatVND(shippingFee)} />
            <Row label="Total" value={formatVND(total)} strong />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-zinc-800 pt-4 text-lg font-black text-white" : "text-zinc-400"}`}>
      <span>{label}</span>
      <span className={strong ? "text-red-400" : "font-bold text-zinc-100"}>{value}</span>
    </div>
  );
}
