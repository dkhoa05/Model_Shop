import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";
import { ORDER_STATUS_LABELS, getStatusClass } from "../lib/orderStatus.js";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const found = res.data.find((o) => o._id === id);
        setOrder(found || null);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (!token) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">Bạn cần đăng nhập để xem đơn hàng.</p>
    );
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải...</p>;
  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Không tìm thấy đơn hàng.</p>
        <Link to="/orders" className="text-rose-600 dark:text-cyan-400 hover:underline mt-2 inline-block">
          ← Quay lại đơn hàng
        </Link>
      </div>
    );
  }

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
      : "rounded-2xl border border-rose-200 bg-white p-4 sm:p-5 shadow-sm";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/orders" className="hover:text-rose-600 dark:hover:text-cyan-400">Đơn hàng</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-200">Chi tiết</span>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Chi tiết đơn hàng
      </h2>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mã đơn: <span className="font-mono text-slate-700 dark:text-slate-200">{order._id}</span>
          </span>
          <span className={getStatusClass(order.status, theme)}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        <div className="space-y-2 text-sm border-t border-rose-200 dark:border-slate-700 pt-4">
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Địa chỉ giao hàng:</span>{" "}
            {order.address}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Số điện thoại:</span>{" "}
            {order.phone}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="border-t border-rose-200 dark:border-slate-700 pt-4 mt-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Sản phẩm</p>
          <ul className="space-y-2">
            {order.items.map((i) => (
              <li
                key={i._id}
                className="flex justify-between text-sm text-slate-600 dark:text-slate-300"
              >
                <span>
                  {i.product?.name || "Sản phẩm"} × {i.quantity}
                </span>
                <span>{(i.price * i.quantity).toLocaleString("vi-VN")} ₫</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100 mt-3 pt-3 border-t border-rose-200 dark:border-slate-700">
            <span>Tổng cộng</span>
            <span className="text-rose-600 dark:text-cyan-400">
              {order.totalPrice.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
      </div>

      <Link
        to="/orders"
        className={
          "inline-block px-4 py-2 rounded-xl text-sm font-medium " +
          (theme === "dark"
            ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
            : "bg-rose-100 text-rose-700 hover:bg-rose-200")
        }
      >
        ← Quay lại danh sách đơn hàng
      </Link>
    </div>
  );
}
