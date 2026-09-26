"use client";

import Link from "next/link";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getParamList, priceRanges, productFilterGroups, ProductSearchParams } from "@/lib/products";

type Group = { title: string; key: string; values: readonly string[] };

const STATUS_LABELS: Record<string, string> = {
  "in-stock": "Còn hàng",
  limited: "Giới hạn",
  "pre-order": "Đặt trước",
  "out-of-stock": "Hết hàng"
};

const label = (key: string, value: string) => (key === "status" ? STATUS_LABELS[value] || value : value);

/** Bộ lọc: nhóm có thể thu gọn (<details>), lựa chọn là liên kết có aria-current, chip "đang lọc" cho phép bỏ từng mục */
export default function ProductFilter({ activeParams, brands = [] }: { activeParams: ProductSearchParams; brands?: string[] }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const activeCount = Object.keys(activeParams).filter((k) => !["sort", "page"].includes(k)).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 text-[15px] font-bold text-fg lg:hidden"
      >
        <SlidersHorizontal size={18} aria-hidden />
        Bộ lọc{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>

      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Bộ lọc sản phẩm">
        <FilterContent activeParams={activeParams} brands={brands} />
      </aside>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Bộ lọc sản phẩm" className="fixed inset-0 z-50 lg:hidden" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          <button type="button" tabIndex={-1} className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="Đóng bộ lọc" />
          <div className="absolute left-0 top-0 flex h-full w-[22rem] max-w-[90vw] flex-col border-r border-zinc-800 bg-zinc-950 shadow-pop">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <h2 className="text-lg font-extrabold text-fg">Bộ lọc</h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Đóng bộ lọc" className="grid h-11 w-11 place-items-center rounded-xl text-zinc-300 hover:bg-zinc-800">
                <X size={22} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent activeParams={activeParams} brands={brands} onSelect={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterContent({ activeParams, brands, onSelect }: { activeParams: ProductSearchParams; brands: string[]; onSelect?: () => void }) {
  const groups: Group[] = [
    ...productFilterGroups.slice(0, 1),
    ...(brands.length ? [{ title: "Thương hiệu", key: "brand", values: brands }] : []),
    ...productFilterGroups.slice(1)
  ].map((g) => ({ ...g, title: g.title === "Category" ? "Danh mục" : g.title === "Grade" ? "Cấp độ" : g.title === "Availability" ? "Tình trạng" : g.title }));

  const chips = groups.flatMap((g) => getParamList(activeParams, g.key).map((value) => ({ key: g.key, value })));
  const price = priceRanges.find((r) => r.value === (Array.isArray(activeParams.price) ? activeParams.price[0] : activeParams.price));

  return (
    <div className="space-y-2">
      {(chips.length > 0 || price) && (
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Bộ lọc đang áp dụng">
          {chips.map((chip) => (
            <Link key={`${chip.key}-${chip.value}`} href={getToggleHref(activeParams, chip.key, chip.value)} onClick={onSelect} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent/15 px-3 text-sm font-semibold text-accent-text transition hover:bg-accent/25">
              {label(chip.key, chip.value)}
              <X size={14} aria-hidden />
              <span className="sr-only">, bỏ lọc</span>
            </Link>
          ))}
          {price && (
            <Link href={getToggleHref(activeParams, "price", price.value)} onClick={onSelect} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent/15 px-3 text-sm font-semibold text-accent-text transition hover:bg-accent/25">
              {price.label}
              <X size={14} aria-hidden />
              <span className="sr-only">, bỏ lọc</span>
            </Link>
          )}
          <Link href="/products" onClick={onSelect} className="link text-sm">
            Xóa tất cả
          </Link>
        </div>
      )}

      {groups.map((group, index) => (
        <details key={group.key} open={index < 3 || getParamList(activeParams, group.key).length > 0} className="group rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px] font-bold text-fg [&::-webkit-details-marker]:hidden">
            {group.title}
            <span className="text-zinc-400 transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <ul className="grid gap-1 px-2 pb-3">
            {group.values.map((value) => {
              const active = getParamList(activeParams, group.key).includes(value);
              return (
                <li key={value}>
                  <Link
                    href={getToggleHref(activeParams, group.key, value)}
                    onClick={onSelect}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-accent/15 text-fg" : "text-zinc-300 hover:bg-zinc-800"}`}
                  >
                    <span>{label(group.key, value)}</span>
                    <span className={`grid h-5 w-5 place-items-center rounded-md border ${active ? "border-accent bg-accent text-on-accent" : "border-zinc-600"}`} aria-hidden>
                      {active && <Check size={14} strokeWidth={3} />}
                    </span>
                    {active && <span className="sr-only">(đang chọn)</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}

      <details open className="group rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px] font-bold text-fg [&::-webkit-details-marker]:hidden">
          Khoảng giá
          <span className="text-zinc-400 transition group-open:rotate-45" aria-hidden>
            +
          </span>
        </summary>
        <ul className="grid gap-1 px-2 pb-3">
          {priceRanges.map((range) => {
            const active = (Array.isArray(activeParams.price) ? activeParams.price[0] : activeParams.price) === range.value;
            return (
              <li key={range.value}>
                <Link
                  href={getToggleHref(activeParams, "price", range.value, true)}
                  onClick={onSelect}
                  aria-current={active ? "true" : undefined}
                  className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition ${active ? "bg-accent/15 text-fg" : "text-zinc-300 hover:bg-zinc-800"}`}
                >
                  {range.label}
                  {active && <span className="sr-only">(đang chọn)</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

/** Bật/tắt một giá trị lọc; `single` = chỉ một giá trị cho khóa này (khoảng giá). Luôn về trang 1. */
function getToggleHref(activeParams: ProductSearchParams, key: string, value: string, single = false) {
  const params = new URLSearchParams();

  Object.entries(activeParams).forEach(([paramKey, paramValue]) => {
    const normalizedValue = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    if (normalizedValue && paramKey !== key && paramKey !== "page") {
      params.set(paramKey, normalizedValue);
    }
  });

  const currentValues = getParamList(activeParams, key);
  const nextValues = single
    ? currentValues.includes(value) ? [] : [value]
    : currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];

  if (nextValues.length > 0) {
    params.set(key, nextValues.join(","));
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}
