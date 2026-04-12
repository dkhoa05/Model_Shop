import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import ProductCardHoverImage from "../components/ProductCardHoverImage.jsx";
import { getProductImageUrl } from "../utils/productImage.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCartDrawer } from "../context/CartDrawerContext.jsx";
import { getCartItemsSafe } from "../lib/cartStorage.js";
import {
  AVAILABILITY_LABELS,
  getAvailabilityBadgeClass,
  canAddModelToCart,
  getEffectiveAvailability,
  isSoldOutByStock
} from "../lib/productAvailability.js";

function ChevronDownIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductsPage() {
  const { openCart } = useCartDrawer();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sort, setSort] = useState("default");
  /** Thu gọn nhóm lọc trên mobile — desktop luôn mở */
  const [mobileFilterOpen, setMobileFilterOpen] = useState({ category: true, price: true });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products`);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (category) list = list.filter((p) => p.category === category);
    if (priceRange) {
      const [min, max] = priceRange.split("-").map((s) => parseInt(s.trim(), 10));
      list = list.filter((p) => {
        const price = p.price || 0;
        if (max && max < 999999999) return price >= min && price <= max;
        return price >= min;
      });
    }
    if (sort === "price_asc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price_desc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "newest") list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [products, search, category, priceRange, sort]);

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-lg bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const cardClass =
    theme === "dark"
      ? "group rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-400/60 hover:shadow-lg transition overflow-hidden"
      : "group rounded-xl border border-rose-100 bg-white hover:border-rose-300 hover:shadow-lg transition overflow-hidden";

  const sidebarClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-lg shadow-black/20"
      : "rounded-2xl border border-rose-100 bg-white p-4 shadow-sm";

  /** Khung danh sách lọc: cuộn gọn, thanh cuộn mảnh */
  const filterListShell =
    theme === "dark"
      ? "rounded-xl border border-slate-700/50 bg-slate-950/40 p-1 max-h-[min(52vh,360px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)]"
      : "rounded-xl border border-rose-100/90 bg-rose-50/40 p-1 max-h-[min(52vh,360px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgb(251_113_133)_rgb(255_241_242)]";

  const filterItemClass = (active) => {
    const base =
      "w-full text-left rounded-lg px-3 py-2.5 text-sm transition-all duration-200 flex items-center gap-2 ";
    if (theme === "dark") {
      return (
        base +
        (active
          ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-200 font-semibold shadow-[0_0_0_1px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/20"
          : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 active:scale-[0.99]")
      );
    }
    return (
      base +
      (active
        ? "bg-gradient-to-r from-rose-100 to-rose-50/80 text-rose-900 font-semibold shadow-sm ring-1 ring-rose-200/80"
        : "text-slate-600 hover:bg-white hover:text-slate-900 active:scale-[0.99]")
    );
  };

  /** Lọc giá — bố cục giống mẫu: viền cyan khi chọn, bullet phát sáng, nhãn …đ */
  const priceFilterShell =
    theme === "dark"
      ? "rounded-xl border border-slate-600/45 bg-slate-950/70 p-2 shadow-inner shadow-black/20"
      : "rounded-xl border border-rose-200/80 bg-rose-50/50 p-2 shadow-sm";

  const priceFilterBtn = (active) => {
    const base =
      "w-full text-left rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-3 ";
    if (theme === "dark") {
      return (
        base +
        (active
          ? "border border-cyan-400 text-cyan-300 font-semibold bg-cyan-500/10 shadow-[0_0_14px_rgba(34,211,238,0.12)]"
          : "border border-transparent text-slate-400 hover:bg-slate-800/55 hover:text-slate-200")
      );
    }
    return (
      base +
      (active
        ? "border border-rose-500 text-rose-800 font-semibold bg-rose-100/90 shadow-sm"
        : "border border-transparent text-slate-600 hover:bg-white hover:text-slate-900")
    );
  };

  const priceFilterBullet = (active) => {
    if (theme === "dark") {
      return (
        "h-2 w-2 shrink-0 rounded-full " +
        (active ? "bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.55)]" : "bg-slate-500/80")
      );
    }
    return (
      "h-2 w-2 shrink-0 rounded-full " +
      (active ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]" : "bg-slate-400/70")
    );
  };

  const addToCart = (p) => {
    if (!p) return;
    if (!canAddModelToCart(p)) {
      setToast("Mô hình này hiện không thể thêm (hết hàng / ngừng bán).");
      window.clearTimeout(addToCart._t);
      addToCart._t = window.setTimeout(() => setToast(""), 2000);
      return;
    }
    const cart = getCartItemsSafe();
    const pid = String(p._id ?? p.id ?? "");
    const existing = cart.find((i) => String(i.productId) === pid);
    if (existing) {
      const next = existing.quantity + 1;
      existing.quantity = p.stock != null ? Math.min(next, p.stock) : next;
      if (!existing.imageUrl) existing.imageUrl = getProductImageUrl(p);
    } else {
      cart.push({
        productId: pid,
        name: p.name,
        price: p.price,
        quantity: 1,
        variantLabel: p.variantLabel || "",
        availability: p.availability || "in_stock",
        imageUrl: getProductImageUrl(p)
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    openCart();
  };

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-xl text-sm font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-200 shadow-lg">
            {toast}
          </div>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-200">Danh mục mô hình</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar lọc - giống MYKINGDOM */}
        <aside className="lg:w-64 shrink-0">
          <div className={sidebarClass + " space-y-5 sticky top-20 lg:top-24"}>
            <div>
              <button
                type="button"
                className={
                  "lg:hidden flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 mb-2 border transition " +
                  (theme === "dark"
                    ? "border-slate-700/90 bg-slate-900/70 hover:bg-slate-800/90"
                    : "border-rose-200 bg-white hover:bg-rose-50/90 shadow-sm")
                }
                onClick={() =>
                  setMobileFilterOpen((s) => ({ ...s, category: !s.category }))
                }
                aria-expanded={mobileFilterOpen.category}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-cyan-400/90">
                  Dòng sản phẩm
                </span>
                <ChevronDownIcon
                  className={
                    "h-5 w-5 shrink-0 transition-transform duration-300 ease-out " +
                    (mobileFilterOpen.category ? "rotate-180" : "rotate-0") +
                    (theme === "dark" ? " text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.35)]" : " text-rose-600")
                  }
                />
              </button>
              <h3 className="hidden lg:block text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-cyan-400/90 mb-2">
                Dòng sản phẩm
              </h3>
              <div
                className={
                  (mobileFilterOpen.category ? "block " : "hidden ") + "lg:block"
                }
              >
                <div className={filterListShell}>
                  <ul className="space-y-0.5 p-0.5">
                    <li>
                      <button
                        type="button"
                        onClick={() => setCategory("")}
                        className={filterItemClass(!category)}
                      >
                        <span
                          className={
                            "h-1.5 w-1.5 shrink-0 rounded-full " +
                            (!category
                              ? theme === "dark"
                                ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                : "bg-rose-500"
                              : "bg-slate-500/40 dark:bg-slate-600")
                          }
                          aria-hidden
                        />
                        Tất cả
                      </button>
                    </li>
                    {categories.map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={() => setCategory(c)}
                          className={filterItemClass(category === c)}
                        >
                          <span
                            className={
                              "h-1.5 w-1.5 shrink-0 rounded-full " +
                              (category === c
                                ? theme === "dark"
                                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                  : "bg-rose-500"
                                : "bg-slate-500/40 dark:bg-slate-600")
                            }
                            aria-hidden
                          />
                          <span className="min-w-0 truncate">{c}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                className={
                  "lg:hidden flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 mb-2 border transition " +
                  (theme === "dark"
                    ? "border-slate-700/90 bg-slate-900/70 hover:bg-slate-800/90"
                    : "border-rose-200 bg-white hover:bg-rose-50/90 shadow-sm")
                }
                onClick={() =>
                  setMobileFilterOpen((s) => ({ ...s, price: !s.price }))
                }
                aria-expanded={mobileFilterOpen.price}
              >
                <span
                  className={
                    "text-xs font-bold uppercase tracking-wide " +
                    (theme === "dark" ? "text-cyan-400" : "text-rose-600")
                  }
                >
                  GIÁ (đ)
                </span>
                <ChevronDownIcon
                  className={
                    "h-5 w-5 shrink-0 transition-transform duration-300 ease-out " +
                    (mobileFilterOpen.price ? "rotate-180" : "rotate-0") +
                    (theme === "dark" ? " text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.35)]" : " text-rose-600")
                  }
                />
              </button>
              <h3
                className={
                  "hidden lg:block text-xs font-bold uppercase tracking-wide mb-3 " +
                  (theme === "dark" ? "text-cyan-400" : "text-rose-600")
                }
              >
                GIÁ (đ)
              </h3>
              <div
                className={(mobileFilterOpen.price ? "block " : "hidden ") + "lg:block"}
              >
                <div className={priceFilterShell}>
                  <ul className="space-y-2">
                    {["", "0-350000", "350000-700000", "700000-1500000", "1500000-999999999"].map(
                      (range) => {
                        const label =
                          range === ""
                            ? "Tất cả"
                            : range === "1500000-999999999"
                              ? "Trên 1.500.000đ"
                              : range === "0-350000"
                                ? "Dưới 350.000đ"
                                : range
                                    .split("-")
                                    .map((n) => parseInt(n, 10).toLocaleString("vi-VN") + "đ")
                                    .join(" - ");
                        const active = priceRange === range;
                        return (
                          <li key={range || "all"}>
                            <button
                              type="button"
                              onClick={() => setPriceRange(range)}
                              className={priceFilterBtn(active)}
                            >
                              <span className={priceFilterBullet(active)} aria-hidden />
                              <span className="min-w-0 leading-snug">{label}</span>
                            </button>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Nội dung chính - full width grid */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Danh sách mô hình
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:w-44 shrink-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={
                    inputClass +
                    " w-full appearance-none cursor-pointer pr-10 font-medium " +
                    (theme === "dark"
                      ? "hover:border-cyan-500/40"
                      : "hover:border-rose-300")
                  }
                  aria-label="Sắp xếp sản phẩm"
                >
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="newest">Mới nhất</option>
                </select>
                <ChevronDownIcon
                  className={
                    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-90 " +
                    (theme === "dark"
                      ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.25)]"
                      : "text-rose-600")
                  }
                />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm (vd: Gundam, figure...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass + " sm:w-56"}
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-300 py-8">Đang tải sản phẩm...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <p className="text-6xl mb-3">🔍</p>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Không tìm thấy sản phẩm nào</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Thử đổi từ khóa hoặc bộ lọc</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {filtered.length} mô hình (figure, kit, blind box…)
              </p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {filtered.map((p) => (
                  <Link key={p._id} to={`/products/${p._id}`} className={cardClass}>
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800/80 overflow-hidden relative">
                      {p.featured && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold bg-rose-500 text-white z-10">
                          MỚI
                        </span>
                      )}
                      <span
                        className={
                          "absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold z-10 " +
                          getAvailabilityBadgeClass(getEffectiveAvailability(p), theme)
                        }
                      >
                        {AVAILABILITY_LABELS[getEffectiveAvailability(p)] || AVAILABILITY_LABELS.in_stock}
                      </span>
                      <ProductCardHoverImage
                        product={p}
                        alt={p.name}
                        className="absolute inset-0"
                      />
                    </div>
                    <div className="p-3 sm:p-4 space-y-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {p.brand || p.category}
                      </p>
                      <h3 className="text-sm font-semibold line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-cyan-300">
                        {p.name}
                      </h3>
                      {p.variantLabel && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-500 line-clamp-1">{p.variantLabel}</p>
                      )}
                      <p className="text-base font-bold text-rose-600 dark:text-cyan-400">
                        {p.price?.toLocaleString("vi-VN")} ₫
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        disabled={!canAddModelToCart(p)}
                        className={
                          "inline-block mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold " +
                          (canAddModelToCart(p)
                            ? theme === "dark"
                              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                              : "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-slate-400 text-slate-200 cursor-not-allowed dark:bg-slate-700")
                        }
                      >
                        {canAddModelToCart(p)
                          ? "Thêm vào giỏ"
                          : isSoldOutByStock(p)
                            ? "Hết hàng"
                            : "Không thể đặt"}
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
