"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";

export default function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const safeImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=85&w=1200"];
  const [active, setActive] = useState(safeImages[0]);

  return (
    <div className="grid gap-4">
      <div className="relative aspect-square overflow-hidden bg-apple-parchment">
        <ProductImage src={active} alt={`${productName} product gallery`} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover product-shadow" priority />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {safeImages.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`relative aspect-square overflow-hidden rounded-[18px] border bg-white ${active === image ? "border-apple-blue" : "border-apple-hairline"}`}
            onClick={() => setActive(image)}
          >
            <ProductImage src={image} alt={`${productName} thumbnail ${index + 1}`} sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
