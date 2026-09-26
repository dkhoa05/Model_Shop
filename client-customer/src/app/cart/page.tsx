"use client";

import Link from "next/link";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";

export default function CartPage() {
  const { cartItems, subtotal, shipping, total, syncNotices, dismissSyncNotices } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="space-y-4">
        {syncNotices.length > 0 && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <ul className="list-disc space-y-1 pl-5">
              {syncNotices.map((notice) => <li key={notice}>{notice}</li>)}
            </ul>
            <button onClick={dismissSyncNotices} className="mt-3 text-xs font-black uppercase text-amber-300 underline">Đã hiểu</button>
          </div>
        )}
      <EmptyState
        title="Giỏ hàng đang trống"
        description="Chọn vài mẫu Gundam, Figure hoặc tools yêu thích để bắt đầu đơn hàng của bạn."
        actionLabel="Tiếp tục mua sắm"
        actionHref="/products"
      />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm font-bold text-zinc-500" aria-label="Breadcrumb">
        Home / <span className="text-zinc-300">Cart</span>
      </nav>
      <h1 className="font-space-grotesk text-4xl font-black uppercase text-white">Shopping Cart</h1>
      {syncNotices.length > 0 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <ul className="list-disc space-y-1 pl-5">
            {syncNotices.map((notice) => <li key={notice}>{notice}</li>)}
          </ul>
          <button onClick={dismissSyncNotices} className="mt-3 text-xs font-black uppercase text-amber-300 underline">Đã hiểu</button>
        </div>
      )}

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
            <p className="text-xs text-zinc-500">Mã giảm giá được áp dụng ở bước thanh toán.</p>
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
