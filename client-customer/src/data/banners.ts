export interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  primaryHref: string;
  secondaryHref: string;
}

export const banners: Banner[] = [
  {
    id: "hero-gundam",
    eyebrow: "Premium Gunpla Drop",
    title: "Build Your Ultimate Gundam Collection",
    subtitle: "PG, MG, RG chính hãng cho builder và collector nghiêm túc.",
    description:
      "Khám phá các mẫu Gunpla nổi bật, hàng pre-order mới và combo tools được đóng gói an toàn, giao nhanh toàn quốc.",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=85&w=1800",
    primaryHref: "/products",
    secondaryHref: "/products?status=pre-order"
  },
  {
    id: "hero-figure",
    eyebrow: "Anime Collectibles",
    title: "Figure Chính Hãng Cho Tủ Trưng Bày Cao Cấp",
    subtitle: "Megahouse, Kotobukiya, Good Smile Company và nhiều thương hiệu Nhật.",
    description:
      "Sản phẩm có box đẹp, thông tin rõ ràng, phù hợp làm quà tặng hoặc nâng cấp góc sưu tầm cá nhân.",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=85&w=1800",
    primaryHref: "/products?category=Figure Anime",
    secondaryHref: "/products?sort=best-seller"
  }
];
