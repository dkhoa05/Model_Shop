"use client";

import Button from "@/components/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-16">
      <div role="alert" className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-extrabold text-fg">Có lỗi xảy ra</h1>
        <p className="mt-3 text-base leading-7 text-zinc-400">Trang không tải được lúc này. Bạn có thể thử lại hoặc quay về danh sách sản phẩm.</p>
        {process.env.NODE_ENV !== "production" && <p className="mt-3 text-xs text-zinc-500">{error.message}</p>}
        {error.digest && <p className="mt-2 text-xs text-zinc-500">Mã lỗi: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}>
            Thử lại
          </Button>
          <Button href="/products" variant="outline">
            Xem sản phẩm
          </Button>
        </div>
      </div>
    </div>
  );
}
