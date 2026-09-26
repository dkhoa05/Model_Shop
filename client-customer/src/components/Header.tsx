"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { mainNavigation } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { searchProductsFromApi } from "@/lib/products";
import type { Product } from "@/types/product";
import { formatVND } from "@/utils/currency";
import SafeImg from "@/components/SafeImg";
import ThemeToggle from "@/components/ThemeToggle";

const iconButton =
  "relative grid h-11 w-11 place-items-center rounded-xl text-zinc-300 transition hover:bg-zinc-800 hover:text-fg";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cartItems, wishlist, cartNotice, dismissCartNotice } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [bump, setBump] = useState(false);

  // Gợi ý tìm kiếm (debounce 250ms, huỷ request cũ)
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchProductsFromApi(query, 5, controller.signal)
        .then((r) => {
          setResults(r);
          setActiveIndex(-1);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Đổ bóng thanh header khi cuộn (IntersectionObserver, không lắng nghe scroll)
  useEffect(() => {
    const sentinel = document.getElementById("header-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // Nhấn nhẹ biểu tượng giỏ khi số lượng đổi
  useEffect(() => {
    if (cartCount === 0) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 400);
    return () => window.clearTimeout(t);
  }, [cartCount]);

  // Đóng menu tài khoản khi bấm ra ngoài / nhấn Escape
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [accountOpen]);

  // Ngăn cuộn nền và focus vào nút đóng khi mở menu di động
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const closeAll = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      router.push(`/products/${results[activeIndex].slug}`);
    } else if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
    setQuery("");
    setMenuOpen(false);
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    }
  };

  const showResults = query.trim().length > 0 && results.length > 0;

  return (
    <>
      <div id="header-sentinel" className="absolute top-0 h-px w-px" aria-hidden />
      <header
        className={`sticky top-0 z-40 border-b transition-colors ${
          scrolled ? "border-zinc-800 bg-zinc-950/85 shadow-pop backdrop-blur-xl" : "border-transparent bg-zinc-950/60 backdrop-blur"
        }`}
      >
        <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className={`${iconButton} lg:hidden`}
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Menu size={22} aria-hidden />
          </button>

          <Link href="/" className="shrink-0 rounded-lg px-1 text-xl font-extrabold tracking-tight" aria-label="ModelShop, về trang chủ">
            Model<span className="text-accent-text">Shop</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Danh mục chính">
            {mainNavigation.map((link) => {
              const active = pathname === link.href.split("?")[0] && link.href.split("?")[0] !== "/products";
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-zinc-800 text-fg" : "text-zinc-300 hover:bg-zinc-800/70 hover:text-fg"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <form onSubmit={handleSearch} role="search" className="relative ml-auto hidden w-56 md:block lg:w-52 xl:w-72 2xl:w-96">
            <label htmlFor="site-search" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} aria-hidden />
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Tìm Gundam, Figure, tên sản phẩm"
              autoComplete="off"
              role="combobox"
              aria-expanded={showResults}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-fg placeholder:text-zinc-500 focus-visible:border-accent"
            />
            {showResults && (
              <ul id={listId} role="listbox" aria-label="Gợi ý sản phẩm" className="absolute right-0 top-14 z-50 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-pop">
                {results.map((product, i) => (
                  <li key={product.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => setQuery("")}
                      className={`flex items-center gap-3 p-3 transition ${i === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-800"}`}
                    >
                      <SafeImg src={product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-fg">{product.name}</span>
                        <span className="mt-0.5 block text-sm font-bold text-accent-text">{formatVND(product.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <ThemeToggle />
            <Link href="/products?wishlist=true" className={`${iconButton} hidden sm:grid`} aria-label={`Yêu thích${wishlist.length ? `, ${wishlist.length} sản phẩm` : ""}`}>
              <Heart size={20} aria-hidden />
              {wishlist.length > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-zinc-950" aria-hidden />}
            </Link>
            <Link href="/cart" className={iconButton} aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} sản phẩm` : ""}`}>
              <ShoppingBag size={20} aria-hidden className={bump ? "animate-bump" : ""} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-on-accent" aria-hidden>
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={accountRef} onKeyDown={(e) => e.key === "Escape" && setAccountOpen(false)}>
              <button
                type="button"
                onClick={() => setAccountOpen((c) => !c)}
                className={iconButton}
                aria-label="Tài khoản"
                aria-haspopup="true"
                aria-expanded={accountOpen}
              >
                <User size={20} aria-hidden />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-pop">
                  {user ? (
                    <>
                      <div className="px-3 py-3">
                        <p className="truncate text-sm font-bold text-fg">{user.name}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{user.email}</p>
                      </div>
                      <div className="border-t border-zinc-800 pt-1">
                        {user.role !== "customer" && (
                          <a href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5174"} className="menu-item font-bold text-accent-text">
                            Trang quản trị
                          </a>
                        )}
                        <Link href="/profile" onClick={closeAll} className="menu-item">Hồ sơ của tôi</Link>
                        <Link href="/orders" onClick={closeAll} className="menu-item">Đơn hàng</Link>
                        <button type="button" onClick={() => { logout(); closeAll(); }} className="menu-item w-full text-left">Đăng xuất</button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2">
                      <p className="px-1 pb-3 text-sm leading-6 text-zinc-300">Đăng nhập để lưu địa chỉ, theo dõi đơn và dùng mã giảm giá.</p>
                      <Link href="/login" onClick={closeAll} className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-on-accent transition hover:brightness-110">Đăng nhập</Link>
                      <Link href="/register" onClick={closeAll} className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-bold text-fg transition hover:bg-zinc-800">Tạo tài khoản</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Thông báo thêm giỏ: vùng trạng thái được đọc bởi trình đọc màn hình */}
      <div className="pointer-events-none fixed right-4 top-20 z-50 w-[min(22rem,calc(100vw-2rem))]" role="status" aria-live="polite">
        {cartNotice && (
          <div className="pointer-events-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-pop">
            <div className="flex items-start gap-3">
              <SafeImg src={cartNotice.product.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">Đã thêm vào giỏ hàng</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-zinc-300">{cartNotice.product.name}</p>
              </div>
              <button type="button" onClick={dismissCartNotice} aria-label="Đóng thông báo" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-fg">
                <X size={16} aria-hidden />
              </button>
            </div>
            <Link href="/cart" className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-accent text-sm font-bold text-on-accent transition hover:brightness-110">
              Xem giỏ hàng
            </Link>
          </div>
        )}
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 lg:hidden"
          onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}
        >
          <button type="button" tabIndex={-1} className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />
          <div className="absolute left-0 top-0 flex h-full w-[22rem] max-w-[88vw] flex-col border-r border-zinc-800 bg-zinc-950 p-5 shadow-pop">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xl font-extrabold tracking-tight">Model<span className="text-accent-text">Shop</span></span>
              <button ref={menuCloseRef} type="button" className={iconButton} onClick={() => setMenuOpen(false)} aria-label="Đóng menu">
                <X size={22} aria-hidden />
              </button>
            </div>
            <form onSubmit={handleSearch} role="search" className="mb-5">
              <label htmlFor="mobile-search" className="sr-only">Tìm kiếm sản phẩm</label>
              <input id="mobile-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mô hình" className="input" />
            </form>
            <nav aria-label="Danh mục" className="grid gap-1 overflow-y-auto">
              {mainNavigation.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3.5 text-base font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-fg">
                  {link.label}
                </Link>
              ))}
              <Link href="/products?wishlist=true" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3.5 text-base font-semibold text-zinc-200 hover:bg-zinc-800">Yêu thích</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
