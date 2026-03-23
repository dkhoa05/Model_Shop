import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { getProductImageUrl } from "../utils/productImage.js";

export default function HomePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [newProducts, setNewProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [n, h] = await Promise.all([
          api.get("/products/new", { params: { top: 6 } }),
          api.get("/products/hot", { params: { top: 6 } })
        ]);
        if (!mounted) return;
        setNewProducts(n.data || []);
        setHotProducts(h.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      {/* Thanh thông tin trên cùng */}
      <div
        className={
          "w-full py-2 text-center text-xs sm:text-sm " +
          (theme === "dark"
            ? "bg-slate-800 text-slate-300"
            : "bg-rose-700 text-white")
        }
      >
        <span>
          🎁 Miễn phí giao đơn mô hình từ 500K • Figure, Gundam, blind box và phụ kiện sưu tầm chính hãng
        </span>
      </div>

      {/* Hero full width */}
      <section
        className={
          "w-full " +
          (theme === "dark"
            ? "bg-gradient-to-b from-slate-900 to-slate-950"
            : "bg-gradient-to-b from-rose-50 to-white")
        }
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 md:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
                Cửa hàng mô hình{" "}
                <span className={theme === "dark" ? "text-cyan-400" : "text-rose-600"}>
                  Model Shop
                </span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg mb-6 max-w-lg">
                Cửa hàng chuyên mô hình sưu tầm: figure anime, kit Gundam / Gunpla, blind box, action figure và
                phụ kiện trưng bày — phù hợp người chơi mô hình và collector.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className={
                    "px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg " +
                    (theme === "dark"
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "bg-rose-600 text-white hover:bg-rose-700")
                  }
                >
                  Xem danh mục mô hình
                </Link>
                {user?.role === "admin" && (
                  <a
                    href="http://localhost:5174"
                    className={
                      "px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition " +
                      (theme === "dark"
                        ? "border-slate-600 hover:border-cyan-400 text-slate-300"
                        : "border-rose-500 hover:border-rose-600 text-rose-600 dark:text-rose-400")
                    }
                  >
                    Khu vực Admin
                  </a>
                )}
              </div>
            </div>
            <div className="order-1 md:order-2 aspect-[4/3] max-h-[320px] md:max-h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              <div
                className={
                  "w-full h-full flex items-center justify-center " +
                  (theme === "dark"
                    ? "bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-pink-500/20"
                    : "bg-gradient-to-br from-rose-200 to-amber-100")
                }
              >
                <span className="text-slate-500 dark:text-slate-400 text-sm px-4 text-center">
                  Banner / Hình ảnh mô hình
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Khu vực giới thiệu ngắn */}
      <section
        className={
          "w-full py-10 " +
          (theme === "dark" ? "bg-slate-900/50" : "bg-white border-t border-rose-100")
        }
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm border border-rose-100 dark:border-slate-700">
              <p className="text-2xl font-bold text-rose-600 dark:text-cyan-400 mb-1">30+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sản phẩm đa dạng</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm border border-rose-100 dark:border-slate-700">
              <p className="text-2xl font-bold text-rose-600 dark:text-cyan-400 mb-1">Chính hãng</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Bandai, Good Smile, Lego...</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm border border-rose-100 dark:border-slate-700">
              <p className="text-2xl font-bold text-rose-600 dark:text-cyan-400 mb-1">Giao hàng</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Miễn phí đơn từ 500K</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="w-full py-10">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mới nhất</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sản phẩm vừa cập nhật</p>
            </div>
            <Link to="/products" className="text-sm text-cyan-400 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {newProducts.map((p) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition overflow-hidden"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                    <img
                      src={getProductImageUrl(p)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{p.brand || p.category}</p>
                    <p className="text-sm font-semibold text-slate-100 line-clamp-2">{p.name}</p>
                    <p className="text-base font-bold text-cyan-400">{p.price?.toLocaleString("vi-VN")} ₫</p>
                  </div>
                </Link>
              ))}
              {!newProducts.length && (
                <div className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu.</div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="w-full pb-12">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Bán chạy</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Top theo đơn đã giao</p>
            </div>
            <Link to="/products" className="text-sm text-cyan-400 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotProducts.map((p) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition overflow-hidden"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                    <img
                      src={getProductImageUrl(p)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{p.brand || p.category}</p>
                    <p className="text-sm font-semibold text-slate-100 line-clamp-2">{p.name}</p>
                    <p className="text-base font-bold text-cyan-400">{p.price?.toLocaleString("vi-VN")} ₫</p>
                  </div>
                </Link>
              ))}
              {!hotProducts.length && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Chưa có “bán chạy”. Hãy cập nhật trạng thái vài đơn sang <span className="font-semibold">delivered</span> để tính top.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
