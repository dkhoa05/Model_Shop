import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  tone?: "light" | "dark";
}

export default function SectionTitle({ eyebrow, title, accent, description, href, actionLabel, tone = "dark" }: SectionTitleProps) {
  const light = tone === "light";

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className={`mb-2 text-xs font-black uppercase tracking-[0.24em] ${light ? "text-zinc-500" : "text-red-400"}`}>{eyebrow}</p>}
        <h2 className={`font-space-grotesk text-3xl font-black uppercase tracking-tight sm:text-4xl ${light ? "text-zinc-950" : "text-white"}`}>
          {title} {accent && <span className="text-red-500">{accent}</span>}
        </h2>
        {description && <p className={`mt-2 text-sm leading-6 ${light ? "text-zinc-600" : "text-zinc-400"}`}>{description}</p>}
      </div>

      {href && actionLabel && (
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-red-400 hover:text-red-300">
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
