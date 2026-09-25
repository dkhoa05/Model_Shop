import { Bot, Box, Hammer, PackageCheck, Sparkles, Star, Trophy, Zap } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  slug: string;
  href: string;
  description: string;
  icon: keyof typeof categoryIcons;
  accent: "red" | "cyan" | "amber" | "emerald";
}

export const categoryIcons = {
  Bot,
  Box,
  Hammer,
  PackageCheck,
  Sparkles,
  Star,
  Trophy,
  Zap
};

export const categories: Category[] = [
  {
    id: "cat-hg",
    name: "Gundam HG",
    slug: "gundam-hg",
    href: "/products?grade=HG",
    description: "Dễ build, giá tốt, hợp người mới.",
    icon: "Bot",
    accent: "red"
  },
  {
    id: "cat-mg",
    name: "Gundam MG",
    slug: "gundam-mg",
    href: "/products?grade=MG",
    description: "Khung xương đẹp, tỉ lệ 1/100.",
    icon: "Box",
    accent: "cyan"
  },
  {
    id: "cat-rg",
    name: "Gundam RG",
    slug: "gundam-rg",
    href: "/products?grade=RG",
    description: "Chi tiết cao trong kích thước nhỏ.",
    icon: "Zap",
    accent: "amber"
  },
  {
    id: "cat-pg",
    name: "Gundam PG",
    slug: "gundam-pg",
    href: "/products?grade=PG",
    description: "Dòng cao cấp cho collector.",
    icon: "Trophy",
    accent: "emerald"
  },
  {
    id: "cat-figure",
    name: "Figure Anime",
    slug: "figure-anime",
    href: "/products?category=Figure Anime",
    description: "PVC figure chính hãng Nhật Bản.",
    icon: "Star",
    accent: "red"
  },
  {
    id: "cat-tools",
    name: "Tools & Accessories",
    slug: "tools-accessories",
    href: "/products?category=Tools & Accessories",
    description: "Kìm, nhám, decal, phụ kiện build.",
    icon: "Hammer",
    accent: "cyan"
  },
  {
    id: "cat-limited",
    name: "Limited Edition",
    slug: "limited-edition",
    href: "/products?status=limited",
    description: "Hàng hiếm, số lượng phân bổ ít.",
    icon: "Sparkles",
    accent: "amber"
  },
  {
    id: "cat-preorder",
    name: "Pre-order",
    slug: "pre-order",
    href: "/products?status=pre-order",
    description: "Giữ slot sớm cho release mới.",
    icon: "PackageCheck",
    accent: "emerald"
  }
];
