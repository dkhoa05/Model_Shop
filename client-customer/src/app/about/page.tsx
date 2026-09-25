import type { Metadata } from "next";
import { MapPin, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About ModelShop",
  description: "Thông tin cửa hàng ModelShop, chính sách mua hàng, bảo hành, đổi trả và cam kết sản phẩm chính hãng.",
  keywords: ["ModelShop", "cửa hàng Gundam", "mô hình chính hãng", "figure chính hãng"]
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 lg:p-10">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Store Info</p>
        <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">About ModelShop</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
          ModelShop là cửa hàng bán lẻ mô hình Gundam, Figure, Model Kit và Collectibles hướng tới trải nghiệm mua hàng minh bạch: thông tin sản phẩm rõ, hình ảnh nổi bật, tư vấn đúng nhu cầu và chính sách hậu mãi dễ hiểu.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          { title: "Chính hãng", text: "Ưu tiên nguồn hàng Bandai, Tamiya, Kotobukiya, Megahouse và Good Smile Company.", icon: ShieldCheck },
          { title: "Đóng gói kỹ", text: "Box được bọc chống sốc, chèn góc và kiểm tra trước khi bàn giao vận chuyển.", icon: PackageCheck },
          { title: "Collector-first", text: "Tối ưu trải nghiệm cho cả người mới chơi lẫn nhà sưu tầm lâu năm.", icon: Sparkles }
        ].map((item) => (
          <article key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <item.icon className="text-red-400" size={28} />
            <h2 className="mt-4 font-space-grotesk text-xl font-black uppercase text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="font-space-grotesk text-2xl font-black uppercase text-white">Chính sách mua hàng</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-zinc-300">
            <li>Miễn phí vận chuyển cho đơn hàng đạt ngưỡng ưu đãi (xem chi tiết tại bước thanh toán).</li>
            <li>Đổi trả trong 7 ngày nếu sản phẩm lỗi sản xuất hoặc giao sai mẫu.</li>
            <li>Hỗ trợ kiểm tra tồn kho và giữ slot pre-order theo lịch release.</li>
          </ul>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="font-space-grotesk text-2xl font-black uppercase text-white">Thông tin cửa hàng</h2>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-300">
            <MapPin size={18} className="text-cyan-300" />
            24 Nguyễn Trãi, Quận 1, TP.HCM
          </p>
          <p className="mt-3 text-sm text-zinc-400">Hotline: 0900 000 000 · Email: support@modelshop.vn</p>
          <p className="mt-3 text-sm text-zinc-400">Giờ mở cửa: 09:00 - 21:00, Thứ 2 đến Chủ nhật.</p>
        </article>
      </section>
    </div>
  );
}
