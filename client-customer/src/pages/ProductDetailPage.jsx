import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { getProductImageUrl } from "../utils/productImage.js";
import { resolvePublicUrl } from "../utils/publicUrl.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCartDrawer } from "../context/CartDrawerContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  AVAILABILITY_LABELS,
  getAvailabilityBadgeClass,
  canAddModelToCart,
  getEffectiveAvailability,
  isSoldOutByStock
} from "../lib/productAvailability.js";
import { getCartItemsSafe } from "../lib/cartStorage.js";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { openCart } = useCartDrawer();
  const { theme } = useTheme();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [numReviews, setNumReviews] = useState(0);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [qty, setQty] = useState(1);
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
        setQty(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const fetchReviews = async () => {
    setReviewLoading(true);
    try {
      const res = await api.get(`/products/${id}/reviews`);
      setReviews(res.data?.reviews || []);
      setRatingAvg(Number(res.data?.ratingAvg || 0));
      setNumReviews(Number(res.data?.numReviews || 0));
      // nếu user đã review, prefill
      const me = (res.data?.reviews || []).find((r) => String(r.user) === String(localStorage.getItem("userId") || ""));
      if (me) {
        setMyRating(Number(me.rating || 5));
        setMyComment(String(me.comment || ""));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const starsText = useMemo(() => {
    const r = Math.round((Number(ratingAvg || 0) + Number.EPSILON) * 10) / 10;
    return `${r}/5 (${numReviews} đánh giá)`;
  }, [ratingAvg, numReviews]);

  const maxQty = product?.stock != null ? Math.max(1, product.stock) : 99;

  const handleAddToCart = () => {
    if (!product || !canAddModelToCart(product)) return;
    const add = Math.min(qty, product.stock != null ? product.stock : qty);
    if (add < 1) return;
    const cart = getCartItemsSafe();
    const pid = String(product._id ?? product.id ?? "");
    const existing = cart.find((i) => String(i.productId) === pid);
    const thumb = galleryUrls[0] || getProductImageUrl(product);
    if (existing) {
      const nextQ = existing.quantity + add;
      existing.quantity =
        product.stock != null ? Math.min(nextQ, product.stock) : nextQ;
      if (!existing.imageUrl) existing.imageUrl = thumb;
    } else {
      cart.push({
        productId: pid,
        name: product.name,
        price: product.price,
        quantity: add,
        variantLabel: product.variantLabel || "",
        availability: product.availability || "in_stock",
        imageUrl: thumb
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    openCart();
  };

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải...</p>;
  if (!product) return <p className="text-sm text-red-500">Không tìm thấy sản phẩm.</p>;

  const outOfStock = !canAddModelToCart(product);
  const canReview = Boolean(token);
  const av = getEffectiveAvailability(product);
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
                  <img
                    src={url}
                    alt=""
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{product.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              "inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold " +
              getAvailabilityBadgeClass(av, theme)
            }
          >
            {AVAILABILITY_LABELS[av] || AVAILABILITY_LABELS.in_stock}
          </span>
        </div>
        {product.variantLabel && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Phiên bản / quy cách:</span>{" "}
            {product.variantLabel}
          </p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Danh mục mô hình: <span className="font-medium text-slate-700 dark:text-slate-200">{product.category}</span>
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
            Tồn kho (có thể đặt):{" "}
            <span className={outOfStock ? "text-red-600 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
              {isSoldOutByStock(product) ? "Hết hàng" : outOfStock ? "Không đặt thêm" : `${product.stock} mô hình`}
            </span>
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
          {product.description || "Chưa có mô tả chi tiết."}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Đánh giá: <span className="font-medium text-slate-700 dark:text-slate-200">{starsText}</span>
        </p>
        {!outOfStock && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-sm text-slate-600 dark:text-slate-300">Số lượng</span>
            <div
              className={
                "flex items-center border rounded-lg text-sm " +
                (theme === "dark" ? "border-slate-700" : "border-rose-200")
              }
            >
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className={"px-2 py-1.5 " + (theme === "dark" ? "hover:bg-slate-800" : "hover:bg-rose-50")}
              >
                −
              </button>
              <span className={"px-4 py-1.5 border-x min-w-[3rem] text-center " + (theme === "dark" ? "border-slate-700" : "border-rose-200")}>
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className={"px-2 py-1.5 " + (theme === "dark" ? "hover:bg-slate-800" : "hover:bg-rose-50")}
              >
                +
              </button>
            </div>
            {product.stock != null && (
              <span className="text-xs text-slate-500">Tối đa {product.stock}</span>
            )}
          </div>
        )}
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
          {outOfStock
            ? isSoldOutByStock(product)
              ? "Hết hàng"
              : "Không thể thêm"
            : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>

      <div
        className={
          "mt-8 rounded-2xl border p-4 sm:p-5 " +
          (theme === "dark" ? "border-slate-800 bg-slate-900/40" : "border-rose-200 bg-white shadow-sm")
        }
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Đánh giá & nhận xét</h3>
          <button
            onClick={fetchReviews}
            className={
              "px-3 py-1.5 rounded-lg text-xs border transition " +
              (theme === "dark" ? "border-slate-700 text-slate-200 hover:border-cyan-400" : "border-rose-300 text-slate-700 hover:border-rose-500")
            }
          >
            Tải lại
          </button>
        </div>

        {reviewMsg && (
          <div className="mb-3 text-sm rounded-xl px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            {reviewMsg}
          </div>
        )}

        {canReview ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setReviewMsg("");
              try {
                await api.post(`/products/${id}/reviews`, { rating: myRating, comment: myComment });
                setReviewMsg("Đã gửi đánh giá. Cảm ơn bạn!");
                fetchReviews();
              } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || "Không thể gửi đánh giá.");
              }
            }}
            className="grid sm:grid-cols-[140px,1fr] gap-3 mb-4"
          >
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Số sao</label>
              <select
                value={myRating}
                onChange={(e) => setMyRating(Number(e.target.value))}
                className={
                  "w-full px-3 py-2 rounded-xl text-sm border focus:outline-none " +
                  (theme === "dark"
                    ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-400"
                    : "bg-white border-rose-200 text-slate-900 focus:border-rose-400 shadow-sm")
                }
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} sao
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nhận xét</label>
              <input
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="Viết cảm nhận của bạn..."
                className={
                  "w-full px-3 py-2 rounded-xl text-sm border focus:outline-none " +
                  (theme === "dark"
                    ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-400"
                    : "bg-white border-rose-200 text-slate-900 focus:border-rose-400 shadow-sm")
                }
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className={
                  "px-4 py-2 rounded-xl text-sm font-semibold transition " +
                  (theme === "dark" ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-rose-500 text-white hover:bg-rose-600")
                }
              >
                Gửi đánh giá
              </button>
            </div>
            <p className="sm:col-span-2 text-[11px] text-slate-500 dark:text-slate-500">
              Lưu ý: hệ thống chỉ cho đánh giá khi bạn đã mua và đơn ở trạng thái “đã giao”.
            </p>
          </form>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Bạn cần đăng nhập để đánh giá sản phẩm.
          </p>
        )}

        {reviewLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải đánh giá...</p>
        ) : reviews.length ? (
          <div className="space-y-3">
            {reviews
              .slice()
              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
              .map((r) => (
                <div
                  key={r._id}
                  className={
                    "rounded-xl border p-3 " +
                    (theme === "dark" ? "border-slate-800 bg-slate-900/30" : "border-rose-200 bg-rose-50/50")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.name || "User"}</p>
                    <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {"★".repeat(Number(r.rating || 0)).padEnd(5, "☆")} • {r.rating}/5
                  </p>
                  {r.comment && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{r.comment}</p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có đánh giá nào.</p>
        )}
      </div>
    </div>
  );
}
