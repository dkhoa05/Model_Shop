import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionTitleProps {
  id?: string;
  title: string;
  accent?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  /** giữ để tương thích, không còn dùng */
  eyebrow?: string;
  tone?: "light" | "dark";
}

/** Tiêu đề mục: một thông điệp, chữ thường (dễ đọc), mô tả ngắn phía dưới, liên kết hành động ở bên phải */
export default function SectionTitle({ id, title, accent, description, href, actionLabel }: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
          {title} {accent && <span className="text-accent-text">{accent}</span>}
        </h2>
        {description && <p className="mt-2 text-base leading-7 text-zinc-400">{description}</p>}
      </div>
      {href && actionLabel && (
        <Link href={href} className="group inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent-text">
          <span className="underline decoration-accent-text/30 underline-offset-4 group-hover:decoration-accent-text">{actionLabel}</span>
          <ArrowRight size={16} aria-hidden className="transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
