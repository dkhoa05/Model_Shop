"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType, useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <article className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-[110px_1fr_auto]">
      <Link href={`/product/${item.product.slug}`} className="aspect-square overflow-hidden rounded-lg bg-zinc-950">
        <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
      </Link>
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">{item.product.brand}</p>
        <h2 className="mt-1 font-space-grotesk text-lg font-black text-white">
          <Link href={`/product/${item.product.slug}`} className="hover:text-red-400">{item.product.name}</Link>
        </h2>
        <p className="mt-2 text-sm font-bold text-red-400">{formatVND(item.product.price)}</p>
        <div className="mt-4 flex w-fit items-center rounded-lg border border-zinc-800 bg-zinc-950">
          <button className="px-3 py-2 text-zinc-300" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Giảm số lượng"><Minus size={15} /></button>
          <span className="min-w-9 text-center text-sm font-black text-white">{item.quantity}</span>
          <button className="px-3 py-2 text-zinc-300" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Tăng số lượng"><Plus size={15} /></button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-black text-white">{formatVND(item.product.price * item.quantity)}</p>
        <button className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-red-400" onClick={() => removeFromCart(item.product.id)}>
          <Trash2 size={16} />
          Remove
        </button>
      </div>
    </article>
  );
}
