/** Nhãn tình trạng mô hình — dùng trong danh sách & chi tiết */
export const AVAILABILITY_LABELS = {
  in_stock: "Còn hàng",
  pre_order: "Pre-order",
  limited: "Giới hạn / Limited",
  sold_out: "Hết hàng"
};

/** Tồn kho = 0 (hoặc âm) → luôn coi là hết hàng khi hiển thị badge/nhãn */
export function isSoldOutByStock(product) {
  return Boolean(product && product.stock !== undefined && Number(product.stock) <= 0);
}

/** availability từ DB + quy tắc tồn kho — dùng cho badge trên card & trang chi tiết */
export function getEffectiveAvailability(product) {
  if (isSoldOutByStock(product)) return "sold_out";
  return product?.availability || "in_stock";
}

export function getAvailabilityBadgeClass(availability, theme) {
  const a = availability || "in_stock";
  if (a === "sold_out") return theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700";
  if (a === "pre_order") return theme === "dark" ? "bg-amber-500/25 text-amber-200" : "bg-amber-100 text-amber-900";
  if (a === "limited") return theme === "dark" ? "bg-fuchsia-500/20 text-fuchsia-200" : "bg-fuchsia-100 text-fuchsia-900";
  return theme === "dark" ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-100 text-emerald-800";
}

/** Có thể thêm vào giỏ: không bán khi hết hàng hoặc hết kho */
export function canAddModelToCart(product) {
  if (!product) return false;
  if (product.availability === "sold_out") return false;
  if (product.stock !== undefined && product.stock <= 0) return false;
  return true;
}
