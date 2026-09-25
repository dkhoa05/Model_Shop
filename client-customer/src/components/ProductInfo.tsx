"use client";

import { useState } from "react";
import { Bot, Heart, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";
import Badge from "./Badge";
import Button from "./Button";

export default function ProductInfo({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const disabled = product.status === "out-of-stock";

  return (
    <section className="rounded-[18px] border border-apple-hairline bg-white p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {product.badge && <Badge text={product.badge.text} type={product.badge.type} />}
        <span className="rounded-full bg-apple-parchment px-3 py-1 text-xs text-apple-muted">{product.brand}</span>
      </div>

      <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.374px] text-apple-ink lg:text-[40px]">{product.name}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="flex text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={16} className={index < Math.round(product.rating) ? "fill-amber-400" : "opacity-25"} />
          ))}
        </span>
        <span className="text-sm text-apple-muted">{product.rating.toFixed(1)} / 5 từ {product.reviewCount} đánh giá</span>
        <span className={`text-sm ${disabled ? "text-apple-muted" : "text-apple-blue"}`}>
          {disabled ? "Tạm hết hàng" : product.status === "pre-order" ? "Đang nhận đặt trước" : `Còn ${product.stock} sản phẩm`}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <span className="text-[28px] font-semibold text-apple-ink">{formatVND(product.price)}</span>
        {product.originalPrice && <span className="text-[17px] text-apple-muted line-through">{formatVND(product.originalPrice)}</span>}
      </div>

      <p className="mt-5 text-[17px] leading-[1.47] tracking-[-0.374px] text-apple-muted">{product.description}</p>

      <div className="mt-6 grid gap-4 border-y border-apple-hairline py-5 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2 text-sm text-apple-ink"><ShieldCheck size={18} className="text-apple-blue" /> Chính hãng</span>
        <span className="inline-flex items-center gap-2 text-sm text-apple-ink"><Truck size={18} className="text-apple-blue" /> Giao nhanh</span>
        <span className="inline-flex items-center gap-2 text-sm text-apple-ink"><PackageCheck size={18} className="text-apple-blue" /> Đóng gói kỹ</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center rounded-full border border-apple-hairline bg-white">
          <button className="px-4 text-apple-muted hover:text-apple-ink" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Giảm số lượng">
            <Minus size={16} />
          </button>
          <span className="min-w-10 text-center text-sm text-apple-ink">{quantity}</span>
          <button className="px-4 text-apple-muted hover:text-apple-ink" onClick={() => setQuantity((current) => current + 1)} aria-label="Tăng số lượng">
            <Plus size={16} />
          </button>
        </div>

        <Button disabled={disabled} onClick={() => addToCart(product, quantity)}>
          <ShoppingBag size={17} />
          Thêm vào giỏ
        </Button>
        <Button disabled={disabled} href="/checkout" variant="outline">
          Mua ngay
        </Button>
        <button type="button" onClick={() => toggleWishlist(product.id)} className="grid h-11 w-11 place-items-center rounded-full border border-apple-hairline bg-white text-apple-ink active:scale-95" aria-label="Wishlist">
          <Heart size={18} className={isInWishlist(product.id) ? "fill-apple-blue text-apple-blue" : ""} />
        </button>
      </div>

      <div className="mt-8 grid gap-4">
        <section className="rounded-[18px] bg-apple-parchment p-5">
          <h2 className="text-[21px] font-semibold tracking-[-0.224px] text-apple-ink">Tóm tắt nhanh cho collector</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Series", product.specs.series],
              ["Grade / Scale", `${product.specs.grade} · ${product.specs.scale}`],
              ["Material", product.specs.material],
              ["Release", product.specs.releaseDate]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[18px] border border-apple-hairline bg-white p-4">
                <p className="text-xs text-apple-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold text-apple-ink">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] bg-apple-tile p-5 text-white">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-apple-blue">
              <Bot size={20} />
            </span>
            <div>
              <h2 className="text-[21px] font-semibold tracking-[-0.224px]">AI tư vấn nhanh</h2>
              <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.374px] text-white/72">
                Phù hợp nếu bạn muốn một mẫu {product.category} nổi bật, dễ trưng bày và có giá trị sưu tầm. AI có thể gợi ý tools, decal, cách bảo quản và sản phẩm tương tự theo ngân sách.
              </p>
              <button className="mt-4 rounded-full border border-[#2997ff] px-5 py-2 text-sm text-[#2997ff] hover:bg-[#2997ff] hover:text-white">
                Hỏi AI về sản phẩm này
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
