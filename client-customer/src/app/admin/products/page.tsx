"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { products as fallbackProducts, Product } from "@/data/products";
import { API_BASE_URL, ApiProduct, mapApiProduct } from "@/lib/products";
import { formatVND } from "@/utils/currency";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [source, setSource] = useState<"api" | "mock">("mock");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error("Products API failed");
        const payload = (await response.json()) as ApiProduct[];
        if (active) {
          setProducts(payload.map(mapApiProduct));
          setSource("api");
        }
      } catch {
        if (active) {
          setProducts(fallbackProducts);
          setSource("mock");
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.toLowerCase();
    return products.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalized));
  }, [products, query]);

  if (!user || user.role !== "admin") {
    return (
      <EmptyState
        title="Không có quyền truy cập"
        description="Bạn cần đăng nhập tài khoản admin để quản lý sản phẩm."
        actionLabel="Đăng nhập admin"
        actionHref="/login"
      />
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Admin</p>
            <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Quản lý sản phẩm</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {source === "api" ? `Đang đọc ${products.length} sản phẩm từ MongoDB API.` : "Đang dùng mock fallback vì API chưa sẵn sàng."}
            </p>
          </div>
          <input className="input max-w-sm" placeholder="Tìm sản phẩm..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex gap-4">
                <img src={product.images[0]} alt={product.name} className="h-24 w-24 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase text-cyan-300">{product.brand}</p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-black text-white">{product.name}</h2>
                  <p className="mt-2 text-sm font-black text-red-400">{formatVND(product.price)}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-zinc-950 px-2 py-1 text-zinc-300">Stock: {product.stock}</span>
                    <span className="rounded-full bg-zinc-950 px-2 py-1 text-zinc-300">{product.status}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
