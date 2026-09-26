import { CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";
import ProductImage from "./ProductImage";

const SIDE_IMAGE = "https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=1200";

/** Khung trang tài khoản: form một cột, bên cạnh là ảnh + lợi ích (ẩn trên màn hình nhỏ) */
export default function AuthShell({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-14rem)] overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900 lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-base leading-7 text-zinc-400">{description}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-[15px] text-zinc-400">{footer}</div>}
        </div>
      </div>
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden>
        <ProductImage src={SIDE_IMAGE} alt="" sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
        <ul className="absolute inset-x-0 bottom-0 grid gap-3 p-10 text-zinc-50">
          {["Theo dõi đơn hàng và lịch sử mua", "Lưu địa chỉ, đặt hàng nhanh hơn", "Nhận mã giảm giá dành cho thành viên"].map((text) => (
            <li key={text} className="flex items-center gap-3 text-base font-medium">
              <CheckCircle2 size={20} className="shrink-0 text-accent" />
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
