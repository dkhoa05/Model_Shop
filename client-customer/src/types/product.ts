export type ProductStatus = "in-stock" | "out-of-stock" | "pre-order" | "limited";
export type BadgeType = "new" | "hot" | "sale" | "pre-order" | "limited";

export interface ProductSpecs {
  brand: string;
  series: string;
  grade: string;
  scale: string;
  material: string;
  releaseDate: string;
  height: string;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  grade?: string;
  scale?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  status: ProductStatus;
  badge?: {
    text: string;
    type: BadgeType;
  };
  releaseDate?: string;
  description: string;
  specs: ProductSpecs;
  features: string[];
}
