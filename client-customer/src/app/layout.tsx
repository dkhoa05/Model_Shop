import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

// Be Vietnam Pro: thiết kế riêng cho tiếng Việt, dấu rõ ở cỡ nhỏ
const fontSans = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Gundam, Figure, Model Kit chính hãng`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: ["Gundam", "Gunpla", "Figure Anime", "Model Kit", "Collectibles", "Bandai", "Tamiya"],
  openGraph: {
    title: `${siteConfig.name} | Gundam, Figure, Model Kit chính hãng`,
    description: "Cửa hàng mô hình chính hãng cho builder và collector tại Việt Nam.",
    type: "website",
    locale: "vi_VN"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e1014" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" }
  ]
};

/** Đặt data-theme trước khi vẽ: lựa chọn đã lưu, nếu không có thì theo hệ thống (tránh nháy chủ đề) */
const themeInit = `(function(){try{var t=localStorage.getItem('ms-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="dark" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-zinc-950 font-sans text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-on-accent"
        >
          Bỏ qua để tới nội dung chính
        </a>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <AIAssistantWidget />
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
