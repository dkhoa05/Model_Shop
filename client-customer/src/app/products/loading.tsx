import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-10 w-52 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-72 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="h-11 w-56 animate-pulse rounded bg-zinc-800" />
      </div>
      <ProductGridSkeleton count={10} />
    </div>
  );
}
