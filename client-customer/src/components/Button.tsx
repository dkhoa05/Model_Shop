import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "cyan";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "border-red-600 bg-red-600 text-white hover:border-red-500 hover:bg-red-500",
  secondary: "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500",
  outline: "border-red-600/70 bg-transparent text-red-300 hover:bg-red-600 hover:text-white",
  ghost: "border-transparent bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white",
  cyan: "border-cyan-400 bg-cyan-400 text-zinc-950 hover:border-cyan-300 hover:bg-cyan-300"
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-black uppercase tracking-wide transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function Button({ href, variant = "primary", className = "", children, disabled, ...props }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    if (disabled) {
      return <span className={`${classes} cursor-not-allowed opacity-50`}>{children}</span>;
    }

    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
