import { BadgeType } from "@/types/product";

// Huy hiệu: nhãn chữ (không chỉ dựa vào màu) với cặp màu đạt tương phản AA
const badgeStyles: Record<BadgeType, string> = {
  new: "border border-emerald-400 bg-zinc-950/80 text-emerald-300 backdrop-blur",
  hot: "bg-accent text-on-accent",
  sale: "bg-accent text-on-accent",
  "pre-order": "bg-zinc-100 text-zinc-950",
  limited: "border border-accent bg-zinc-950/80 text-accent-text backdrop-blur"
};

export default function Badge({ text, type }: { text: string; type: BadgeType }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-extrabold leading-none ${badgeStyles[type]}`}>{text}</span>;
}
