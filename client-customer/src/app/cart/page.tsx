"use client";

import Link from "next/link";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";
import { Notice } from "@/components/form";
import { useCart } from "@/context/CartContext";
import { formatVND } from "@/utils/currency";

function SyncNotices({ notices, onDismiss }: { notices: string[]; onDismiss: () => void }) {
  if (notices.length === 0) return null;
  return (
    <Notice type="info">
      <p className="font-semibold">Giỏ hàng đã được cập nhật theo giá và tồn kho mới nhất:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {notices.map((notice) => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
      <button type="button" onClick={onDismiss} className="link mt-3 min-h-11 text-sm">
        Đã hiểu
      </button>
    </Notice>
  );
}

export default function CartPage() {
  const { cartItems, subtotal, shipping, total, syncNotices, dismissSyncNotices, shippingConfig } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="space-y-4">
        <SyncNotices notices={syncNotices} onDismiss={dismissSyncNotices} />
        <EmptyState title="Giỏ hàng đang trống" description="Chọn vài mẫu Gundam, figure hoặc dụng cụ yêu thích để bắt đầu đơn hàng." actionLabel="Tiếp tục mua sắm" actionHref="/products" />
      </div>
    );
  }

  const remainingForFree = Math.max(0, shippingConfig.freeShippingThreshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / shippingConfig.freeShippingThreshold) * 100));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Giỏ hàng</h1>
      <SyncNotices notices={syncNotices} onDismiss={dismissSyncNotices} />

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section aria-label="Sản phẩm trong giỏ" className="grid content-start gap-4">
          {cartItems.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </section>

        <aside className="h-fit rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 lg:sticky lg:top-24" aria-labelledby="summary-title">
          <h2 id="summary-title" className="text-xl font-extrabold text-fg">
            Tóm tắt đơn hàng
          </h2>

          <div className="mt-4">
            <p className="text-sm text-zinc-300">
              {remainingForFree > 0 ? `Mua thêm ${formatVND(remainingForFree)} để được miễn phí vận chuyển` : "Đơn của bạn được miễn phí vận chuyển"}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Tiến độ miễn phí vận chuyển">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-[15px]">
            <div className="flex justify-between text-zinc-300">
              <dt>Tạm tính</dt>
              <dd className="font-semibold text-fg">{formatVND(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-zinc-300">
              <dt>Phí vận chuyển (ước tính)</dt>
              <dd className="font-semibold text-fg">{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-zinc-800 pt-4">
              <dt className="font-bold text-fg">Tổng cộng</dt>
              <dd className="text-2xl font-extrabold text-fg">{formatVND(total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-sm text-zinc-400">Mã giảm giá được áp dụng ở bước thanh toán.</p>

          <Link href="/checkout" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-[15px] font-bold text-on-accent transition hover:brightness-110 hover:shadow-lift">
            Tiến hành thanh toán
          </Link>
          <Link href="/products" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 px-6 text-[15px] font-bold text-fg transition hover:bg-zinc-800">
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </div>
  );
}
