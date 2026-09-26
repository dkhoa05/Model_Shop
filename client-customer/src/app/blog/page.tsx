import type { Metadata } from "next";
import BlogCard from "@/components/BlogCard";
import { blogs } from "@/data/blogs";

export const metadata: Metadata = {
  title: "Blog Gundam, Figure và Collectibles",
  description: "Hướng dẫn chọn Gundam, phân biệt grade Gunpla và bảo quản figure anime cho người sưu tầm.",
  keywords: ["blog Gundam", "hướng dẫn Gunpla", "bảo quản figure", "HG RG MG PG"]
};

export default function BlogPage() {
  const [first, ...rest] = blogs;
  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Góc builder</h1>
        <p className="mt-3 text-base leading-7 text-zinc-400">Kiến thức chọn sản phẩm, hướng dẫn build và mẹo bảo quản collectibles để bạn mua đúng ngay từ đầu.</p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {first && <BlogCard blog={first} featured />}
        <div className="grid content-start gap-4">
          {rest.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </div>
    </div>
  );
}
