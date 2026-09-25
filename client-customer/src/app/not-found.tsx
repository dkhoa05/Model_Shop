import Button from "@/components/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">404</p>
      <h1 className="mt-3 font-space-grotesk text-3xl font-black uppercase text-white">Không tìm thấy trang</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <div className="mt-6 flex gap-3">
        <Button href="/">Về trang chủ</Button>
        <Button href="/products" variant="outline">Xem sản phẩm</Button>
      </div>
    </div>
  );
}
