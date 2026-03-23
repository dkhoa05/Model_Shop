import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";

export default function CheckoutPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("cart") || "[]";
    setItems(JSON.parse(raw));
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const payloadItems = items.map((i) => ({
        product: i.productId,
        quantity: i.quantity
      }));
      await api.post(`/orders`, { items: payloadItems, address, phone });
      localStorage.removeItem("cart");
      setItems([]);
      setAddress("");
      setPhone("");
      setMessage("Đặt hàng thành công! Bạn có thể kiểm tra trong lịch sử đơn hàng.");
    } catch (err) {
      console.error(err);
      setMessage("Lỗi khi đặt hàng. Hãy đảm bảo bạn đã đăng nhập.");
    }
  };

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const summaryClass =
    theme === "dark"
      ? "space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3"
      : "space-y-3 rounded-2xl border border-rose-200 bg-white p-3 shadow-sm";

  if (!token) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Bạn cần đăng nhập để đặt hàng.</p>;
  }

  if (!items.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Giỏ hàng trống, không thể đặt hàng.</p>;
  }

  return (
    <div className="grid md:grid-cols-[2fr,1.5fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Thông tin đặt hàng
        </h2>
        <div className="space-y-1">
          <label className="text-sm text-slate-600 dark:text-slate-300">Địa chỉ nhận hàng</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass + " min-h-[80px]"}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-600 dark:text-slate-300">Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          className={
            "px-4 py-2 rounded-xl text-sm font-semibold transition " +
            (theme === "dark"
              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              : "bg-rose-500 text-white hover:bg-rose-600")
          }
        >
          Xác nhận đặt hàng
        </button>
        {message && (
          <p className="text-sm text-rose-600 dark:text-cyan-300">{message}</p>
        )}
      </form>

      <div className={summaryClass}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Tóm tắt đơn hàng
        </h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {items.map((i) => (
            <div key={i.productId} className="flex items-center justify-between">
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>{(i.price * i.quantity).toLocaleString("vi-VN")} ₫</span>
            </div>
          ))}
        </div>
        <div
          className={
            "border-t pt-2 flex items-center justify-between text-sm " +
            (theme === "dark" ? "border-slate-800" : "border-rose-200")
          }
        >
          <span className="text-slate-600 dark:text-slate-300">Tổng cộng</span>
          <span className="font-bold text-rose-600 dark:text-cyan-400">
            {total.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      </div>
    </div>
  );
}
