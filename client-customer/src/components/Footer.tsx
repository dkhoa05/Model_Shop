import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { footerNavigation, siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-800 bg-zinc-900/50">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" className="text-2xl font-extrabold tracking-tight" aria-label="ModelShop, về trang chủ">
            Model<span className="text-accent-text">Shop</span>
          </Link>
          <p className="mt-4 max-w-sm text-base leading-7 text-zinc-400">
            Cửa hàng mô hình Gundam, figure, model kit và collectibles chính hãng. Đóng gói kỹ, tư vấn thật, bảo hành rõ ràng.
          </p>
        </div>

        {footerNavigation.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-bold text-fg">{group.title}</h2>
            <ul className="mt-4 grid gap-1">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center text-[15px] text-zinc-400 transition hover:text-fg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-sm font-bold text-fg">Liên hệ</h2>
          <address className="mt-4 grid gap-3 text-[15px] not-italic text-zinc-400">
            <span className="flex gap-3">
              <MapPin size={18} className="mt-1 shrink-0 text-accent-text" aria-hidden />
              {siteConfig.contact.address}
            </span>
            <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-3 transition hover:text-fg">
              <Phone size={18} className="shrink-0 text-accent-text" aria-hidden />
              {siteConfig.contact.phone}
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className="flex min-h-11 items-center gap-3 transition hover:text-fg">
              <Mail size={18} className="shrink-0 text-accent-text" aria-hidden />
              {siteConfig.contact.email}
            </a>
            <span className="text-sm text-zinc-500">{siteConfig.contact.hours}</span>
          </address>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-6">
        <p className="container-page text-sm text-zinc-500">© 2026 ModelShop Việt Nam. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  );
}
