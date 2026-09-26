import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "cyan";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

// Nút chính: chữ tối trên nền cam (tương phản 6.6:1) ở cả hai chủ đề
const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-accent text-on-accent hover:brightness-110 hover:shadow-lift",
  secondary: "border-zinc-700 bg-zinc-800 text-fg hover:border-zinc-600 hover:bg-zinc-700/70",
  outline: "border-zinc-600 bg-transparent text-fg hover:border-accent hover:text-accent-text",
  ghost: "border-transparent bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-fg",
  cyan: "border-transparent bg-accent text-on-accent hover:brightness-110"
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-6 py-3 text-[15px] font-bold transition duration-200 active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export default function Button({ href, variant = "primary", className = "", children, disabled, loading, ...props }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    if (disabled) {
      return (
        <span className={`${classes} cursor-not-allowed opacity-50`} aria-disabled="true">
          {children}
        </span>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}
