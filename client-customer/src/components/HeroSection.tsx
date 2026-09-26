"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import Button from "./Button";
import ProductImage from "./ProductImage";
import type { Product } from "@/types/product";
import { formatVND } from "@/utils/currency";

const HERO_IMAGE = "https://images.unsplash.com/photo-1612400200701-847d015ba101?auto=format&fit=crop&q=85&w=1600";

/** Hero: thông điệp bên trái, ảnh + 2 sản phẩm thật bên phải; ảnh trượt nhẹ theo cuộn (tắt khi giảm chuyển động) */
export default function HeroSection({ spotlight = [] }: { spotlight?: Product[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "14%"]);
  const cardsY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -36]);

  const stagger = (i: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 28 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  });

  return (
    <section ref={ref} className="relative isolate overflow-hidden border-b border-zinc-800/70" aria-labelledby="hero-title">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" aria-hidden />

      <div className="container-page grid lg:min-h-[min(46rem,calc(100dvh-4rem))] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="max-w-2xl">
          <motion.h1 {...stagger(0)} id="hero-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Gunpla và figure chính hãng cho người sưu tầm
          </motion.h1>
          <motion.p {...stagger(1)} className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
            Bandai, Kotobukiya, Megahouse. Kiểm tra box trước khi giao, đóng gói chống sốc, hỗ trợ đặt trước.
          </motion.p>
          <motion.div {...stagger(2)} className="mt-8 flex flex-wrap gap-3">
            <Button href="/products">
              Xem sản phẩm
              <ArrowRight size={18} aria-hidden />
            </Button>
            <Button href="/products?status=pre-order" variant="outline">
              Đặt trước
            </Button>
          </motion.div>
          <motion.ul {...stagger(3)} className="mt-10 grid gap-3 text-sm font-medium text-zinc-300 sm:grid-cols-3" aria-label="Cam kết của cửa hàng">
            {[
              { icon: ShieldCheck, text: "Hàng chính hãng" },
              { icon: PackageCheck, text: "Đóng gói chống sốc" },
              { icon: Truck, text: "Giao nhanh toàn quốc" }
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon size={18} className="shrink-0 text-accent-text" aria-hidden />
                {text}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900 shadow-pop sm:aspect-[5/4] lg:aspect-[4/5]"
          >
            <motion.div style={{ y: imageY }} className="absolute inset-[-8%]">
              <ProductImage src={HERO_IMAGE} alt="Mô hình Gundam lắp sẵn trên kệ trưng bày" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" aria-hidden />
          </motion.div>

          {spotlight.slice(0, 2).map((product, i) => (
            <motion.div
              key={product.id}
              style={{ y: cardsY }}
              initial={reduce ? false : { opacity: 0, x: i === 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute w-56 sm:w-64 ${i === 0 ? "-bottom-6 left-3 sm:-left-6" : "right-3 top-8 sm:-right-4 sm:top-14"}`}
            >
              <Link
                href={`/products/${product.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/90 p-3 shadow-pop backdrop-blur-xl transition hover:-translate-y-1 hover:border-accent"
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  <ProductImage src={product.images[0]} alt="" sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-fg">{product.name}</span>
                  <span className="mt-0.5 block text-sm font-extrabold text-accent-text">{formatVND(product.price)}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
