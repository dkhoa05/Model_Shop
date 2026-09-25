import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogs } from "@/data/blogs";

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export function generateMetadata({ params }: BlogDetailPageProps): Metadata {
  const blog = blogs.find((item) => item.slug === params.slug);
  return blog
    ? {
        title: blog.title,
        description: blog.excerpt,
        keywords: [blog.tag, blog.category, "ModelShop", "Gundam", "Figure"],
        openGraph: { title: blog.title, description: blog.excerpt, images: [blog.image] }
      }
    : { title: "Không tìm thấy bài viết" };
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const blog = blogs.find((item) => item.slug === params.slug);

  if (!blog) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm font-bold text-zinc-500" aria-label="Breadcrumb">
        Home / Blog / <span className="text-zinc-300">{blog.title}</span>
      </nav>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">{blog.tag}</p>
      <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase leading-tight text-white">{blog.title}</h1>
      <p className="mt-4 text-sm font-bold text-zinc-500">{new Date(blog.date).toLocaleDateString("vi-VN")} · {blog.readTime}</p>
      <img src={blog.image} alt={blog.title} className="mt-8 aspect-[16/9] w-full rounded-xl object-cover" />
      <div className="mt-8 space-y-5 text-base leading-8 text-zinc-300">
        {blog.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
