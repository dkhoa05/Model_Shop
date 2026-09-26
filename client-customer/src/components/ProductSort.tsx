"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { sortOptions } from "@/lib/products";

export default function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-sm font-semibold text-zinc-300">
        Sắp xếp
      </label>
      <select
        id="sort"
        value={searchParams.get("sort") || "newest"}
        onChange={(event) => handleChange(event.target.value)}
        className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-semibold text-fg"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
