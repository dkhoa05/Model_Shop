import { LucideIcon } from "lucide-react";

export default function MetricCard({ label, value, icon: Icon, tone = "text-red-300" }: { label: string; value: string; icon: LucideIcon; tone?: string }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
      <Icon className={tone} size={26} />
      <p className="mt-5 text-sm font-bold text-zinc-400">{label}</p>
      <p className="mt-2 font-space-grotesk text-3xl font-black text-white">{value}</p>
    </article>
  );
}
