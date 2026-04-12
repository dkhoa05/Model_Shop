/**
 * Đọc giỏ từ localStorage — an toàn khi JSON hỏng hoặc dữ liệu cũ / không đúng kiểu.
 */
export function getCartItemsSafe() {
  try {
    const raw = localStorage.getItem("cart") || "[]";
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .map((row, i) => {
        if (!row || typeof row !== "object") return null;
        const productId =
          row.productId != null ? String(row.productId) : `unknown-${i}`;
        const price = Number(row.price);
        const qty = Number(row.quantity);
        return {
          productId,
          name: row.name != null ? String(row.name) : "Sản phẩm",
          price: Number.isFinite(price) ? price : 0,
          quantity:
            Number.isFinite(qty) && qty > 0 ? Math.min(9999, Math.floor(qty)) : 1,
          variantLabel: row.variantLabel ? String(row.variantLabel) : "",
          availability: row.availability || "in_stock",
          imageUrl: row.imageUrl ? String(row.imageUrl) : ""
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
