export const siteConfig = {
  name: "ModelShop",
  url: "https://modelshop.vn",
  description:
    "ModelShop bán mô hình Gundam, Figure Anime, Model Kit và Collectibles chính hãng với trải nghiệm mua hàng hiện đại.",
  contact: {
    address: "24 Nguyễn Trãi, Quận 1, TP.HCM",
    phone: "0900 000 000",
    email: "support@modelshop.vn",
    hours: "09:00 - 21:00, Thứ 2 đến Chủ nhật"
  },
  social: {
    facebook: "#",
    instagram: "#"
  }
};

export const mainNavigation = [
  { label: "Gundam", href: "/products?category=Gundam" },
  { label: "Figure", href: "/products?category=Figure Anime" },
  { label: "Model Kit", href: "/products?category=Gundam" },
  { label: "Tools", href: "/products?category=Tools & Accessories" },
  { label: "Pre-order", href: "/products?status=pre-order" },
  { label: "Sale", href: "/products?badge=sale" },
  { label: "Blog", href: "/blog" }
];

export const footerNavigation = [
  {
    title: "Danh mục",
    links: [
      { label: "Gundam HG", href: "/products?grade=HG" },
      { label: "Gundam MG", href: "/products?grade=MG" },
      { label: "Figure Anime", href: "/products?category=Figure Anime" },
      { label: "Pre-order", href: "/products?status=pre-order" }
    ]
  },
  {
    title: "Chính sách",
    links: [
      { label: "Hướng dẫn mua hàng", href: "/about" },
      { label: "Bảo hành / đổi trả", href: "/about" },
      { label: "Vận chuyển", href: "/about" },
      { label: "Thanh toán", href: "/checkout" }
    ]
  }
];
