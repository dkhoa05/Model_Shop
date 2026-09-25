"use client";

import Link from "next/link";
import { Check, Heart, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";
import Badge from "./Badge";

export default function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const favorited = isInWishlist(product.id);
  const disabled = product.status === "out-of-stock";

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 transition duration-300 hover:-translate-y-1 hover:border-red-500/40">
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {product.badge && <Badge text={product.badge.text} type={product.badge.type} />}
        {rank && <span className="rounded-md bg-zinc-950/80 px-2 py-1 text-[10px] font-black text-cyan-300">#{rank}</span>}
      </div>

      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-950/80 text-zinc-300 backdrop-blur transition hover:border-red-500/40 hover:text-red-400"
        aria-label="Thêm vào wishlist"
      >
        <Heart size={16} className={favorited ? "fill-red-500 text-red-500" : ""} />
      </button>

      <Link href={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-zinc-950">
        <img
          src={product.images[0] || "/placeholder.png"}
          alt={`${product.name} chính hãng tại ModelShop`}
          className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wide text-zinc-500">
          <span>{product.brand}</span>
          <span className="text-cyan-400">{product.grade || product.category}</span>
        </div>

        <h3 className="line-clamp-2 min-h-11 text-sm font-bold leading-5 text-white">
          <Link href={`/product/${product.slug}`} className="hover:text-red-400">
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex items-center gap-1.5">
          <span className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={13} className={index < Math.round(product.rating) ? "fill-amber-400" : "opacity-25"} />
            ))}
          </span>
          <span className="text-xs font-bold text-zinc-500">({product.reviewCount})</span>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-black text-red-400">{formatVND(product.price)}</span>
          {product.originalPrice && <span className="text-xs font-bold text-zinc-500 line-through">{formatVND(product.originalPrice)}</span>}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-600/50 bg-zinc-950 px-3 text-xs font-black uppercase tracking-wide text-red-400 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-zinc-950"
        >
          {disabled ? (
            "Hết hàng"
          ) : added ? (
            <>
              <Check size={15} />
              Đã thêm
            </>
          ) : (
            <>
              <ShoppingCart size={15} />
              {product.status === "pre-order" ? "Đặt trước" : "Thêm vào giỏ"}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
