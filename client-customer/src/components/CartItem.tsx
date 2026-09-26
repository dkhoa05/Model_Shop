"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType, useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";
import ProductImage from "@/components/ProductImage";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeFromCart } = useCart();
  const name = item.product.name;

  return (
    <article className="grid gap-4 rounded-[20px] border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-[7rem_1fr_auto] sm:p-5">
      <Link href={`/products/${item.product.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-zinc-800" aria-label={`Xem ${name}`}>
        <ProductImage src={item.product.images[0]} alt="" sizes="112px" className="object-cover" />
      </Link>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-400">{item.product.brand}</p>
        <h2 className="mt-1 text-lg font-bold leading-snug text-fg">
          <Link href={`/products/${item.product.slug}`} className="hover:text-accent-text">
            {name}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-zinc-300">{formatVND(item.product.price)} / sản phẩm</p>

        <div role="group" aria-label={`Số lượng ${name}`} className="mt-4 inline-flex h-11 items-center rounded-xl border border-zinc-700 bg-zinc-950">
          <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Giảm số lượng ${name}`} className="grid h-11 w-11 place-items-center text-zinc-200 hover:text-accent-text disabled:opacity-40">
            <Minus size={16} aria-hidden />
          </button>
          <output aria-live="polite" className="min-w-9 text-center text-[15px] font-bold text-fg">
            {item.quantity}
          </output>
          <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label={`Tăng số lượng ${name}`} className="grid h-11 w-11 place-items-center text-zinc-200 hover:text-accent-text">
            <Plus size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="text-lg font-extrabold text-fg">{formatVND(item.product.price * item.quantity)}</p>
        <button type="button" onClick={() => removeFromCart(item.product.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-zinc-400 transition hover:text-[rgb(var(--danger-text))]">
          <Trash2 size={17} aria-hidden />
          Xóa<span className="sr-only"> {name} khỏi giỏ</span>
        </button>
      </div>
    </article>
  );
}
