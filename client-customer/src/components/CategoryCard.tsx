import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories, categoryIcons } from "@/data/categories";

type Tone = "accent" | "surface" | "outline";

const tones: Record<Tone, string> = {
  accent: "border-transparent bg-accent text-on-accent",
  surface: "border-zinc-800 bg-zinc-900 text-fg",
  outline: "border-zinc-700 bg-transparent text-fg"
};

/** Ô danh mục: 3 kiểu nền (nhấn / bề mặt / viền) để lưới có nhịp, không lặp một khuôn */
export default function CategoryCard({ category, tone = "surface", className = "" }: { category: (typeof categories)[number]; tone?: Tone; className?: string }) {
  const Icon = categoryIcons[category.icon];
  const onAccent = tone === "accent";

  return (
    <Link
      href={category.href}
      className={`group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-[20px] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-card ${tones[tone]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${onAccent ? "bg-black/10" : "bg-zinc-800 text-accent-text"}`}>
          <Icon size={22} aria-hidden />
        </span>
        <ArrowUpRight size={20} aria-hidden className={`transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${onAccent ? "" : "text-zinc-500 group-hover:text-accent-text"}`} />
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-extrabold leading-tight">{category.name}</h3>
        <p className={`mt-1.5 text-sm leading-6 ${onAccent ? "opacity-80" : "text-zinc-400"}`}>{category.description}</p>
      </div>
    </Link>
  );
}
