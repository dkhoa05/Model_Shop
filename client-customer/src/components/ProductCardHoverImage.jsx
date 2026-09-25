import { getProductGalleryUrls } from "../utils/productImage.js";

/**
 * Ảnh đại diện thẻ sản phẩm: hover hiển thị ảnh tiếp theo (nếu có).
 * Cần bao trong phần tử có class `group` (ví dụ Link).
 */
export default function ProductCardHoverImage({ product, alt, className = "" }) {
  const urls = getProductGalleryUrls(product);
  const first = urls[0] ?? "";
  const second = urls[1];

  return (
    <div
      className={
        "overflow-hidden transition duration-300 group-hover:scale-105 " +
        (className.trim() ? className : "relative w-full h-full")
      }
    >
      <img
        src={first}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {second ? (
        <img
          src={second}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition duration-300 group-hover:opacity-100"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}
