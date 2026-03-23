import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminPaymentConfigPage from "./pages/admin/AdminPaymentConfigPage.jsx";
import AdminReportsPage from "./pages/admin/AdminReportsPage.jsx";
import AdminExpensesPage from "./pages/admin/AdminExpensesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { api } from "./services/api.js";

export default function App() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    if (user?.role !== "admin") return;
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, [user]);

  return (
    <div
      className={
        "min-h-screen flex flex-col transition-colors " +
        (theme === "dark"
          ? "dark bg-slate-950 text-slate-100"
          : "bg-rose-50 text-slate-900")
      }
    >
      <main className="flex-1 w-full">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <header
            className={
              "mb-6 rounded-2xl border p-4 flex items-center justify-between " +
              (theme === "dark"
                ? "border-slate-800 bg-slate-900/40"
                : "border-rose-200 bg-white shadow-sm")
            }
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold " +
                  (theme === "dark" ? "bg-cyan-500/20 text-cyan-300" : "bg-rose-600/10 text-rose-700")
                }
              >
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bảng quản trị</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chỉ dành cho quản trị viên</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={import.meta.env.VITE_CUSTOMER_APP_URL || "http://localhost:5173"}
                target="_blank"
                rel="noreferrer"
                className={theme === "dark" ? "text-xs text-slate-400 hover:text-cyan-300" : "text-xs text-slate-500 hover:text-rose-600"}
              >
                Mở cửa hàng (tab mới)
              </a>
              {/* Theme toggle removed: UI locked to a single professional theme */}
              {user ? (
                <button
                  onClick={logout}
                  className={
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition " +
                    (theme === "dark"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-rose-600 text-white hover:bg-rose-700")
                  }
                >
                  Đăng xuất
                </button>
              ) : (
                <Link
                  to="/login"
                  className={
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition " +
                    (theme === "dark"
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "bg-rose-600 text-white hover:bg-rose-700")
                  }
                >
                  Đăng nhập admin
                </Link>
              )}
            </div>
          </header>

          <div className="grid md:grid-cols-[260px,1fr] gap-6">
            <aside
              className={
                "rounded-2xl border p-3 h-fit " +
                (theme === "dark"
                  ? "border-slate-800 bg-slate-900/40"
                  : "border-rose-200 bg-white shadow-sm")
              }
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">QUẢN TRỊ</p>
              <nav className="space-y-1 text-sm">
                <Link
                  to="/admin/products"
                  className={theme === "dark" ? "block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200" : "block px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700"}
                >
                  Sản phẩm
                </Link>
                <Link
                  to="/admin/orders"
                  className={theme === "dark" ? "block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200" : "block px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700"}
                >
                  Đơn hàng
                </Link>
                <Link
                  to="/admin/users"
                  className={theme === "dark" ? "block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200" : "block px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700"}
                >
                  Khách hàng
                </Link>
                <Link
                  to="/admin/payment-config"
                  className={theme === "dark" ? "block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200" : "block px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700"}
                >
                  Cấu hình thanh toán
                </Link>
                <Link
                  to="/admin/reports"
                  className={theme === "dark" ? "block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200" : "block px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700"}
                >
                  Báo cáo doanh thu
                </Link>
                <Link
                  to="/admin/expenses"
                  className={theme === "dark" ? "block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200" : "block px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700"}
                >
                  Khoản chi
                </Link>
              </nav>
              <div className={"mt-3 pt-3 border-t text-xs " + (theme === "dark" ? "border-slate-800 text-slate-400" : "border-rose-200 text-slate-500")}>
                {user ? (
                  <span>
                    Đăng nhập: <span className="font-medium">{user.email}</span>
                  </span>
                ) : (
                  <span>Vui lòng đăng nhập admin</span>
                )}
              </div>
            </aside>

            <section className="space-y-4">
              {user?.role === "admin" && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400">Doanh thu (đã giao)</p>
                    <p className="text-lg font-semibold text-slate-100 mt-1">
                      {(stats?.revenue?.delivered || 0).toLocaleString("vi-VN")} ₫
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tổng đơn: <span className="font-semibold">{stats?.orders?.total || 0}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400">Khách hàng</p>
                    <p className="text-lg font-semibold text-slate-100 mt-1">
                      {stats?.customers ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Sản phẩm: <span className="font-semibold">{stats?.products ?? "-"}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400">Đơn chờ xử lý</p>
                    <p className="text-lg font-semibold text-slate-100 mt-1">
                      {stats?.orders?.byStatus?.pending ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Đang xử lý: <span className="font-semibold">{stats?.orders?.byStatus?.processing ?? "-"}</span>
                    </p>
                  </div>
                </div>
              )}
          <Routes>
                <Route
                  path="/"
                  element={
                    user?.role === "admin" ? (
                      <Navigate to="/admin/products" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/payment-config"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminPaymentConfigPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/expenses"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminExpensesPage />
                    </ProtectedRoute>
                  }
                />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full mt-auto">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-500">
          Admin Panel • © {new Date().getFullYear()} Model Shop
        </div>
      </footer>
    </div>
  );
}
