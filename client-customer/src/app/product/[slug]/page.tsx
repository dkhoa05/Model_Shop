import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductGrid from "@/components/ProductGrid";
import ProductInfo from "@/components/ProductInfo";
import SectionTitle from "@/components/SectionTitle";
import {
  getProductBySlugFromApi,
  getProductsFromApi,
  getRecentlyViewedProductsFromList,
  getRelatedProductsFromList
} from "@/lib/products";

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const products = await getProductsFromApi();
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
  const recentlyViewed = getRecentlyViewedProductsFromList(products, product.id);

  return (
    <div className="-mx-4 -my-6 bg-apple-parchment px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 2xl:-mx-16 2xl:px-16">
      <div className="mx-auto max-w-[1440px] space-y-12">
        <nav className="text-sm text-apple-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-2">
            <li>Home</li>
            <li>/</li>
            <li>Products</li>
            <li>/</li>
            <li className="text-apple-ink">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductInfo product={product} />
        </div>

        <section className="rounded-[18px] border border-apple-hairline bg-white p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-apple-ink">Description</h2>
              <p className="mt-4 text-[17px] leading-[1.47] tracking-[-0.374px] text-apple-muted">{product.description}</p>
              <ul className="mt-5 grid gap-3 text-[17px] leading-[1.47] tracking-[-0.374px] text-apple-ink">
                {product.features.map((feature) => (
                  <li key={feature} className="rounded-[18px] bg-apple-parchment p-4">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-apple-ink">Specification</h2>
              <dl className="mt-4 grid gap-3">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-apple-hairline pb-3 text-sm">
                    <dt className="capitalize text-apple-muted">{key}</dt>
                    <dd className="text-right font-semibold text-apple-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: "Shipping & Return",
              text: "Đóng gói chống sốc, kiểm tra box trước khi gửi và hỗ trợ đổi trả theo chính sách shop."
            },
            {
              title: "Reviews",
              text: "Đánh giá demo hiển thị tổng quan rating. Tích hợp review thật sẽ nối backend ở giai đoạn sau."
            },
            {
              title: "Support",
              text: "Tư vấn chọn grade, tools và cách bảo quản sản phẩm trước khi khách chốt đơn."
            }
          ].map((item) => (
            <article key={item.title} className="rounded-[18px] border border-apple-hairline bg-white p-6">
              <h2 className="text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-apple-ink">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-apple-muted">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="space-y-8">
          <SectionTitle title="Related" accent="products" description="Các mẫu cùng dòng hoặc cùng nhu cầu trưng bày." />
          <ProductGrid products={related} />
        </section>

        <section className="space-y-8">
          <SectionTitle title="Recently viewed" accent="products" description="Một vài lựa chọn khác để bạn so sánh nhanh." />
          <ProductGrid products={recentlyViewed} />
        </section>
      </div>
    </div>
  );
}
