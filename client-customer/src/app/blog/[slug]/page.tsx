import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SafeImg from "@/components/SafeImg";
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
    <article className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Đường dẫn" className="text-sm text-zinc-400">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/blog" className="hover:text-fg">Góc builder</Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-fg">{blog.title}</li>
          </ol>
        </nav>
        <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-5xl">{blog.title}</h1>
        <p className="mt-4 text-sm text-zinc-400">
          {blog.category} · {new Date(blog.date).toLocaleDateString("vi-VN")} · {blog.readTime}
        </p>
        <SafeImg src={blog.image} alt="" className="mt-8 aspect-[16/9] w-full rounded-[24px] object-cover" />
        <div className="mt-10 space-y-6 text-lg leading-9 text-zinc-200">
          {blog.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
