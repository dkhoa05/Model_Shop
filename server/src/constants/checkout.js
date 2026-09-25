/** Đọc env lúc gọi (dotenv nạp sau khi import) — cấu hình được bằng biến môi trường */
const num = (v, d) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d);

export const storePickupAddress = () =>
  process.env.STORE_PICKUP_ADDRESS ||
  "Nhận tại cửa hàng — 123 Đường ABC, Phường 1, Quận 1, TP.HCM (Giờ: 09:00–21:00)";
export const shippingFlatFee = () => num(process.env.SHIPPING_FLAT_FEE, 30000);
export const freeShippingThreshold = () => num(process.env.FREE_SHIPPING_THRESHOLD, 500000);
export const MAX_ITEM_QUANTITY = 99;
