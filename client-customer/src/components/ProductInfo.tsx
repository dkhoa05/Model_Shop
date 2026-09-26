"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Minus, PackageCheck, Plus, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";
import Badge from "./Badge";
import Button from "./Button";

const MAX_QTY = 99;

export default function ProductInfo({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const soldOut = product.status === "out-of-stock";
  const limit = Math.max(1, Math.min(MAX_QTY, product.status === "pre-order" ? MAX_QTY : product.stock || MAX_QTY));
  const favorited = isInWishlist(product.id);
  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  const stockText = soldOut
    ? "Tạm hết hàng"
    : product.status === "pre-order"
      ? "Đang nhận đặt trước"
      : product.stock <= 5
        ? `Chỉ còn ${product.stock} sản phẩm`
        : "Còn hàng";

  const specs = [
    ["Dòng / series", product.specs.series],
    ["Cấp độ", product.specs.grade],
    ["Tỉ lệ", product.specs.scale],
    ["Chất liệu", product.specs.material],
    ["Phát hành", product.specs.releaseDate]
  ].filter(([, value]) => value && value !== "Non-scale");

  return (
    <section aria-label="Thông tin sản phẩm">
      <div className="flex flex-wrap items-center gap-2">
        {product.badge && <Badge text={product.badge.text} type={product.badge.type} />}
        <span className="text-sm font-semibold text-zinc-400">{product.brand}</span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-fg lg:text-4xl">{product.name}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {product.reviewCount > 0 ? (
          <a href="#reviews" className="inline-flex min-h-11 items-center gap-2 text-zinc-300 hover:text-fg">
            <span className="flex text-amber-400" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={17} className={i < Math.round(product.rating) ? "fill-amber-400" : "opacity-30"} />
              ))}
            </span>
            <span>
              {product.rating.toFixed(1)} trên 5, {product.reviewCount} đánh giá
            </span>
          </a>
        ) : (
          <span className="text-zinc-400">Chưa có đánh giá</span>
        )}
        <span className={`inline-flex items-center gap-2 font-semibold ${soldOut ? "text-zinc-400" : "text-emerald-400"}`}>{stockText}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-3xl font-extrabold text-fg lg:text-4xl">{formatVND(product.price)}</span>
        {product.originalPrice && <span className="text-lg text-zinc-500 line-through">{formatVND(product.originalPrice)}</span>}
        {discount > 0 && <span className="rounded-md bg-accent px-2 py-1 text-sm font-extrabold text-on-accent">Giảm {discount}%</span>}
      </div>

      <p className="mt-6 max-w-prose text-base leading-8 text-zinc-300">{product.description}</p>

      <div className="mt-8 rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p id="qty-label" className="mb-2 text-sm font-semibold text-zinc-200">
              Số lượng
            </p>
            <div role="group" aria-labelledby="qty-label" className="inline-flex h-12 items-center rounded-xl border border-zinc-700 bg-zinc-950">
              <button type="button" onClick={() => setQuantity((c) => Math.max(1, c - 1))} disabled={quantity <= 1} aria-label="Giảm số lượng" className="grid h-12 w-12 place-items-center text-zinc-200 transition hover:text-accent-text disabled:opacity-40">
                <Minus size={18} aria-hidden />
              </button>
              <output aria-live="polite" className="min-w-10 text-center text-base font-bold text-fg">
                {quantity}
              </output>
              <button type="button" onClick={() => setQuantity((c) => Math.min(limit, c + 1))} disabled={quantity >= limit} aria-label="Tăng số lượng" className="grid h-12 w-12 place-items-center text-zinc-200 transition hover:text-accent-text disabled:opacity-40">
                <Plus size={18} aria-hidden />
              </button>
            </div>
          </div>
          <Button disabled={soldOut} onClick={() => addToCart(product, quantity)} className="flex-1 sm:flex-none">
            <ShoppingBag size={19} aria-hidden />
            {product.status === "pre-order" ? "Đặt trước" : "Thêm vào giỏ"}
          </Button>
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-pressed={favorited}
            aria-label={favorited ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
            className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-700 text-zinc-200 transition hover:border-accent hover:text-accent-text active:scale-95"
          >
            <Heart size={20} aria-hidden className={favorited ? "fill-accent text-accent" : ""} />
          </button>
        </div>
        {!soldOut && (
          <p className="mt-4 text-sm text-zinc-400">
            Muốn mua ngay?{" "}
            <Link href="/checkout" className="link">
              Đi tới thanh toán
            </Link>{" "}
            sau khi thêm vào giỏ.
          </p>
        )}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Cam kết">
        {[
          { icon: ShieldCheck, text: "Hàng chính hãng, kiểm tra box trước khi giao" },
          { icon: PackageCheck, text: "Đóng gói chống sốc, bọc góc box" },
          { icon: Truck, text: "Giao nhanh toàn quốc" },
          { icon: RotateCcw, text: "Đổi trả trong 7 ngày nếu lỗi sản xuất" }
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
            <Icon size={19} className="mt-0.5 shrink-0 text-accent-text" aria-hidden />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <details open className="group rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-base font-bold text-fg [&::-webkit-details-marker]:hidden">
            Thông số
            <span className="text-zinc-400 transition group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <dl className="grid gap-x-8 gap-y-4 px-5 pb-5 sm:grid-cols-2">
            {specs.map(([term, value]) => (
              <div key={term}>
                <dt className="text-sm text-zinc-400">{term}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
        <details className="group rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-base font-bold text-fg [&::-webkit-details-marker]:hidden">
            Điểm nổi bật
            <span className="text-zinc-400 transition group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <ul className="grid gap-3 px-5 pb-5 text-[15px] leading-7 text-zinc-300">
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
