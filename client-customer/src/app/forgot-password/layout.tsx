import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: false }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
