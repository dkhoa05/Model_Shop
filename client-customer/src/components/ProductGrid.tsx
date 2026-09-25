import { Product } from "@/types/product";
import EmptyState from "./EmptyState";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, ranked = false }: { products: Product[]; ranked?: boolean }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy sản phẩm"
        description="Thử bỏ bớt bộ lọc hoặc quay lại danh sách sản phẩm để xem toàn bộ hàng có sẵn."
        actionLabel="Xem tất cả sản phẩm"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 lg:gap-5">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} rank={ranked ? index + 1 : undefined} />
      ))}
    </div>
  );
}
