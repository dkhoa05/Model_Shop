"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Chuyển sáng/tối; mặc định theo hệ thống, lưu lựa chọn trong localStorage (đã khởi tạo trước khi vẽ để tránh nháy). */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) || "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("ms-theme", next);
    } catch {
      /* trình duyệt chặn lưu trữ: chỉ áp dụng cho phiên hiện tại */
    }
    setTheme(next);
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isLight}
      aria-label={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
      className={`grid h-11 w-11 place-items-center rounded-xl text-zinc-300 transition hover:bg-zinc-800 hover:text-fg ${className}`}
    >
      {theme === null ? <span className="h-5 w-5" aria-hidden /> : isLight ? <Moon size={20} aria-hidden /> : <Sun size={20} aria-hidden />}
    </button>
  );
}
