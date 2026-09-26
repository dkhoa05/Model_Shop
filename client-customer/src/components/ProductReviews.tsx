"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Button from "./Button";
import { Field, Notice } from "./form";

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

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="flex text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < value ? "fill-amber-400" : "opacity-30"} />
      ))}
    </span>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      setMessage({ type: "success", text: "Cảm ơn bạn đã đánh giá!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Không gửi được đánh giá." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-2xl font-extrabold tracking-tight text-fg">
          Đánh giá từ khách hàng
        </h2>
        {data && data.numReviews > 0 && (
          <p className="flex items-center gap-2 text-zinc-300">
            <Stars value={Math.round(data.ratingAvg)} size={18} />
            <span>
              <strong className="text-fg">{data.ratingAvg.toFixed(1)}</strong> trên 5, {data.numReviews} đánh giá
            </span>
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4">
        {loading && <div className="skeleton h-20" role="status" aria-label="Đang tải đánh giá" />}
        {!loading && (!data || data.reviews.length === 0) && <p className="text-base text-zinc-400">Chưa có đánh giá nào. Hãy là người đầu tiên sau khi nhận hàng.</p>}
        {data?.reviews.map((review, index) => (
          <article key={review._id || index} className="rounded-2xl bg-zinc-800/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-bold text-fg">{review.name}</p>
              <p className="flex items-center gap-2">
                <Stars value={review.rating} />
                <span className="sr-only">{review.rating} trên 5 sao</span>
              </p>
            </div>
            {review.comment && <p className="mt-2 text-[15px] leading-7 text-zinc-200">{review.comment}</p>}
            {review.createdAt && <p className="mt-1.5 text-sm text-zinc-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>}
          </article>
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        {user ? (
          <form onSubmit={submit} className="grid max-w-xl gap-4">
            <p className="text-base font-bold text-fg">Viết đánh giá</p>
            <p className="-mt-2 text-sm text-zinc-400">Chỉ khách đã nhận hàng mới gửi được đánh giá.</p>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-zinc-200">Chấm sao</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="relative cursor-pointer">
                    <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
                    <span className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-700 text-zinc-300 transition hover:border-zinc-500 peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-fg peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                      <span className="text-base font-bold">{n}</span>
                      <span className="sr-only"> sao</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Nhận xét" hint="Chia sẻ trải nghiệm build, chất lượng box, đóng gói...">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={4} className="input" />
            </Field>
            {message && <Notice type={message.type}>{message.text}</Notice>}
            <Button type="submit" loading={busy} className="w-fit">
              Gửi đánh giá
            </Button>
          </form>
        ) : (
          <p className="text-base text-zinc-300">
            <Link href="/login" className="link">
              Đăng nhập
            </Link>{" "}
            để đánh giá sản phẩm bạn đã mua.
          </p>
        )}
      </div>
    </section>
  );
}
