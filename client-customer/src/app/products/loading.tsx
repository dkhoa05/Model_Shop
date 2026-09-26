import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function ProductsLoading() {
  return (
    <div className="container-page space-y-6 py-10" aria-busy="true">
      <div className="skeleton h-5 w-40" />
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-10 w-64" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-11 w-56" />
      </div>
      <ProductGridSkeleton count={10} />
    </div>
  );
}
