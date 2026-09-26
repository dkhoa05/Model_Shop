"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";

/** Thư viện ảnh: ảnh lớn + dải ảnh nhỏ là các nút có nhãn và aria-pressed (điều hướng được bằng bàn phím) */
export default function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const safeImages = images.length > 0 ? images : [""];
  const [index, setIndex] = useState(0);
  const active = safeImages[Math.min(index, safeImages.length - 1)];

  return (
    <div className="grid gap-4">
      <div className="relative aspect-square overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900">
        <ProductImage src={active} alt={`${productName}, ảnh ${index + 1} trên ${safeImages.length}`} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
      </div>
      {safeImages.length > 1 && (
        <ul className="grid grid-cols-5 gap-3" aria-label="Ảnh sản phẩm">
          {safeImages.map((image, i) => (
            <li key={`${image}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-pressed={i === index}
                className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-zinc-900 transition ${i === index ? "border-accent" : "border-zinc-800 hover:border-zinc-600"}`}
              >
                <ProductImage src={image} alt="" sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
