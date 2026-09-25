import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import CategoryCard from "@/components/CategoryCard";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import { blogs } from "@/data/blogs";
import { categories } from "@/data/categories";
import { getProductsSafe } from "@/lib/products";
import { getCheckoutConfigSafe } from "@/lib/checkoutConfig";
import { formatVND } from "@/utils/currency";

const buildPromoItems = (freeShipping: number) => [
  { title: "Free shipping", text: `Miễn phí vận chuyển cho đơn hàng từ ${formatVND(freeShipping)}.`, icon: Truck },
  { title: "Đổi trả rõ ràng", text: "Hỗ trợ đổi sản phẩm lỗi sản xuất trong 7 ngày.", icon: RotateCcw },
  { title: "Chính hãng", text: "Cam kết hàng thật từ Bandai, Kotobukiya, Megahouse.", icon: ShieldCheck }
];

export default async function HomePage() {
  const [products, checkoutConfig] = await Promise.all([getProductsSafe(), getCheckoutConfigSafe()]);
  const promoItems = buildPromoItems(checkoutConfig.freeShippingThreshold);
  const featuredProducts = products.filter((product) => product.badge?.type === "hot" || product.status === "limited").slice(0, 5);
  const newArrivals = products.slice(0, 5);
  const bestSellers = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
  const preOrders = products.filter((product) => product.status === "pre-order");

  return (
    <div className="collector-page space-y-16">
      <HeroSection />

      <Reveal>
        <section className="grid gap-4 md:grid-cols-3" aria-label="Chính sách mua hàng nổi bật">
          {promoItems.map((item) => (
            <article key={item.title} className="collector-panel flex gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                <item.icon size={23} />
              </span>
              <div>
                <h2 className="font-space-grotesk text-base font-black uppercase text-white">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{item.text}</p>
              </div>
            </article>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionTitle title="Shop By" accent="Category" description="Tìm đúng dòng mô hình theo cấp độ build, thương hiệu và nhu cầu trưng bày." href="/products" actionLabel="Xem tất cả" />
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionTitle eyebrow="Featured Products" title="Sản Phẩm" accent="Nổi Bật" description="Những mẫu kit và figure đang được collector săn đón nhiều nhất." />
          <ProductGrid products={featuredProducts} />
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionTitle title="New" accent="Arrivals" description="Hàng mới về kho, cập nhật liên tục theo lịch release từ Nhật Bản." href="/products?sort=newest" actionLabel="Xem tất cả" />
          <ProductGrid products={newArrivals} />
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionTitle title="Best" accent="Sellers" description="Các sản phẩm bán chạy, nhiều review tốt và dễ bắt đầu cho người mới." />
          <ProductGrid products={bestSellers} ranked />
        </section>
      </Reveal>

      <Reveal>
        <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-zinc-900/80 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Pre-order Release
              </p>
              <h2 className="font-space-grotesk text-3xl font-black uppercase leading-tight text-white">Giữ slot sớm cho các siêu phẩm sắp phát hành</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Theo dõi ngày dự kiến, số lượng phân bổ và ưu đãi đặt trước cho các mẫu MGEX, limited color và figure scale mới.
              </p>
              <Link href="/products?status=pre-order" className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase text-cyan-300 hover:text-cyan-200">
                Xem lịch pre-order
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {preOrders.map((product) => (
                <article key={product.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <PackageCheck className="text-cyan-300" size={24} />
                  <h3 className="mt-4 font-space-grotesk text-lg font-black text-white">{product.name}</h3>
                  <p className="mt-2 text-sm font-bold text-zinc-400">Dự kiến: {product.releaseDate}</p>
                  <Link href={`/product/${product.slug}`} className="mt-4 inline-flex text-sm font-black text-red-400 hover:text-red-300">
                    Đặt trước ngay
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionTitle title="Góc" accent="Builder" description="Bài viết SEO giúp khách hàng chọn sản phẩm đúng và chăm sóc bộ sưu tập tốt hơn." href="/blog" actionLabel="Đọc blog" />
          <div className="grid gap-5 md:grid-cols-3">
            {blogs.slice(0, 3).map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
