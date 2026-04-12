import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { getProductImageUrl } from "../utils/productImage.js";
import { resolvePublicUrl } from "../utils/publicUrl.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  const galleryUrls = useMemo(() => {
    if (!product) return [];
    if (product.images?.length) return product.images.map((u) => resolvePublicUrl(u));
    return [getProductImageUrl(product)];
  }, [product]);

  useEffect(() => {
    setActiveImg(0);
  }, [id, product?._id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || (product.stock !== undefined && product.stock <= 0)) return;
    const raw = localStorage.getItem("cart") || "[]";
    const cart = JSON.parse(raw);
    const existing = cart.find((i) => i.productId === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải...</p>;
  if (!product) return <p className="text-sm text-red-500">Không tìm thấy sản phẩm.</p>;

  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const mainImgIdx = galleryUrls.length
    ? Math.min(activeImg, galleryUrls.length - 1)
    : 0;

  return (
    <div className="w-full">
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-rose-600 dark:hover:text-cyan-400">Sản phẩm</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-200 line-clamp-1">{product.name}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <div
          className={
            "rounded-2xl border h-64 md:h-80 overflow-hidden flex items-center justify-center " +
            (theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-rose-200 shadow-sm")
          }
        >
          <img
            src={galleryUrls[mainImgIdx]}
            alt={`${product.name} — ảnh ${mainImgIdx + 1}`}
            className="max-w-full max-h-full w-full h-full object-contain"
          />
        </div>
        {galleryUrls.length > 1 && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Ảnh minh họa ({galleryUrls.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {galleryUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={
                    "rounded-xl overflow-hidden border-2 transition shrink-0 " +
                    (mainImgIdx === i
                      ? theme === "dark"
                        ? "border-cyan-400 ring-2 ring-cyan-500/30"
                        : "border-rose-500 ring-2 ring-rose-300/50"
                      : theme === "dark"
                        ? "border-slate-700 hover:border-slate-500"
                        : "border-rose-200 hover:border-rose-400")
                  }
                  aria-label={`Xem ảnh ${i + 1}`}
                >
                  <img src={url} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{product.name}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loại: <span className="font-medium text-slate-700 dark:text-slate-200">{product.category}</span>
        </p>
        {product.brand && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hãng: <span className="font-medium text-slate-700 dark:text-slate-200">{product.brand}</span>
          </p>
        )}
        <p className="text-2xl font-bold text-rose-600 dark:text-cyan-400">
          {product.price?.toLocaleString("vi-VN")} ₫
        </p>
        {product.stock !== undefined && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tồn kho:{" "}
            <span className={outOfStock ? "text-red-600 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
              {outOfStock ? "Hết hàng" : `${product.stock} sản phẩm`}
            </span>
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
          {product.description || "Chưa có mô tả chi tiết."}
        </p>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={
            "mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition " +
            (outOfStock
              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
              : theme === "dark"
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                : "bg-rose-500 text-white hover:bg-rose-600")
          }
        >
          {outOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>
    </div>
  );
}
