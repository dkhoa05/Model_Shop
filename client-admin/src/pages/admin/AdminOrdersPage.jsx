import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";
import { resolvePublicUrl } from "../../utils/publicUrl.js";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_LABELS = {
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  zalopay: "ZaloPay"
};
const PAYMENT_STATUSES = ["unpaid", "paid"];
const PAYMENT_STATUS_LABELS = { unpaid: "Chưa TT", paid: "Đã TT" };

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      alert("Không tải được đơn hàng. Kiểm tra quyền admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchOrders();
  }, [user]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch (err) {
      console.error(err);
      alert("Lỗi cập nhật trạng thái.");
    }
  };

  const updatePayment = async (orderId, paymentStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/payment`, { paymentStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: res.data.paymentStatus, paidAt: res.data.paidAt } : o))
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi cập nhật trạng thái thanh toán.");
    }
  };

  const confirmByProof = async (o) => {
    if (!o?.paymentProofUrl) return;
    if (!window.confirm("Xác nhận đã nhận tiền cho đơn này?")) return;
    await updatePayment(o._id, "paid");
  };

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-3"
      : "rounded-2xl border border-rose-200 bg-white p-3 space-y-3 shadow-sm";

  const selectClass =
    theme === "dark"
      ? "px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:border-cyan-400"
      : "px-2 py-1 rounded-lg bg-white border border-rose-200 text-slate-900 text-xs focus:outline-none focus:border-rose-400";

  if (!user || user.role !== "admin") {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Bạn cần đăng nhập với tài khoản admin để truy cập trang này.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Quản lý đơn hàng (Admin)
        </h2>
        <button
          onClick={fetchOrders}
          className={
            "px-3 py-1.5 rounded-lg border text-xs transition " +
            (theme === "dark"
              ? "border-slate-700 hover:border-cyan-400"
              : "border-rose-300 hover:border-rose-500")
          }
        >
          Tải lại
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải đơn hàng...</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className={cardClass}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>
                    Mã đơn: <span className="text-slate-700 dark:text-slate-200">{o._id}</span>
                  </div>
                  <div>
                    Khách:{" "}
                    <span className="text-slate-700 dark:text-slate-200">
                      {o.user
                        ? `${o.user.name} (${o.user.email})`
                        : `Đặt không đăng nhập — ${o.recipientName || "—"} • ${o.phone || "—"}`}
                    </span>
                  </div>
                  <div>
                    Thanh toán:{" "}
                    <span className="text-slate-700 dark:text-slate-200">
                      {PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod || "cod"}
                    </span>
                  </div>
                  <div>
                    Tạo lúc:{" "}
                    <span className="text-slate-500">
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái</span>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    className={selectClass}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Thanh toán</span>
                <select
                  value={o.paymentStatus || "unpaid"}
                  onChange={(e) => updatePayment(o._id, e.target.value)}
                  className={selectClass}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PAYMENT_STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
                {o.paymentProofUrl && (
                  <>
                    <a
                      href={resolvePublicUrl(o.paymentProofUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-200 hover:border-cyan-400 transition"
                    >
                      Xem bill
                    </a>
                    {o.paymentStatus !== "paid" && (
                      <button
                        type="button"
                        onClick={() => confirmByProof(o)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition"
                      >
                        Duyệt bill
                      </button>
                    )}
                  </>
                )}
              </div>

              {o.paymentProofUrl && (
                <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950/30 max-w-md">
                  <img
                    src={resolvePublicUrl(o.paymentProofUrl)}
                    alt="Minh chứng thanh toán"
                    className="w-full max-h-56 object-contain bg-slate-900/50"
                  />
                </div>
              )}

              <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                {o.items.map((i, idx) => (
                  <div key={`${o._id}-${idx}-${i.product?._id ?? "item"}`} className="flex items-center justify-between">
                    <span className="truncate">
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
                  "border-t pt-2 flex items-center justify-between text-sm " +
                  (theme === "dark" ? "border-slate-800" : "border-rose-200")
                }
              >
                <span className="text-slate-600 dark:text-slate-300">
                  Tổng:{" "}
                  <span className="font-bold text-rose-600 dark:text-cyan-400">
                    {o.totalPrice.toLocaleString("vi-VN")} ₫
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  {o.phone} • {o.address}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
