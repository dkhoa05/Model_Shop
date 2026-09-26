import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import Button from "@/components/Button";
import CategoryCard from "@/components/CategoryCard";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import ProductImage from "@/components/ProductImage";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import { blogs } from "@/data/blogs";
import { categories } from "@/data/categories";
import { getProductsSafe } from "@/lib/products";
import { getCheckoutConfigSafe } from "@/lib/checkoutConfig";
import { formatVND } from "@/utils/currency";

const BRANDS = ["Bandai Spirits", "Kotobukiya", "Megahouse", "Good Smile Company", "Banpresto", "Tamiya", "Max Factory", "Hobby Japan"];

// Nhịp lưới danh mục: ô rộng xen ô hẹp, 3 kiểu nền
const CATEGORY_LAYOUT: { tone: "accent" | "surface" | "outline"; span: string }[] = [
  { tone: "accent", span: "lg:col-span-2" },
  { tone: "surface", span: "" },
  { tone: "outline", span: "" },
  { tone: "surface", span: "" },
  { tone: "outline", span: "" },
  { tone: "surface", span: "lg:col-span-2" },
  { tone: "surface", span: "lg:col-span-2" },
  { tone: "outline", span: "lg:col-span-2" }
];

export default async function HomePage() {
  const [products, checkoutConfig] = await Promise.all([getProductsSafe(), getCheckoutConfigSafe()]);
  const featured = products.filter((p) => p.badge?.type === "hot" || p.status === "limited").slice(0, 8);
  const featuredList = featured.length >= 4 ? featured : products.slice(0, 8);
  const newArrivals = products.slice(0, 10);
  const bestSellers = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
  const preOrders = products.filter((p) => p.status === "pre-order").slice(0, 4);
  const policies = [
    { icon: Truck, title: "Miễn phí vận chuyển", text: `Cho đơn từ ${formatVND(checkoutConfig.freeShippingThreshold)}` },
    { icon: RotateCcw, title: "Đổi trả trong 7 ngày", text: "Với sản phẩm lỗi sản xuất" },
    { icon: ShieldCheck, title: "Cam kết chính hãng", text: "Bandai, Kotobukiya, Megahouse" },
    { icon: PackageCheck, title: "Đóng gói chống sốc", text: "Kiểm tra box trước khi giao" }
  ];

  return (
    <>
      <HeroSection spotlight={featuredList.slice(0, 2)} />

      <div className="container-page space-y-20 py-16 sm:space-y-24 sm:py-20">
        <section aria-label="Chính sách mua hàng">
          <ul className="grid divide-y divide-zinc-800 rounded-[20px] border border-zinc-800 bg-zinc-900/60 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {policies.map((item) => (
              <li key={item.title} className="flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-zinc-800 text-accent-text">
                  <item.icon size={22} aria-hidden />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-fg">{item.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <Reveal>
          <section className="space-y-8" aria-labelledby="cat-title">
            <SectionTitle id="cat-title" title="Mua theo dòng sản phẩm" description="Chọn đúng cấp độ build, thương hiệu và nhu cầu trưng bày." href="/products" actionLabel="Xem tất cả" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, i) => (
                <li key={category.id} className={`flex ${CATEGORY_LAYOUT[i % CATEGORY_LAYOUT.length].span}`}>
                  <CategoryCard category={category} tone={CATEGORY_LAYOUT[i % CATEGORY_LAYOUT.length].tone} className="w-full" />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {featuredList.length > 0 && (
          <Reveal>
            <section className="space-y-8" aria-labelledby="featured-title">
              <SectionTitle id="featured-title" title="Sản phẩm nổi bật" description="Những mẫu kit và figure đang được sưu tầm viên săn đón nhiều nhất." href="/products" actionLabel="Xem tất cả" />
              <div className="-mx-4 sm:-mx-6 lg:-mx-10">
                <ul
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-10"
                  aria-label="Danh sách sản phẩm nổi bật, cuộn ngang để xem thêm"
                  tabIndex={0}
                >
                  {featuredList.map((product) => (
                    <li key={product.id} className="w-[15.5rem] shrink-0 snap-start sm:w-[17rem]">
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </Reveal>
        )}

        <section aria-label="Thương hiệu" className="-mx-4 overflow-hidden border-y border-zinc-800 py-6 sm:-mx-6 lg:-mx-10">
          <p className="sr-only">Thương hiệu phân phối: {BRANDS.join(", ")}</p>
          <div className="flex w-max animate-marquee gap-16 whitespace-nowrap hover:[animation-play-state:paused]" aria-hidden>
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span key={`${brand}-${i}`} className="text-3xl font-extrabold tracking-tight text-zinc-600 sm:text-4xl">
                {brand}
              </span>
            ))}
          </div>
        </section>

        {newArrivals.length > 0 && (
          <Reveal>
            <section className="space-y-8" aria-labelledby="new-title">
              <SectionTitle id="new-title" title="Hàng mới về" description="Cập nhật liên tục theo lịch phát hành từ Nhật Bản." href="/products?sort=newest" actionLabel="Xem tất cả" />
              <ProductGrid products={newArrivals} />
            </section>
          </Reveal>
        )}

        {preOrders.length > 0 && (
          <Reveal>
            <section className="grid overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900 lg:grid-cols-[0.9fr_1.3fr]" aria-labelledby="preorder-title">
              <div className="relative isolate overflow-hidden bg-accent p-8 text-on-accent sm:p-10">
                <div className="absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/15" aria-hidden />
                <h2 id="preorder-title" className="text-3xl font-extrabold leading-tight tracking-tight">
                  Giữ slot sớm cho hàng sắp phát hành
                </h2>
                <p className="mt-4 max-w-md text-base leading-7 opacity-90">Đặt trước để không lỡ các bản MGEX, limited color và figure scale mới.</p>
                <Link href="/products?status=pre-order" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-zinc-950 px-6 text-[15px] font-bold text-zinc-50 transition hover:bg-zinc-800">
                  Xem hàng đặt trước
                  <ArrowRight size={18} aria-hidden />
                </Link>
              </div>
              <ul className="grid gap-px bg-zinc-800 sm:grid-cols-2">
                {preOrders.map((product) => (
                  <li key={product.id} className="bg-zinc-900">
                    <Link href={`/products/${product.slug}`} className="group flex h-full items-center gap-4 p-5 transition hover:bg-zinc-800/60">
                      <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                        <ProductImage src={product.images[0]} alt="" sizes="80px" className="object-cover transition duration-500 group-hover:scale-110" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold leading-snug text-fg">{product.name}</span>
                        <span className="mt-1 block text-sm text-zinc-400">Dự kiến: {product.releaseDate}</span>
                        <span className="mt-1 block text-sm font-bold text-accent-text">{formatVND(product.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        {bestSellers.length > 0 && (
          <Reveal>
            <section className="space-y-8" aria-labelledby="best-title">
              <SectionTitle id="best-title" title="Bán chạy nhất" description="Nhiều đánh giá tốt và dễ chọn cho người mới bắt đầu." />
              <ProductGrid products={bestSellers} ranked />
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="space-y-8" aria-labelledby="blog-title">
            <SectionTitle id="blog-title" title="Góc builder" description="Hướng dẫn chọn kit, dụng cụ và cách bảo quản bộ sưu tập." href="/blog" actionLabel="Đọc blog" />
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <BlogCard blog={blogs[0]} featured />
              <div className="grid content-start gap-4">
                {blogs.slice(1, 4).map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <section className="flex flex-col items-start justify-between gap-6 rounded-[24px] border border-zinc-800 bg-zinc-900 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-fg">Chưa biết bắt đầu từ đâu?</h2>
            <p className="mt-2 max-w-xl text-base leading-7 text-zinc-400">Hỏi trợ lý ModelShop về cấp độ, ngân sách hoặc dòng anime bạn thích để có gợi ý phù hợp.</p>
          </div>
          <Button href="/products">Chọn sản phẩm</Button>
        </section>
      </div>
    </>
  );
}
