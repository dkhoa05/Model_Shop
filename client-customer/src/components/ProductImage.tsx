"use client";

import Image from "next/image";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

const OPTIMIZED_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "images.unsplash.com").split(",").map((h) => h.trim()).filter(Boolean);

function isOptimizable(url: string) {
  try {
    return OPTIMIZED_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const FALLBACK = "https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=1200";

/** Ảnh sản phẩm: ảnh từ API (tải lên) phục vụ trực tiếp; ảnh lỗi/không tải được sẽ chuyển sang ảnh dự phòng */
export default function ProductImage({ src, alt, sizes, className, priority = false }: { src?: string; alt: string; sizes: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = failed || !src ? FALLBACK : src;
  return <Image src={url} alt={alt} fill sizes={sizes} className={className} priority={priority} unoptimized={url.startsWith(API_BASE_URL) || !isOptimizable(url)} onError={() => setFailed(true)} />;
}
