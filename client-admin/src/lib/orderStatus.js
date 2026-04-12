export const ORDER_STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy"
};

export function getStatusClass(status, theme) {
  const base = "px-2 py-0.5 rounded text-xs font-semibold uppercase ";
  const map = {
    pending: theme === "dark" ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-800",
    processing: theme === "dark" ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-800",
    shipped: theme === "dark" ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-100 text-cyan-800",
    delivered: theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-800",
    cancelled: theme === "dark" ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-800"
  };
  return base + (map[status] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300");
}
