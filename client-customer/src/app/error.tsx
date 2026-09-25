"use client";

import Button from "@/components/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Runtime error</p>
      <h1 className="mt-3 font-space-grotesk text-3xl font-black uppercase text-white">Có lỗi xảy ra</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
        Giao diện gặp lỗi khi render. Bạn có thể thử tải lại phần này, hoặc quay về danh sách sản phẩm.
      </p>
      {process.env.NODE_ENV !== "production" && <p className="mt-3 text-xs text-zinc-600">{error.message}</p>}
      {error.digest && <p className="mt-2 text-xs text-zinc-600">Mã lỗi: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>Thử lại</Button>
        <Button href="/products" variant="outline">Xem sản phẩm</Button>
      </div>
    </div>
  );
}
