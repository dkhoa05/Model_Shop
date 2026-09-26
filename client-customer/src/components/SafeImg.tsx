"use client";

import { useState } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=600";

/** <img> có ảnh dự phòng khi URL sản phẩm lỗi/hết hạn */
export default function SafeImg({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={failed || !src ? FALLBACK : src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
