import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";

const FALLBACK = "https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=1200";

/** Ảnh sản phẩm: ảnh từ API (tải lên) phục vụ trực tiếp, ảnh https ngoài đi qua tối ưu hóa của Next */
export default function ProductImage({ src, alt, sizes, className, priority = false }: { src?: string; alt: string; sizes: string; className?: string; priority?: boolean }) {
  const url = src || FALLBACK;
  return <Image src={url} alt={alt} fill sizes={sizes} className={className} priority={priority} unoptimized={url.startsWith(API_BASE_URL)} />;
}
