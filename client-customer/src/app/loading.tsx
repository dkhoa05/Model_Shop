import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="container-page space-y-8 py-10" aria-busy="true">
      <div className="skeleton h-[28rem] rounded-[28px]" />
      <ProductGridSkeleton count={5} />
    </div>
  );
}
