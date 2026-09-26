import { Product, ProductStatus } from "@/types/product";

export type ProductSearchParams = Record<string, string | string[] | undefined>;
export type ApiProduct = {
  _id: string;
  name: string;
  price: number;
  category: string;
  brand?: string;
  description?: string;
  variantLabel?: string;
  availability?: "in_stock" | "pre_order" | "limited" | "sold_out";
  images?: string[];
  stock?: number;
  featured?: boolean;
  ratingAvg?: number;
  numReviews?: number;
  createdAt?: string;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const sortOptions = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp đến cao", value: "price-asc" },
  { label: "Giá cao đến thấp", value: "price-desc" },
  { label: "Bán chạy", value: "best-seller" }
] as const;

export const productFilterGroups = [
  {
    title: "Category",
    key: "category",
    values: ["Gundam HG", "Gundam MG", "Gundam RG", "Gundam PG", "Figure Anime", "Tools & Accessories"]
  },
  {
    title: "Grade",
    key: "grade",
    values: ["HG", "RG", "MG", "PG", "MGEX"]
  },
  {
    title: "Availability",
    key: "status",
    values: ["in-stock", "limited", "pre-order", "out-of-stock"]
  }
] as const;

export const priceRanges = [
  { label: "Dưới 700.000₫", value: "0-700000" },
  { label: "700.000₫ - 2.000.000₫", value: "700000-2000000" },
  { label: "Trên 2.000.000₫", value: "2000000-99999999" }
] as const;

export function getParam(searchParams: ProductSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function getParamList(searchParams: ProductSearchParams, key: string): string[] {
  const value = getParam(searchParams, key);
  return value ? value.split(",").filter(Boolean) : [];
}

export function getFilteredProductsFromList(productList: Product[], searchParams: ProductSearchParams): Product[] {
  let result = [...productList];

  const q = getParam(searchParams, "q")?.toLowerCase();
  const categories = getParamList(searchParams, "category");
  const brands = getParamList(searchParams, "brand");
  const grades = getParamList(searchParams, "grade");
  const statuses = getParamList(searchParams, "status");
  const badges = getParamList(searchParams, "badge");
  const price = getParam(searchParams, "price");
  const wishlist = getParam(searchParams, "wishlist");
  const sort = getParam(searchParams, "sort") || "newest";

  if (q) {
    result = result.filter((product) => searchableText(product).includes(q));
  }

  if (categories.length > 0) {
    result = result.filter((product) => categories.some((category) => product.category.includes(category)));
  }

  if (brands.length > 0) {
    result = result.filter((product) => brands.includes(product.brand));
  }

  if (grades.length > 0) {
    result = result.filter((product) => product.grade && grades.includes(product.grade));
  }

  if (statuses.length > 0) {
    result = result.filter((product) => statuses.includes(product.status));
  }

  if (badges.length > 0) {
    result = result.filter((product) => product.badge && badges.includes(product.badge.type));
  }

  if (wishlist === "true") {
    result = result.filter((product) => product.badge?.type === "hot" || product.status === "limited");
  }

  if (price) {
    const [min, max] = price.split("-").map(Number);
    result = result.filter((product) => product.price >= min && product.price <= max);
  }

  return sortProducts(result, sort);
}

export function sortProducts(productList: Product[], sort: string): Product[] {
  return [...productList].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "best-seller") return b.reviewCount - a.reviewCount;
    return b.id.localeCompare(a.id);
  });
}

/** Catalog chỉ lấy từ API/DB. Lỗi → throw để trang hiển thị error boundary (không dùng dữ liệu giả). */
export async function getProductsFromApi(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    next: { revalidate: 30 }
  });

  if (!response.ok) {
    throw new Error(`Products API failed: ${response.status}`);
  }

  const rawProducts = (await response.json()) as ApiProduct[];
  return rawProducts.map(mapApiProduct);
}

/** Dùng cho thành phần không thiết yếu (trang chủ, generateStaticParams…): lỗi API → danh sách rỗng */
export async function getProductsSafe(): Promise<Product[]> {
  try {
    return await getProductsFromApi();
  } catch (error) {
    console.error("[products]", error);
    return [];
  }
}

/** Tìm kiếm gợi ý (client) qua API */
export async function searchProductsFromApi(query: string, limit = 4, signal?: AbortSignal): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const response = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(q)}&limit=${limit}`, { signal });
  if (!response.ok) return [];
  return ((await response.json()) as ApiProduct[]).map(mapApiProduct);
}

export async function getProductBySlugFromApi(slug: string): Promise<Product | undefined> {
  const productList = await getProductsFromApi();
  return productList.find((product) => product.slug === slug || product.id === slug);
}

export async function getProductsByIdsFromApi(ids: string[]): Promise<Product[]> {
  const productList = await getProductsFromApi();
  return ids
    .map((id) => productList.find((product) => product.id === id || product.slug === id))
    .filter(Boolean) as Product[];
}

export function getRelatedProductsFromList(productList: Product[], product: Product, limit = 4): Product[] {
  const sameCategory = productList.filter((item) => item.id !== product.id && item.category === product.category);
  return (sameCategory.length ? sameCategory : productList.filter((item) => item.id !== product.id)).slice(0, limit);
}

function searchableText(product: Product): string {
  return [product.name, product.brand, product.category, product.grade, product.scale, product.badge?.text]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function mapApiProduct(product: ApiProduct): Product {
  const status = mapAvailability(product.availability, product.stock || 0);
  const grade = inferGrade(product.name, product.variantLabel, product.category);
  const slug = `${slugify(product.name)}-${product._id.slice(-6)}`;
  const images = normalizeImages(product.images || []);

  return {
    id: product._id,
    name: product.name,
    slug,
    brand: product.brand || "ModelShop",
    category: product.category || "Collectibles",
    grade,
    scale: inferScale(product.name, product.variantLabel),
    price: product.price,
    images,
    rating: product.ratingAvg || 0,
    reviewCount: product.numReviews || 0,
    stock: product.stock || 0,
    status,
    badge: getBadge(product, status),
    releaseDate: product.createdAt ? new Date(product.createdAt).toLocaleDateString("vi-VN") : "Đang cập nhật",
    description: product.description || "Sản phẩm chính hãng tại ModelShop, được kiểm tra tình trạng box và đóng gói kỹ trước khi giao.",
    specs: {
      brand: product.brand || "ModelShop",
      series: product.variantLabel || product.category || "Collectibles",
      grade: grade || "Collector",
      scale: inferScale(product.name, product.variantLabel) || "Non-scale",
      material: "PVC / ABS / PS",
      releaseDate: product.createdAt ? new Date(product.createdAt).toLocaleDateString("vi-VN") : "Đang cập nhật",
      height: "Theo thông tin nhà sản xuất",
      status: mapStatusLabel(status)
    },
    features: buildFeatures(product, status)
  };
}

function normalizeImages(images: string[]): string[] {
  const normalized = images.filter(Boolean).map((image) => {
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads")) return `${API_BASE_URL}${image}`;
    return image;
  });

  return normalized.length ? normalized : ["https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=1200"];
}

function mapAvailability(availability: ApiProduct["availability"], stock: number): ProductStatus {
  if (availability === "pre_order") return "pre-order";
  if (availability === "limited") return "limited";
  if (availability === "sold_out" || stock <= 0) return "out-of-stock";
  return "in-stock";
}

function getBadge(product: ApiProduct, status: ProductStatus): Product["badge"] {
  if (status === "pre-order") return { text: "Pre-order", type: "pre-order" };
  if (status === "limited") return { text: "Limited", type: "limited" };
  if (product.featured) return { text: "Hot", type: "hot" };
  if ((product.ratingAvg || 0) >= 4.8) return { text: "Hot", type: "hot" };
  return undefined;
}

function inferGrade(...values: Array<string | undefined>): string | undefined {
  const text = values.filter(Boolean).join(" ").toUpperCase();
  return ["MGEX", "PG", "MG", "RG", "HG"].find((grade) => text.includes(` ${grade} `) || text.startsWith(`${grade} `) || text.includes(`${grade} 1/`));
}

function inferScale(...values: Array<string | undefined>): string | undefined {
  const text = values.filter(Boolean).join(" ");
  return text.match(/1\/\d+/)?.[0];
}

function mapStatusLabel(status: ProductStatus): string {
  if (status === "pre-order") return "Đang nhận đặt trước";
  if (status === "limited") return "Còn hàng số lượng giới hạn";
  if (status === "out-of-stock") return "Tạm hết hàng";
  return "Còn hàng";
}

function buildFeatures(product: ApiProduct, status: ProductStatus): string[] {
  return [
    `${product.brand || "ModelShop"} chính hãng, phù hợp trưng bày và sưu tầm lâu dài.`,
    `Tình trạng: ${mapStatusLabel(status).toLowerCase()}, tồn kho hiện tại ${product.stock || 0} sản phẩm.`,
    "Shop kiểm tra box, bọc chống sốc và xác nhận tình trạng trước khi giao.",
    "Hỗ trợ tư vấn build, bảo quản figure/model kit và phụ kiện phù hợp."
  ];
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
