import Button from "@/components/Button";

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center text-center">
        <p className="text-6xl font-extrabold tracking-tight text-accent-text">404</p>
        <h1 className="mt-4 text-3xl font-extrabold text-fg">Không tìm thấy trang</h1>
        <p className="mt-3 text-base leading-7 text-zinc-400">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Về trang chủ</Button>
          <Button href="/products" variant="outline">
            Xem sản phẩm
          </Button>
        </div>
      </div>
    </div>
  );
}
