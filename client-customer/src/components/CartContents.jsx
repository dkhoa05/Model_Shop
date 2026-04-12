import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

/**
 * Danh sách giỏ + tổng + nút thanh toán (dùng chung trang /cart và drawer).
 */
export default function CartContents({
  items,
  onQuantityChange,
  onRemove,
  onCheckout,
  compact = false
}) {
  const { theme } = useTheme();

  const total = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );

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
      <div className="text-center py-8 rounded-2xl border border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
        <p className="text-4xl mb-2">🛒</p>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Giỏ hàng đang trống</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Thêm sản phẩm để tiếp tục mua sắm</p>
        <Link to="/products" className={"inline-block mt-4 " + btnPrimary}>
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Giỏ hàng mô hình</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kiểm tra phiên bản và số lượng trước khi thanh toán. Đăng nhập để lưu địa chỉ, dùng mã khuyến mãi và theo dõi đơn.
          </p>
        </>
      )}
      <div className="space-y-3 max-h-[min(60vh,420px)] overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.productId} className={cardClass}>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{item.name}</p>
              {item.variantLabel && (
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Phiên bản: {item.variantLabel}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(Number(item.price) || 0).toLocaleString("vi-VN")} ₫ / mô hình
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={
                  "flex items-center border rounded-lg text-sm " +
                  (theme === "dark" ? "border-slate-700" : "border-rose-200")
                }
              >
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.productId, -1)}
                  className={"px-2 py-1 " + (theme === "dark" ? "hover:bg-slate-800" : "hover:bg-rose-50")}
                >
                  −
                </button>
                <span className={"px-2 py-1 border-x text-xs " + (theme === "dark" ? "border-slate-700" : "border-rose-200")}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.productId, 1)}
                  className={"px-2 py-1 " + (theme === "dark" ? "hover:bg-slate-800" : "hover:bg-rose-50")}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.productId)}
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
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-3 " +
          (theme === "dark" ? "border-slate-800" : "border-rose-200")
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Tổng cộng:{" "}
          <span className="font-bold text-rose-600 dark:text-cyan-400">
            {total.toLocaleString("vi-VN")} ₫
          </span>
        </p>
        <button type="button" onClick={onCheckout} className={btnPrimary}>
          Tiến hành đặt hàng
        </button>
      </div>
    </div>
  );
}
