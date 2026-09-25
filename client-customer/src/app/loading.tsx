import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-[520px] animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />
      <ProductGridSkeleton count={5} />
    </div>
  );
}
