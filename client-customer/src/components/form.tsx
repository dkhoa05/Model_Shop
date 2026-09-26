"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { InputHTMLAttributes, ReactNode, cloneElement, isValidElement, useId } from "react";

/**
 * Trường biểu mẫu truy cập được: nhãn luôn hiện phía trên (không dùng placeholder thay nhãn),
 * gợi ý và lỗi được nối bằng aria-describedby, lỗi báo qua role="alert".
 * `children` là một phần tử input/select/textarea duy nhất; Field tự gắn id, aria-invalid, aria-describedby.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = ""
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined
      })
    : children;

  return (
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-zinc-200">
        {label}
        {required && (
          <span className="ml-0.5 text-accent-text" aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-sm text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-[rgb(var(--danger-text))]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/** Thẻ chọn (radio) lớn, có viền nổi khi chọn; nhóm nên bọc trong <fieldset><legend>. */
export function RadioCard({ label, desc, ...props }: { label: string; desc?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="group relative flex cursor-pointer gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 transition hover:border-zinc-500 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
      <input type="radio" className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" {...props} />
      <span>
        <span className="block text-[15px] font-bold text-fg">{label}</span>
        {desc && <span className="mt-0.5 block text-sm leading-6 text-zinc-400">{desc}</span>}
      </span>
    </label>
  );
}

/** Thông báo trạng thái: lỗi/thành công có biểu tượng + chữ (không chỉ dựa vào màu) */
export function Notice({ type, children }: { type: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-[rgb(var(--danger-text))]/50 bg-[rgb(var(--danger-text))]/10 text-fg",
    success: "border-emerald-500/50 bg-emerald-500/10 text-fg",
    info: "border-zinc-700 bg-zinc-800/60 text-fg"
  }[type];
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const iconColor = type === "success" ? "text-emerald-400" : type === "error" ? "text-[rgb(var(--danger-text))]" : "text-accent-text";
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${styles}`}>
      <Icon size={20} className={`mt-0.5 shrink-0 ${iconColor}`} aria-hidden />
      <div>{children}</div>
    </div>
  );
}
