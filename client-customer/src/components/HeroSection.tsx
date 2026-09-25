"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { banners } from "@/data/banners";
import Button from "./Button";

export default function HeroSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const banner = banners[active];

  return (
    <section className="relative min-h-[620px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
      {banners.map((item, index) => (
        <div key={item.id} className={`absolute inset-0 transition duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}>
          <img src={item.image} alt={item.title} className="hero-kenburns h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/88 to-zinc-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        </div>
      ))}

      <div className="relative z-10 grid min-h-[620px] items-center gap-8 px-6 py-16 sm:px-10 lg:grid-cols-[1fr_440px] lg:px-16 2xl:px-24">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-red-300">
            <Sparkles size={13} />
            {banner.eyebrow}
          </p>
          <h1 className="font-space-grotesk text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl lg:text-7xl">
            {banner.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-bold text-cyan-100">{banner.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">{banner.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={banner.primaryHref}>
              <ShoppingBag size={17} />
              Mua ngay
            </Button>
            <Button href={banner.secondaryHref} variant="outline">
              Xem pre-order
            </Button>
          </div>
        </div>

        <div className="hidden rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl lg:block">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-950">
            <img src={banner.image} alt={`${banner.title} preview`} className="h-full w-full object-cover product-shadow" />
          </div>
          <div className="mt-5 grid gap-3">
            {["Chính hãng", "Đóng gói chống sốc", "Hỗ trợ pre-order"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-200">
                <ShieldCheck size={16} className="text-red-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 flex gap-2">
        <button className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 bg-zinc-950/80 text-white backdrop-blur hover:border-red-500" onClick={() => setActive((active - 1 + banners.length) % banners.length)} aria-label="Banner trước">
          <ChevronLeft size={18} />
        </button>
        <button className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 bg-zinc-950/80 text-white backdrop-blur hover:border-red-500" onClick={() => setActive((active + 1) % banners.length)} aria-label="Banner sau">
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
