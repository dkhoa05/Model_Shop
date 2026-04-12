import { Routes, Route, Link } from "react-router-dom";
import CartDrawer from "./components/CartDrawer.jsx";
import UserAvatar from "./components/UserAvatar.jsx";
import { useCartDrawer } from "./context/CartDrawerContext.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { openCart, cartButtonRef } = useCartDrawer();

  return (
    <div
      className={
        "min-h-screen flex flex-col transition-colors " +
        (theme === "dark"
          ? "dark bg-slate-950 text-slate-100"
          : "bg-rose-50 text-slate-900")
      }
    >
      <header
        className={
          "sticky top-0 z-40 border-b transition-colors w-full " +
          (theme === "dark"
            ? "border-slate-800 bg-slate-900/95 backdrop-blur"
            : "border-rose-200 bg-rose-600 shadow-md")
        }
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            to="/"
            className={
              "text-xl font-bold tracking-tight shrink-0 " +
              (theme === "dark" ? "text-cyan-400" : "text-white")
            }
          >
            Model Shop
          </Link>
          <nav className="flex items-center gap-3 text-sm flex-wrap justify-end">
            <Link
              to="/"
              className={theme === "dark" ? "hover:text-cyan-300 text-slate-300" : "text-white/95 hover:text-white"}
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={theme === "dark" ? "hover:text-cyan-300 text-slate-300" : "text-white/95 hover:text-white"}
            >
              Sản phẩm
            </Link>
            <button
              ref={cartButtonRef}
              type="button"
              onClick={openCart}
              className={
                (theme === "dark" ? "hover:text-cyan-300 text-slate-300" : "text-white/95 hover:text-white") +
                " bg-transparent border-0 cursor-pointer text-sm p-0 font-inherit"
              }
            >
              Giỏ hàng
            </button>
            {user && (
              <>
                <Link
                  to="/orders"
                  className={theme === "dark" ? "hover:text-cyan-300 text-slate-300" : "text-white/95 hover:text-white"}
                >
                  Đơn hàng
                </Link>
                <Link
                  to="/profile"
                  className={theme === "dark" ? "hover:text-cyan-300 text-slate-300" : "text-white/95 hover:text-white"}
                >
                  Tài khoản
                </Link>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <span
                  className={
                    "px-2 py-0.5 rounded text-xs font-medium " +
                    (theme === "dark" ? "bg-amber-500/20 text-amber-300" : "bg-white/20 text-white")
                  }
                >
                  Quản trị
                </span>
                <a
                  href="http://localhost:5174"
                  className={theme === "dark" ? "hover:text-cyan-300 text-slate-300" : "text-white/95 hover:text-white"}
                >
                  Mở Admin
                </a>
              </>
            )}
            {user && user.role !== "admin" && (
              <span
                className={
                  "px-2 py-0.5 rounded text-xs font-medium " +
                  (theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/20 text-white")
                }
              >
                Khách hàng
              </span>
            )}
            {/* Theme toggle removed: UI locked to a single professional theme */}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 shrink-0 rounded-full outline-none ring-offset-2 ring-offset-transparent focus-visible:ring-2 focus-visible:ring-white/70"
                  title="Tài khoản"
                >
                  <UserAvatar src={user.avatarUrl} name={user.name} sizeClass="w-9 h-9" />
                </Link>
                <span className={"text-xs " + (theme === "dark" ? "text-slate-300" : "text-white/90")}>
                  Xin chào, <span className="font-medium text-white">{user.name}</span>
                </span>
                <button
                  onClick={logout}
                  className={
                    "px-2 py-1 rounded-lg border text-xs " +
                    (theme === "dark"
                      ? "border-slate-600 text-slate-300 hover:border-red-400 hover:text-red-300"
                      : "border-white/40 text-white hover:bg-white/20")
                  }
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className={theme === "dark" ? "text-xs text-slate-300 hover:text-cyan-300" : "text-xs text-white/90 hover:text-white"}
                >
                  Đăng ký
                </Link>
                <Link
                  to="/login"
                  className={
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition " +
                    (theme === "dark"
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "bg-white text-rose-600 hover:bg-rose-50")
                  }
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={<NotFoundPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      <footer
        className={
          "border-t transition-colors w-full mt-auto " +
          (theme === "dark"
            ? "border-slate-800 bg-slate-900 text-slate-400"
            : "border-rose-200 bg-slate-100 text-slate-600")
        }
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Model Shop
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Chuyên figure, kit mô hình (Gundam/Gunpla), blind box và phụ kiện trưng bày. Đóng gói chống sốc, giao nhanh.
              </p>
              <div className="pt-2 space-y-1 text-sm">
                <p>
                  <span className="text-slate-500 dark:text-slate-500">Hotline:</span>{" "}
                  <a className="hover:text-rose-600 dark:hover:text-cyan-400 transition" href="tel:0900000000">
                    0900 000 000
                  </a>
                </p>
                <p>
                  <span className="text-slate-500 dark:text-slate-500">Email:</span>{" "}
                  <a className="hover:text-rose-600 dark:hover:text-cyan-400 transition" href="mailto:support@modelshop.vn">
                    support@modelshop.vn
                  </a>
                </p>
                <p className="text-slate-500 dark:text-slate-500">
                  Giờ làm việc: 09:00 – 21:00 (T2–CN)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Liên kết nhanh
              </p>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/products" className="hover:text-rose-600 dark:hover:text-cyan-400 transition">
                    Sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-rose-600 dark:hover:text-cyan-400 transition">
                    Giỏ hàng
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-rose-600 dark:hover:text-cyan-400 transition">
                    Đơn hàng
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-rose-600 dark:hover:text-cyan-400 transition">
                    Tài khoản
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Chính sách
              </p>
              <ul className="space-y-1 text-sm">
                <li className="opacity-90">Chính sách bảo mật</li>
                <li className="opacity-90">Điều khoản dịch vụ</li>
                <li className="opacity-90">Đổi trả & hoàn tiền</li>
                <li className="opacity-90">Vận chuyển</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Cửa hàng
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                123 Đường ABC, Phường 1, Quận 1, TP.HCM
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Gợi ý: bạn có thể thay địa chỉ/hotline theo thông tin thật.
              </p>
              <div className="pt-2 flex items-center gap-3 text-sm">
                <a className="hover:text-rose-600 dark:hover:text-cyan-400 transition" href="#" aria-label="Facebook">
                  Facebook
                </a>
                <a className="hover:text-rose-600 dark:hover:text-cyan-400 transition" href="#" aria-label="Instagram">
                  Instagram
                </a>
                <a className="hover:text-rose-600 dark:hover:text-cyan-400 transition" href="#" aria-label="TikTok">
                  TikTok
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-rose-200 dark:border-slate-700 mt-8 pt-4 text-center text-xs text-slate-500 dark:text-slate-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                © {new Date().getFullYear()} Model Shop. Đồ án NodeJS + React + MongoDB.
              </span>
              <span className="opacity-75">
                Thanh toán đơn mô hình: COD • Chuyển khoản • MoMo / ZaloPay
              </span>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
