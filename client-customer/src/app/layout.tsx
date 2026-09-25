import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-space-grotesk",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Gundam, Figure, Model Kit & Collectibles`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: ["Gundam", "Gunpla", "Figure Anime", "Model Kit", "Collectibles", "Bandai", "Tamiya"],
  openGraph: {
    title: `${siteConfig.name} - Gundam, Figure, Model Kit & Collectibles`,
    description: "Cửa hàng mô hình chính hãng cho builder và collector tại Việt Nam.",
    type: "website",
    locale: "vi_VN"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-red-600 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <div className="cyber-grid premium-noise flex min-h-screen flex-col">
              <Header />
              <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-10 2xl:px-16">{children}</main>
              <AIAssistantWidget />
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
