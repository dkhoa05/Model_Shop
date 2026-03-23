import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { getProductImageUrl } from "../utils/productImage.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div
        className={
          "rounded-2xl border h-64 md:h-80 overflow-hidden " +
          (theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-rose-200 shadow-sm")
        }
      >
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-cover"
        />
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
