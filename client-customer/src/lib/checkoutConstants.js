/** Đồng bộ hiển thị với server/src/constants/checkout.js */
export const SHIPPING_FLAT_FEE = 30000;
export const FREE_SHIPPING_THRESHOLD = 500000;

export const COUPON_HINTS = [
  { code: "WELCOME10", desc: "Giảm 10% tối đa 100.000 ₫" },
  { code: "MODEL50K", desc: "Giảm 50.000 ₫ (đơn đủ tiền hàng)" }
];

/** Ước tính giảm giá (trùng logic server) */
export function previewCouponDiscount(code, subtotal) {
  if (!code || typeof code !== "string") return 0;
  const c = code.trim().toUpperCase();
  if (c === "WELCOME10") return Math.min(Math.floor(subtotal * 0.1), 100000);
  if (c === "MODEL50K") return Math.min(50000, subtotal);
  return 0;
}
