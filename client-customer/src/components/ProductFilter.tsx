"use client";

import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { getParamList, priceRanges, productFilterGroups, ProductSearchParams } from "@/lib/products";

export default function ProductFilter({ activeParams }: { activeParams: ProductSearchParams }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-black uppercase text-white hover:border-red-500/40 lg:hidden">
        <SlidersHorizontal size={17} />
        Filter products
      </button>

      <aside className="hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 lg:sticky lg:top-24 lg:block">
        <FilterContent activeParams={activeParams} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="Đóng filter" />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-space-grotesk text-lg font-black uppercase text-white">
                <SlidersHorizontal size={18} />
                Filter
              </h2>
              <button className="rounded-xl p-2 text-zinc-300 hover:bg-zinc-900" onClick={() => setOpen(false)} aria-label="Đóng filter">
                <X size={20} />
              </button>
            </div>
            <FilterContent activeParams={activeParams} onSelect={() => setOpen(false)} hideTitle />
          </aside>
        </div>
      )}
    </>
  );
}

function FilterContent({ activeParams, onSelect, hideTitle = false }: { activeParams: ProductSearchParams; onSelect?: () => void; hideTitle?: boolean }) {
  return (
    <>
      {!hideTitle && (
        <div className="mb-5 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 font-space-grotesk text-lg font-black uppercase text-white">
            <SlidersHorizontal size={18} />
            Filter
          </h2>
          <Link href="/products" className="text-xs font-black uppercase text-red-400 hover:text-red-300">
            Reset
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {productFilterGroups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-400">{group.title}</h3>
            <div className="grid gap-2">
              {group.values.map((value) => {
                const activeValues = getParamList(activeParams, group.key);
                const active = activeValues.includes(value);
                const href = getToggleHref(activeParams, group.key, value);

                return (
                  <Link key={value} href={href} onClick={onSelect} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold transition ${active ? "border-red-500 bg-red-500/10 text-red-300" : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-950"}`}>
                    <span>{value}</span>
                    <span className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${active ? "border-red-400 bg-red-500 text-white" : "border-zinc-700"}`}>{active ? "✓" : ""}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section>
          <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-400">Price Range</h3>
          <div className="grid gap-2">
            {priceRanges.map((range) => (
              <Link key={range.value} href={`/products?price=${range.value}`} onClick={onSelect} className="rounded-xl border border-zinc-800 px-3 py-2 text-sm font-bold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-950">
                {range.label}
              </Link>
            ))}
          </div>
        </section>

        {hideTitle && (
          <Link href="/products" onClick={onSelect} className="block rounded-xl border border-zinc-800 px-3 py-2 text-center text-sm font-black uppercase text-red-400">
            Reset filter
          </Link>
        )}
      </div>
    </>
  );
}

function getToggleHref(activeParams: ProductSearchParams, key: string, value: string) {
  const params = new URLSearchParams();

  Object.entries(activeParams).forEach(([paramKey, paramValue]) => {
    const normalizedValue = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    if (normalizedValue && paramKey !== key) {
      params.set(paramKey, normalizedValue);
    }
  });

  const currentValues = getParamList(activeParams, key);
  const nextValues = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];

  if (nextValues.length > 0) {
    params.set(key, nextValues.join(","));
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}
