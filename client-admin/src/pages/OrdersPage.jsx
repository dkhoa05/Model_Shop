import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";
import { ORDER_STATUS_LABELS, getStatusClass } from "../lib/orderStatus.js";

export default function OrdersPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-2"
      : "rounded-2xl border border-rose-200 bg-white p-3 space-y-2 shadow-sm";

  if (!token) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Bạn cần đăng nhập để xem đơn hàng.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Đơn hàng của bạn
      </h2>
      {!orders.length && (
        <div className="text-center py-12 rounded-2xl border border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Chưa có đơn hàng nào</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Đặt hàng ngay để xem lịch sử tại đây</p>
          <Link
            to="/products"
            className={
              "inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold " +
              (theme === "dark" ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-rose-500 text-white hover:bg-rose-600")
            }
          >
            Xem sản phẩm
          </Link>
        </div>
      )}
      <div className="space-y-3 text-sm">
        {orders.map((o) => (
          <Link key={o._id} to={`/orders/${o._id}`} className="block">
            <div className={cardClass + " hover:border-rose-400 dark:hover:border-cyan-500/50 transition"}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mã đơn: <span className="text-slate-700 dark:text-slate-200 font-mono">{o._id.slice(-8)}</span>
              </span>
              <span className={getStatusClass(o.status, theme)}>
                {ORDER_STATUS_LABELS[o.status] || o.status}
              </span>
            </div>
            <div className="space-y-1 text-slate-600 dark:text-slate-300">
              {o.items.map((i) => (
                <div key={i._id} className="flex items-center justify-between">
                  <span>
                    {i.product?.name || "Sản phẩm"} × {i.quantity}
                  </span>
                  <span>
                    {(i.price * i.quantity).toLocaleString("vi-VN")}
                    {" ₫"}
                  </span>
                </div>
              ))}
            </div>
            <div
              className={
                "flex items-center justify-between border-t pt-1 " +
                (theme === "dark" ? "border-slate-800" : "border-rose-200")
              }
            >
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tổng:{" "}
                <span className="font-semibold text-rose-600 dark:text-cyan-400">
                  {o.totalPrice.toLocaleString("vi-VN")} ₫
                </span>
              </span>
              <span className="text-xs text-slate-400">
                {new Date(o.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
