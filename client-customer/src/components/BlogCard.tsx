import Link from "next/link";
import { BlogPost } from "@/data/blogs";
import SafeImg from "./SafeImg";

/** Bài blog: `featured` là thẻ lớn (ảnh phủ + chữ đè), thẻ thường là ảnh trái chữ phải */
export default function BlogCard({ blog, featured = false }: { blog: BlogPost; featured?: boolean }) {
  const date = new Date(blog.date).toLocaleDateString("vi-VN");

  if (featured) {
    return (
      <article className="group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900">
        <SafeImg src={blog.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" aria-hidden />
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-accent-text">
            {blog.category} · {blog.readTime}
          </p>
          <h3 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight text-zinc-50 sm:text-3xl">
            <Link href={`/blog/${blog.slug}`} className="stretched-link rounded">
              {blog.title}
            </Link>
          </h3>
          <p className="mt-3 max-w-xl text-base leading-7 text-zinc-300">{blog.excerpt}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex gap-4 rounded-[20px] border border-zinc-800 bg-zinc-900 p-3 transition hover:border-zinc-600 sm:p-4">
      <SafeImg src={blog.image} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-32 sm:w-32" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-400">
          {blog.category} · {date}
        </p>
        <h3 className="mt-1.5 text-base font-bold leading-snug text-fg">
          <Link href={`/blog/${blog.slug}`} className="stretched-link rounded group-hover:text-accent-text">
            {blog.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{blog.excerpt}</p>
      </div>
    </article>
  );
}
