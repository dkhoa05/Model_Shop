import { BadgeType } from "@/data/products";

const badgeStyles: Record<BadgeType, string> = {
  new: "bg-emerald-400 text-zinc-950",
  hot: "bg-amber-400 text-zinc-950",
  sale: "bg-red-600 text-white",
  "pre-order": "bg-cyan-400 text-zinc-950",
  limited: "bg-violet-500 text-white"
};

export default function Badge({ text, type }: { text: string; type: BadgeType }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${badgeStyles[type]}`}>{text}</span>;
}
