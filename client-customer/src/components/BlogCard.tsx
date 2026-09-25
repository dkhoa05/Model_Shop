import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { BlogPost } from "@/data/blogs";

export default function BlogCard({ blog }: { blog: BlogPost }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-1 hover:border-red-500/40 hover:shadow-neon-red">
      <Link href={`/blog/${blog.slug}`} className="block aspect-[16/10] overflow-hidden bg-zinc-950">
        <img
          src={blog.image}
          alt={blog.title}
          className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          loading="lazy"
        />
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500">
          <span className="rounded-md bg-red-500/10 px-2 py-1 text-red-300">{blog.tag}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} />
            {new Date(blog.date).toLocaleDateString("vi-VN")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {blog.readTime}
          </span>
        </div>
        <Link href={`/blog/${blog.slug}`}>
          <h3 className="mt-4 font-space-grotesk text-lg font-black leading-tight text-white transition group-hover:text-red-400">
            {blog.title}
          </h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{blog.excerpt}</p>
      </div>
    </article>
  );
}
