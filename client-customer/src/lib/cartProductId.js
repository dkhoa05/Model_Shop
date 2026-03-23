/**
 * Chuẩn hóa mã sản phẩm trong giỏ (localStorage) trước khi gọi API đặt hàng.
 */
export function normalizeCartProductId(item) {
  const raw = item?.productId ?? item?.product?._id ?? item?.product;
  if (raw == null || raw === "") return "";
  if (typeof raw === "object") {
    if (raw.$oid != null) return String(raw.$oid).trim();
    if (raw._id != null) return String(raw._id).trim();
    return "";
  }
  return String(raw).trim();
}
