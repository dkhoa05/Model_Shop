import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { footerNavigation, siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t border-apple-hairline bg-apple-parchment text-apple-muted">
      <div className="grid w-full gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-10 2xl:px-16">
        <div>
          <Link href="/" className="text-[21px] font-semibold tracking-[-0.224px] text-apple-ink">
            ModelShop
          </Link>
          <p className="mt-4 max-w-sm text-xs leading-6">
            Cửa hàng mô hình Gundam, Figure, Model Kit và Collectibles chính hãng. Đóng gói kỹ, tư vấn thật, bảo hành rõ ràng.
          </p>
          <div className="mt-5 grid gap-2 text-xs leading-6">
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} /> {siteConfig.contact.address}
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone size={14} /> {siteConfig.contact.phone}
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail size={14} /> {siteConfig.contact.email}
            </span>
          </div>
        </div>

        {footerNavigation.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-apple-ink">{group.title}</h2>
            <ul className="mt-4 grid gap-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs leading-6 hover:text-apple-blue">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="text-sm font-semibold text-apple-ink">Newsletter</h2>
          <p className="mt-4 text-xs leading-6">Nhận lịch release, mã giảm giá và hướng dẫn build mới nhất.</p>
          <form className="mt-4 flex gap-2">
            <input className="input min-w-0 flex-1 py-2 text-xs" placeholder="Email của bạn" type="email" />
            <button className="rounded-full bg-apple-blue px-4 text-sm text-white hover:bg-[#0071e3]" type="submit">
              Gửi
            </button>
          </form>
          <div className="mt-5 flex gap-3">
            <Link href={siteConfig.social.facebook} aria-label="Facebook" className="hover:text-apple-blue">
              <Facebook size={18} />
            </Link>
            <Link href={siteConfig.social.instagram} aria-label="Instagram" className="hover:text-apple-blue">
              <Instagram size={18} />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-apple-hairline py-5 text-center text-xs">
        © 2026 ModelShop Vietnam. Demo UI for eCommerce production handoff.
      </div>
    </footer>
  );
}
