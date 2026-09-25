"use client";

import Link from "next/link";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";

export default function CartPage() {
  const { cartItems, subtotal, shipping, total } = useCart();

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng đang trống"
        description="Chọn vài mẫu Gundam, Figure hoặc tools yêu thích để bắt đầu đơn hàng demo."
        actionLabel="Tiếp tục mua sắm"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm font-bold text-zinc-500" aria-label="Breadcrumb">
        Home / <span className="text-zinc-300">Cart</span>
      </nav>
      <h1 className="font-space-grotesk text-4xl font-black uppercase text-white">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          {cartItems.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </section>

        <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 lg:sticky lg:top-28">
          <h2 className="font-space-grotesk text-xl font-black uppercase text-white">Order Summary</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <Row label="Subtotal" value={formatVND(subtotal)} />
            <Row label="Shipping estimate" value={shipping === 0 ? "Free" : formatVND(shipping)} />
            <label className="mt-3 grid gap-2 text-sm font-bold text-zinc-300">
              Discount code
              <input className="input" placeholder="MODEL10" />
            </label>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
              <span className="font-black uppercase text-white">Total</span>
              <span className="text-xl font-black text-red-400">{formatVND(total)}</span>
            </div>
          </div>
          <Link href="/checkout" className="mt-6 flex h-12 items-center justify-center rounded-lg bg-red-600 text-sm font-black uppercase text-white hover:bg-red-500">
            Checkout
          </Link>
          <Link href="/products" className="mt-3 flex h-11 items-center justify-center rounded-lg border border-zinc-800 text-sm font-black uppercase text-zinc-200 hover:border-red-500/40 hover:text-red-400">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-400">
      <span>{label}</span>
      <span className="font-bold text-zinc-100">{value}</span>
    </div>
  );
}
