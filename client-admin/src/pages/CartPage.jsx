import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

export default function CartPage() {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("cart") || "[]";
    setItems(JSON.parse(raw));
  }, []);

  const updateCart = (next) => {
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const handleQuantityChange = (productId, delta) => {
    const next = items
      .map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + delta } : i
      )
      .filter((i) => i.quantity > 0);
    updateCart(next);
  };

  const handleRemove = (productId) => {
    const next = items.filter((i) => i.productId !== productId);
    updateCart(next);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const cardClass =
    theme === "dark"
      ? "flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
      : "flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3 shadow-sm";

  const btnPrimary =
    theme === "dark"
      ? "px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition"
      : "px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition";

  if (!items.length) {
    return (
      <div className="text-center py-12 rounded-2xl border border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
        <p className="text-5xl mb-3">🛒</p>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Giỏ hàng đang trống</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Thêm sản phẩm để tiếp tục mua sắm</p>
        <Link to="/products" className={"inline-block mt-4 " + btnPrimary}>
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Giỏ hàng</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className={cardClass}>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.price.toLocaleString("vi-VN")} ₫ / sản phẩm
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={
                  "flex items-center border rounded-lg text-sm " +
                  (theme === "dark" ? "border-slate-700" : "border-rose-200")
                }
              >
                <button
                  onClick={() => handleQuantityChange(item.productId, -1)}
                  className={"px-2 py-1 " + (theme === "dark" ? "hover:bg-slate-800" : "hover:bg-rose-50")}
                >
                  −
                </button>
                <span className={"px-3 py-1 border-x " + (theme === "dark" ? "border-slate-700" : "border-rose-200")}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.productId, 1)}
                  className={"px-2 py-1 " + (theme === "dark" ? "hover:bg-slate-800" : "hover:bg-rose-50")}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemove(item.productId)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className={
          "flex items-center justify-between border-t pt-3 " +
          (theme === "dark" ? "border-slate-800" : "border-rose-200")
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Tổng cộng:{" "}
          <span className="font-bold text-rose-600 dark:text-cyan-400">
            {total.toLocaleString("vi-VN")} ₫
          </span>
        </p>
        <button onClick={() => navigate("/checkout")} className={btnPrimary}>
          Tiến hành đặt hàng
        </button>
      </div>
    </div>
  );
}
