"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingCart, User, X, Zap } from "lucide-react";
import { mainNavigation, siteConfig } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { searchProductsFromApi } from "@/lib/products";
import type { Product } from "@/types/product";
import { formatVND } from "@/utils/currency";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cartItems, wishlist, cartNotice, dismissCartNotice } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchProductsFromApi(query, 4, controller.signal)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
      setMenuOpen(false);
      setQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/92 text-white backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-red-700 via-red-500 to-cyan-400" />
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-10 2xl:px-16">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-zinc-300 hover:bg-zinc-900 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Mở menu">
          <Menu size={22} />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${siteConfig.name} homepage`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
            <Zap size={21} />
          </span>
          <span className="font-space-grotesk text-xl font-black tracking-tight">
            MODEL<span className="text-red-500">SHOP</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 xl:gap-2 lg:flex" aria-label="Main navigation">
          {mainNavigation.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                pathname === link.href.split("?")[0] ? "bg-zinc-900 text-red-400" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto hidden w-72 md:block xl:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm Gundam, Figure..."
            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-red-500"
            aria-label="Tìm kiếm sản phẩm"
          />
          {results.length > 0 && (
            <div className="absolute right-0 top-12 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              {results.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="flex gap-3 border-b border-zinc-900 p-3 last:border-0 hover:bg-zinc-900" onClick={() => setQuery("")}>
                  <img src={product.images[0]} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-white">{product.name}</span>
                    <span className="mt-1 block text-xs font-black text-red-400">{formatVND(product.price)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </form>

        <Link href="/products?wishlist=true" className="relative grid h-10 w-10 place-items-center rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-red-400" aria-label="Wishlist">
          <Heart size={20} />
          {wishlist.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
        </Link>
        <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-red-400" aria-label="Giỏ hàng">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{cartCount}</span>}
        </Link>

        {cartNotice && (
          <div className="absolute right-8 top-20 z-50 w-80 rounded-2xl border border-emerald-500/30 bg-zinc-950 p-4 text-white shadow-2xl shadow-emerald-500/10">
            <button className="absolute right-3 top-3 text-zinc-500 hover:text-white" onClick={dismissCartNotice} aria-label="Đóng thông báo">
              <X size={15} />
            </button>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Đã thêm vào giỏ</p>
            <div className="mt-3 flex gap-3">
              <img src={cartNotice.product.images[0]} alt={cartNotice.product.name} className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-bold">{cartNotice.product.name}</p>
                <p className="mt-1 text-xs text-zinc-400">Số lượng: {cartNotice.quantity}</p>
              </div>
            </div>
            <Link href="/cart" className="mt-3 flex h-10 items-center justify-center rounded-xl bg-red-600 text-xs font-black uppercase text-white hover:bg-red-500">
              Xem giỏ hàng
            </Link>
          </div>
        )}

        <div className="relative">
          <button type="button" onClick={() => setAccountOpen((current) => !current)} className="grid h-10 w-10 place-items-center rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-red-400" aria-label="Tài khoản">
            <User size={20} />
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-white shadow-2xl">
              {user ? (
                <>
                  <div className="border-b border-zinc-800 p-3">
                    <p className="text-sm font-black">{user.name}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
                  </div>
                  {user.role !== "customer" && <a href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5174"} onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-bold text-cyan-300 hover:bg-zinc-900">Admin dashboard</a>}
                  <Link href="/profile" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900">Hồ sơ khách hàng</Link>
                  <Link href="/orders" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900">Lịch sử đơn hàng</Link>
                  <Link href="/checkout" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900">Thanh toán</Link>
                  <button onClick={() => { logout(); setAccountOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-red-300 hover:bg-zinc-900">Đăng xuất</button>
                </>
              ) : (
                <>
                  <p className="px-3 py-2 text-xs leading-5 text-zinc-400">Đăng nhập để lưu thông tin giao hàng và mua nhanh lần sau.</p>
                  <Link href="/login" onClick={() => setAccountOpen(false)} className="block rounded-xl bg-red-600 px-3 py-2 text-center text-sm font-black uppercase text-white hover:bg-red-500">Đăng nhập</Link>
                  <Link href="/register" onClick={() => setAccountOpen(false)} className="mt-2 block rounded-xl border border-zinc-800 px-3 py-2 text-center text-sm font-black uppercase text-zinc-200 hover:border-red-500/40">Đăng ký</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[88vw] border-r border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-space-grotesk text-xl font-black">Menu</span>
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900" onClick={() => setMenuOpen(false)} aria-label="Đóng menu">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mô hình..." className="input pl-11" />
            </form>
            <nav className="grid gap-2">
              {mainNavigation.map((link) => (
                <Link key={link.label} href={link.href} className="rounded-xl border border-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-red-500/40 hover:bg-zinc-900" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
