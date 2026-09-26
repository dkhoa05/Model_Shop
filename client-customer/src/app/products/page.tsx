import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductFilter from "@/components/ProductFilter";
import ProductGrid from "@/components/ProductGrid";
import ProductSort from "@/components/ProductSort";
import { getFilteredProductsFromList, getProductsFromApi, ProductSearchParams } from "@/lib/products";

// Danh sách phụ thuộc bộ lọc (searchParams) và API → luôn render theo yêu cầu, không tiền-render lúc build
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sản phẩm Gundam, Figure, Model Kit",
  description: "Danh sách sản phẩm Gundam, Figure Anime, Tools và Collectibles với bộ lọc, sắp xếp và giá VND rõ ràng.",
  keywords: ["mua Gundam", "Gundam RG", "Gundam MG", "Figure Anime", "Model Kit"]
};

const PAGE_SIZE = 20;

interface ProductsPageProps {
  searchParams: ProductSearchParams;
}

function pageHref(searchParams: ProductSearchParams, page: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    const value = Array.isArray(v) ? v[0] : v;
    if (value && k !== "page") params.set(k, value);
  });
  if (page > 1) params.set("page", String(page));
  const q = params.toString();
  return q ? `/products?${q}` : "/products";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await getProductsFromApi();
  const filtered = getFilteredProductsFromList(products, searchParams);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rawPage = Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) || 1;
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();

  return (
    <div className="container-page py-10">
      <nav aria-label="Đường dẫn" className="text-sm text-zinc-400">
        <ol className="flex gap-2">
          <li>
            <Link href="/" className="hover:text-fg">Trang chủ</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-fg">Sản phẩm</li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{q ? `Kết quả cho "${q}"` : "Tất cả sản phẩm"}</h1>
          <p className="mt-2 text-base text-zinc-400" aria-live="polite">
            {filtered.length} sản phẩm phù hợp{totalPages > 1 ? `, trang ${page}/${totalPages}` : ""}
          </p>
        </div>
        <ProductSort />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
        <ProductFilter activeParams={searchParams} brands={brands} />
        <div className="space-y-10">
          <h2 className="sr-only">Danh sách sản phẩm</h2>
          <ProductGrid products={visible} />

          {totalPages > 1 && (
            <nav aria-label="Phân trang" className="flex items-center justify-center gap-2">
              {page > 1 ? (
                <Link href={pageHref(searchParams, page - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-zinc-700 px-4 text-sm font-bold text-fg hover:bg-zinc-800" rel="prev">
                  <ChevronLeft size={16} aria-hidden /> Trang trước
                </Link>
              ) : null}
              <span className="px-3 text-sm text-zinc-400">
                Trang {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(searchParams, page + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-zinc-700 px-4 text-sm font-bold text-fg hover:bg-zinc-800" rel="next">
                  Trang sau <ChevronRight size={16} aria-hidden />
                </Link>
              ) : null}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
