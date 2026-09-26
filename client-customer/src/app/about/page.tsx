import type { Metadata } from "next";
import { MapPin, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Giới thiệu và chính sách",
  description: "Thông tin cửa hàng ModelShop, chính sách mua hàng, bảo hành, đổi trả và cam kết sản phẩm chính hãng.",
  keywords: ["ModelShop", "cửa hàng Gundam", "mô hình chính hãng", "figure chính hãng"]
};

const values = [
  { title: "Chính hãng", text: "Ưu tiên nguồn hàng Bandai, Tamiya, Kotobukiya, Megahouse và Good Smile Company.", icon: ShieldCheck },
  { title: "Đóng gói kỹ", text: "Box được bọc chống sốc, chèn góc và kiểm tra trước khi bàn giao vận chuyển.", icon: PackageCheck },
  { title: "Hiểu sưu tầm viên", text: "Tư vấn cho cả người mới chơi lẫn nhà sưu tầm lâu năm.", icon: Sparkles }
];

export default function AboutPage() {
  return (
    <div className="container-page space-y-16 py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-5xl">Mô hình chính hãng, thông tin rõ ràng</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-300">
          ModelShop bán lẻ Gundam, figure, model kit và collectibles với trải nghiệm minh bạch: thông tin sản phẩm đầy đủ, tư vấn đúng nhu cầu và chính sách hậu mãi dễ hiểu.
        </p>
      </header>

      <ul className="grid gap-px overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-800 md:grid-cols-3">
        {values.map((item) => (
          <li key={item.title} className="bg-zinc-900 p-6">
            <item.icon className="text-accent-text" size={28} aria-hidden />
            <h2 className="mt-4 text-xl font-extrabold text-fg">{item.title}</h2>
            <p className="mt-2 text-base leading-7 text-zinc-400">{item.text}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="policy-title">
          <h2 id="policy-title" className="text-2xl font-extrabold text-fg">
            Chính sách mua hàng
          </h2>
          <ul className="mt-5 grid gap-4 text-base leading-7 text-zinc-300">
            <li>Miễn phí vận chuyển cho đơn đạt ngưỡng ưu đãi (xem ở bước thanh toán).</li>
            <li>Đổi trả trong 7 ngày nếu sản phẩm lỗi sản xuất hoặc giao sai mẫu.</li>
            <li>Hỗ trợ kiểm tra tồn kho và giữ chỗ đặt trước theo lịch phát hành.</li>
          </ul>
        </section>
        <section aria-labelledby="store-title">
          <h2 id="store-title" className="text-2xl font-extrabold text-fg">
            Thông tin cửa hàng
          </h2>
          <address className="mt-5 grid gap-3 text-base not-italic leading-7 text-zinc-300">
            <span className="flex gap-3">
              <MapPin size={20} className="mt-1 shrink-0 text-accent-text" aria-hidden />
              {siteConfig.contact.address}
            </span>
            <span>Hotline: {siteConfig.contact.phone}</span>
            <span>Email: {siteConfig.contact.email}</span>
            <span>Giờ mở cửa: {siteConfig.contact.hours}</span>
          </address>
        </section>
      </div>
    </div>
  );
}
