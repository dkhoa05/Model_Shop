/** Địa chỉ nhận khi khách chọn nhận tại cửa hàng */
export const STORE_PICKUP_ADDRESS =
  "Nhận tại cửa hàng — 123 Đường ABC, Phường 1, Quận 1, TP.HCM (Giờ: 09:00–21:00)";

export const SHIPPING_FLAT_FEE = 30000;
export const FREE_SHIPPING_THRESHOLD = 500000;

/**
 * @param {string} code
 * @param {number} subtotal
 * @returns {{ discount: number, normalizedCode: string }}
 */
export function applyCoupon(code, subtotal) {
  if (!code || typeof code !== "string") return { discount: 0, normalizedCode: "" };
  const c = code.trim().toUpperCase();
  if (!c) return { discount: 0, normalizedCode: "" };
  if (c === "WELCOME10") {
    const discount = Math.min(Math.floor(subtotal * 0.1), 100000);
    return { discount, normalizedCode: c };
  }
  if (c === "MODEL50K") {
    const discount = Math.min(50000, subtotal);
    return { discount, normalizedCode: c };
  }
  return { discount: 0, normalizedCode: "" };
}
