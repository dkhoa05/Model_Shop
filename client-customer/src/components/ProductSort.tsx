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
    <label className="flex items-center gap-3 text-sm font-bold text-zinc-400">
      Sort
      <select
        value={searchParams.get("sort") || "newest"}
        onChange={(event) => handleChange(event.target.value)}
        className="h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-bold text-white outline-none focus:border-red-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
