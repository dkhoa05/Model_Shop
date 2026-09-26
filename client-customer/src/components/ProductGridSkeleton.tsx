/** Khung xương đúng hình dạng thẻ sản phẩm (thay cho spinner) */
export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" role="status" aria-label="Đang tải sản phẩm">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-6 w-28" />
            <div className="skeleton h-11 w-full" />
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}
