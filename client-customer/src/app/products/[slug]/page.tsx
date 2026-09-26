import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductGrid from "@/components/ProductGrid";
import ProductInfo from "@/components/ProductInfo";
import ProductReviews from "@/components/ProductReviews";
import { siteConfig } from "@/config/site";
import SectionTitle from "@/components/SectionTitle";
import { getProductBySlugFromApi, getProductsFromApi, getProductsSafe, getRelatedProductsFromList } from "@/lib/products";

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const products = await getProductsSafe();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductBySlugFromApi(params.slug);

  if (!product) {
    return { title: "Không tìm thấy sản phẩm" };
  }

  return {
    title: product.name,
    description: product.description,
    keywords: [product.name, product.brand, product.category, product.grade || "collectible"].filter(Boolean),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images
    }
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const products = await getProductsFromApi();
  const product = products.find((item) => item.slug === params.slug || item.id === params.slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProductsFromList(products, product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.id,
    url: `${siteConfig.url}/products/${product.slug}`,
    ...(product.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: product.price,
      availability: product.status === "out-of-stock" ? "https://schema.org/OutOfStock" : product.status === "pre-order" ? "https://schema.org/PreOrder" : "https://schema.org/InStock"
    }
  };

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Đường dẫn" className="text-sm text-zinc-400">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-fg">Trang chủ</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/products" className="hover:text-fg">Sản phẩm</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-fg">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} productName={product.name} />
        </div>
        <ProductInfo product={product} />
      </div>

      <div className="mt-16 space-y-16">
        <ProductReviews productId={product.id} />

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="space-y-8">
            <SectionTitle id="related-title" title="Có thể bạn cũng thích" description="Các mẫu cùng dòng hoặc cùng nhu cầu trưng bày." />
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </div>
  );
}
