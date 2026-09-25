import type { Metadata } from "next";
import BlogCard from "@/components/BlogCard";
import { blogs } from "@/data/blogs";

export const metadata: Metadata = {
  title: "Blog Gundam, Figure & Collectibles",
  description: "Hướng dẫn chọn Gundam, phân biệt grade Gunpla và bảo quản figure anime cho người sưu tầm.",
  keywords: ["blog Gundam", "hướng dẫn Gunpla", "bảo quản figure", "HG RG MG PG"]
};

export default function BlogPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">ModelShop Journal</p>
        <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">Blog & News</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
          Kiến thức chọn sản phẩm, hướng dẫn build và mẹo bảo quản collectibles để khách hàng có quyết định mua tốt hơn.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-[220px_1fr]">
          <select className="input">
            <option>All categories</option>
            <option>Gunpla</option>
            <option>Figure</option>
          </select>
          <input className="input" placeholder="Search blog..." />
        </div>
      </section>

      <section>
        <h2 className="sr-only">Danh sách bài viết ModelShop</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </section>
    </div>
  );
}
