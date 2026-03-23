import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function HomePage() {
  const { theme } = useTheme();
  const { user } = useAuth();

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
        <span>🛒 Miễn phí giao hàng đơn từ 500K • Sưu tầm mô hình, figure chính hãng</span>
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
                Sưu tầm figure, mô hình anime, manga, game, movie với chất lượng cao, giá hợp lý.
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
                  Xem sản phẩm
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/admin/products"
                    className={
                      "px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition " +
                      (theme === "dark"
                        ? "border-slate-600 hover:border-cyan-400 text-slate-300"
                        : "border-rose-500 hover:border-rose-600 text-rose-600 dark:text-rose-400")
                    }
                  >
                    Khu vực Admin
                  </Link>
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
    </div>
  );
}
