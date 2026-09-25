import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories, categoryIcons } from "@/data/categories";

export default function CategoryCard({ category }: { category: (typeof categories)[number] }) {
  const Icon = categoryIcons[category.icon];

  return (
    <Link href={category.href} className="group rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:-translate-y-1 hover:border-red-500/40">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          <Icon size={22} />
        </span>
        <ArrowUpRight className="text-zinc-600 transition group-hover:text-red-400" size={18} />
      </div>
      <h3 className="mt-6 font-space-grotesk text-lg font-black uppercase text-white">{category.name}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{category.description}</p>
    </Link>
  );
}
