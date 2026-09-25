import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { blogs } from "@/data/blogs";
import { getProductsSafe } from "@/lib/products";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductsSafe();
  const base = siteConfig.url.replace(/\/$/, "");
  const staticPages = ["", "/products", "/blog", "/about"].map((path) => ({ url: `${base}${path}`, changeFrequency: "daily" as const }));
  return [
    ...staticPages,
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, changeFrequency: "weekly" as const })),
    ...blogs.map((b) => ({ url: `${base}/blog/${b.slug}`, changeFrequency: "monthly" as const }))
  ];
}
