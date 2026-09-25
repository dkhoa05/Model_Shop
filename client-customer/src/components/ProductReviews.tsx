"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

interface Review {
  _id?: string;
  name: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

interface ReviewsResponse {
  ratingAvg: number;
  numReviews: number;
  reviews: Review[];
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    return apiFetch<ReviewsResponse>(`/products/${productId}/reviews`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const res = await apiFetch<ReviewsResponse>(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment })
      });
      setData(res);
      setComment("");
      setMessage({ type: "ok", text: "Cảm ơn bạn đã đánh giá!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Không gửi được đánh giá." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[18px] border border-apple-hairline bg-white p-6 lg:p-8" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[28px] font-semibold leading-[1.14] text-apple-ink">Đánh giá từ khách hàng</h2>
        {data && data.numReviews > 0 && (
          <p className="text-sm text-apple-muted">
            <strong className="text-apple-ink">{data.ratingAvg.toFixed(1)}</strong>/5 · {data.numReviews} đánh giá
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        {loading && <p className="text-sm text-apple-muted">Đang tải đánh giá…</p>}
        {!loading && (!data || data.reviews.length === 0) && (
          <p className="text-sm text-apple-muted">Chưa có đánh giá nào. Hãy là người đầu tiên sau khi nhận hàng.</p>
        )}
        {data?.reviews.map((review, index) => (
          <article key={review._id || index} className="rounded-[14px] bg-apple-parchment p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-apple-ink">{review.name}</p>
              <span className="flex text-amber-500" aria-label={`${review.rating} trên 5 sao`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < review.rating ? "fill-amber-400" : "opacity-25"} />
                ))}
              </span>
            </div>
            {review.comment && <p className="mt-2 text-sm leading-6 text-apple-ink">{review.comment}</p>}
            {review.createdAt && <p className="mt-1 text-xs text-apple-muted">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>}
          </article>
        ))}
      </div>

      <div className="mt-6 border-t border-apple-hairline pt-5">
        {user ? (
          <form onSubmit={submit} className="grid gap-3">
            <p className="text-sm font-semibold text-apple-ink">Viết đánh giá (chỉ dành cho khách đã nhận hàng)</p>
            <label className="flex items-center gap-2 text-sm text-apple-muted">
              Số sao
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border border-apple-hairline bg-white px-2 py-1 text-apple-ink">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} sao</option>
                ))}
              </select>
            </label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={3} placeholder="Chia sẻ trải nghiệm của bạn…" className="rounded-lg border border-apple-hairline bg-white p-3 text-sm text-apple-ink" />
            {message && (
              <p className={`text-sm font-semibold ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
            )}
            <button type="submit" disabled={busy} className="w-fit rounded-lg bg-apple-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-apple-muted">
            <Link href="/login" className="font-semibold text-apple-blue underline">Đăng nhập</Link> để đánh giá sản phẩm bạn đã mua.
          </p>
        )}
      </div>
    </section>
  );
}
