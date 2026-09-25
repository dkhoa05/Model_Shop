"use client";

import { useState } from "react";

export default function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const safeImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=85&w=1200"];
  const [active, setActive] = useState(safeImages[0]);

  return (
    <div className="grid gap-4">
      <div className="aspect-square overflow-hidden bg-apple-parchment">
        <img src={active} alt={`${productName} product gallery`} className="h-full w-full object-cover product-shadow" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {safeImages.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`aspect-square overflow-hidden rounded-[18px] border bg-white ${active === image ? "border-apple-blue" : "border-apple-hairline"}`}
            onClick={() => setActive(image)}
          >
            <img src={image} alt={`${productName} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
