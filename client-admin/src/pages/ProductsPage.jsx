import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { getProductImageUrl } from "../utils/productImage.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ProductsPage() {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sort, setSort] = useState("default");

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
      ? "rounded-xl border border-slate-800 bg-slate-900/50 p-4"
      : "rounded-xl border border-rose-100 bg-white shadow-sm p-4";

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-200">Sản phẩm</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar lọc - giống MYKINGDOM */}
        <aside className="lg:w-64 shrink-0">
          <div className={sidebarClass + " space-y-5 sticky top-4"}>
            <h3 className="font-semibold text-rose-600 dark:text-cyan-400 border-b pb-2 border-rose-200 dark:border-slate-700">
              Danh mục
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => setCategory("")}
                  className={
                    "w-full text-left py-1 px-2 rounded " +
                    (!category
                      ? "bg-rose-100 dark:bg-cyan-500/20 text-rose-700 dark:text-cyan-300 font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800")
                  }
                >
                  Tất cả
                </button>
              </li>
              {categories.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => setCategory(c)}
                    className={
                      "w-full text-left py-1 px-2 rounded " +
                      (category === c
                        ? "bg-rose-100 dark:bg-cyan-500/20 text-rose-700 dark:text-cyan-300 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800")
                    }
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-rose-600 dark:text-cyan-400 border-b pb-2 border-rose-200 dark:border-slate-700 pt-2">
              Giá (₫)
            </h3>
            <ul className="space-y-1.5 text-sm">
              {["", "0-350000", "350000-700000", "700000-1500000", "1500000-999999999"].map(
                (range) => {
                  const label =
                    range === ""
                      ? "Tất cả"
                      : range === "1500000-999999999"
                        ? "Trên 1.500.000₫"
                        : range === "0-350000"
                          ? "Dưới 350.000₫"
                          : range.split("-").map((n) => parseInt(n, 10).toLocaleString("vi-VN") + "₫").join(" - ");
                  return (
                    <li key={range || "all"}>
                      <button
                        onClick={() => setPriceRange(range)}
                        className={
                          "w-full text-left py-1 px-2 rounded " +
                          (priceRange === range
                            ? "bg-rose-100 dark:bg-cyan-500/20 text-rose-700 dark:text-cyan-300 font-medium"
                            : "text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800")
                        }
                      >
                        {label}
                      </button>
                    </li>
                  );
                }
              )}
            </ul>
          </div>
        </aside>

        {/* Nội dung chính - full width grid */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Danh sách mô hình
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={inputClass + " sm:w-40"}
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="newest">Mới nhất</option>
              </select>
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
                {filtered.length} sản phẩm
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
                      <img
                        src={getProductImageUrl(p)}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 sm:p-4 space-y-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {p.brand || p.category}
                      </p>
                      <h3 className="text-sm font-semibold line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-cyan-300">
                        {p.name}
                      </h3>
                      <p className="text-base font-bold text-rose-600 dark:text-cyan-400">
                        {p.price?.toLocaleString("vi-VN")} ₫
                      </p>
                      <span
                        className={
                          "inline-block mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold " +
                          (theme === "dark"
                            ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                            : "bg-rose-600 text-white hover:bg-rose-700")
                        }
                      >
                        Thêm vào giỏ
                      </span>
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
