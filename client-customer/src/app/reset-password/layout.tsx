import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="container-page py-8 sm:py-10">{children}</div>;
}
