import { resolvePublicUrl } from "./publicUrl.js";

/**
 * Ảnh theo danh mục – đúng với loại sản phẩm (Unsplash, free).
 * Key = category (tiếng Việt hoặc tiếng Anh), value = URL ảnh.
 */
const IMAGE_BY_CATEGORY = {
  Gundam: "https://images.unsplash.com/photo-1612400200701-847d015ba101?w=800", // Gundam RX-78-2 model
  Figure: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800", // anime figure
  Anime: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
  Lego: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800", // Lego
  Game: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800", // game/collectible
  Manga: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
  Collectible: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800", // robot/collectible
  Diorama: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800", // miniature scene
  "Phụ kiện": "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800", // tools/paint
};

/**
 * Trả về URL ảnh sản phẩm: ưu tiên ảnh trong DB, không có thì dùng ảnh đúng theo danh mục (category).
 * @param {{ name?: string, category?: string, images?: string[] }} product
 * @returns {string}
 */
export function getProductImageUrl(product) {
  const raw = product?.images?.[0];
  if (raw) return resolvePublicUrl(raw);
  const category = String(product?.category || "").trim();
  const url = IMAGE_BY_CATEGORY[category];
  if (url) return url;
  return IMAGE_BY_CATEGORY.Figure || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800";
}

/**
 * Danh sách URL ảnh (đã resolve) — dùng gallery / hover thẻ sản phẩm.
 * @param {{ images?: string[] } | null | undefined} product
 * @returns {string[]}
 */
export function getProductGalleryUrls(product) {
  if (!product) return [];
  if (product.images?.length) return product.images.map((u) => resolvePublicUrl(u));
  return [getProductImageUrl(product)];
}
