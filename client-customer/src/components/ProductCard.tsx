"use client";

import Link from "next/link";
import { Check, Heart, ShoppingBag, Star } from "lucide-react";
import { PointerEvent, useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";
import Badge from "./Badge";
import ProductImage from "./ProductImage";

/** Thẻ sản phẩm: toàn thẻ bấm được (liên kết ở tên), nút giỏ/yêu thích tách riêng, đủ vùng chạm 44px */
export default function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const favorited = isInWishlist(product.id);
  const soldOut = product.status === "out-of-stock";
  const preOrder = product.status === "pre-order";
  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  // Ánh sáng theo con trỏ: chỉ đặt biến CSS, không setState
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <article
      onPointerMove={onMove}
      className="spotlight group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900 transition duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        <ProductImage
          src={product.images[0]}
          alt=""
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          className={`object-cover transition duration-700 group-hover:scale-105 ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {product.badge && <Badge text={product.badge.text} type={product.badge.type} />}
          {discount > 0 && <span className="rounded-md bg-accent px-2 py-1 text-[11px] font-extrabold leading-none text-on-accent">-{discount}%</span>}
          {rank && <span className="rounded-md bg-zinc-950/85 px-2 py-1 text-[11px] font-extrabold leading-none text-fg backdrop-blur">Top {rank}</span>}
        </div>
        {soldOut && (
          <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-zinc-950/90 px-3 py-1.5 text-xs font-bold text-fg">Tạm hết hàng</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-pressed={favorited}
        aria-label={favorited ? `Bỏ ${product.name} khỏi yêu thích` : `Thêm ${product.name} vào yêu thích`}
        className="absolute right-2 top-2 z-20 grid h-11 w-11 place-items-center rounded-xl bg-zinc-950/70 text-zinc-200 backdrop-blur transition hover:bg-zinc-950 hover:text-accent-text"
      >
        <Heart size={18} aria-hidden className={favorited ? "fill-accent text-accent" : ""} />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold text-zinc-400">
          {product.brand}
          {product.grade ? ` · ${product.grade}` : ""}
        </p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-[15px] font-bold leading-snug text-fg">
          <Link href={`/products/${product.slug}`} className="stretched-link rounded">
            {product.name}
          </Link>
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          {product.reviewCount > 0 ? (
            <>
              <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-semibold text-zinc-200">{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount})</span>
              <span className="sr-only">{`đánh giá trung bình ${product.rating.toFixed(1)} trên 5 từ ${product.reviewCount} lượt`}</span>
            </>
          ) : (
            <span>Chưa có đánh giá</span>
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-extrabold text-fg">{formatVND(product.price)}</span>
          {product.originalPrice && <span className="text-sm text-zinc-500 line-through">{formatVND(product.originalPrice)}</span>}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className={`relative z-20 mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
            added ? "border-transparent bg-emerald-500 text-on-accent" : "border-zinc-700 bg-zinc-800 text-fg hover:border-accent hover:bg-accent hover:text-on-accent"
          }`}
        >
          {soldOut ? (
            "Hết hàng"
          ) : added ? (
            <>
              <Check size={17} aria-hidden /> Đã thêm
            </>
          ) : (
            <>
              <ShoppingBag size={17} aria-hidden />
              {preOrder ? "Đặt trước" : "Thêm vào giỏ"}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
