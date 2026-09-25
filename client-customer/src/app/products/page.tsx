import type { Metadata } from "next";
import ProductFilter from "@/components/ProductFilter";
import ProductGrid from "@/components/ProductGrid";
import ProductSort from "@/components/ProductSort";
import { getFilteredProductsFromList, getProductsFromApi, ProductSearchParams } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products - Gundam, Figure, Model Kit",
  description: "Danh sách sản phẩm Gundam, Figure Anime, Tools và Collectibles với filter, sort và giá VND rõ ràng.",
  keywords: ["mua Gundam", "Gundam RG", "Gundam MG", "Figure Anime", "Model Kit"]
};

interface ProductsPageProps {
  searchParams: ProductSearchParams;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await getProductsFromApi();
  const filteredProducts = getFilteredProductsFromList(products, searchParams);

  return (
    <div className="space-y-6">
      <nav className="text-sm font-bold text-zinc-500" aria-label="Breadcrumb">
        <ol className="flex gap-2">
          <li>Home</li>
          <li>/</li>
          <li className="text-zinc-300">Products</li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-space-grotesk text-4xl font-black uppercase text-white">Products</h1>
          <p className="mt-2 text-sm text-zinc-400">{filteredProducts.length} sản phẩm phù hợp với bộ lọc hiện tại.</p>
        </div>
        <ProductSort />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ProductFilter activeParams={searchParams} brands={Array.from(new Set(products.map((p) => p.brand))).sort()} />
        <div className="space-y-6">
          <ProductGrid products={filteredProducts} />
          {filteredProducts.length > 0 && (
            <div className="flex justify-center">
              <button className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-black uppercase text-zinc-200 hover:border-red-500/40 hover:text-red-400">
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
