/**
 * Hệ thiết kế ModelShop: mọi màu đi qua CSS variables (xem src/app/globals.css) để có 2 chủ đề sáng/tối
 * mà không phải viết `dark:` ở từng component. Thang `zinc` là thang trung tính (đảo ngược ở chủ đề sáng).
 * Các thang `red`, `cyan`, `amber`, `emerald`, `apple` được ánh xạ sang token để code cũ tự thích ứng:
 * `red`/`cyan` = màu nhấn duy nhất (cam san hô), `amber` = cảnh báo, `emerald` = thành công.
 */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const scale = (prefix, steps) => Object.fromEntries(steps.map((s) => [s, v(`${prefix}-${s}`)]));
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const accentScale = {
  50: v("accent-text"),
  100: v("accent-text"),
  200: v("accent-text"),
  300: v("accent-text"),
  400: v("accent-text"),
  500: v("accent"),
  600: v("accent"),
  700: v("accent-strong"),
  800: v("accent-strong"),
  900: v("accent-strong"),
  950: v("accent-strong")
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        zinc: scale("z", STEPS),
        fg: v("fg"),
        "on-accent": v("accent-fg"),
        accent: { DEFAULT: v("accent"), text: v("accent-text"), strong: v("accent-strong") },
        red: accentScale,
        cyan: accentScale,
        violet: accentScale,
        amber: { 50: v("warn-text"), 100: v("warn-text"), 200: v("warn-text"), 300: v("warn-text"), 400: v("warn-text"), 500: v("warn"), 600: v("warn") },
        emerald: { 50: v("ok-text"), 100: v("ok-text"), 200: v("ok-text"), 300: v("ok-text"), 400: v("ok-text"), 500: v("ok"), 600: v("ok") },
        apple: {
          blue: v("accent-text"),
          blueDark: v("accent"),
          ink: v("fg"),
          muted: v("z-400"),
          parchment: v("z-950"),
          hairline: v("z-800"),
          tile: v("z-900")
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 0 rgb(var(--z-50) / 0.04) inset, 0 12px 32px -16px rgb(0 0 0 / 0.45)",
        lift: "0 22px 48px -20px rgb(var(--accent) / 0.35)",
        pop: "0 24px 60px -24px rgb(0 0 0 / 0.6)"
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        bump: { "0%,100%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" } }
      },
      animation: {
        marquee: "marquee 42s linear infinite",
        shimmer: "shimmer 2.2s linear infinite",
        bump: "bump 0.35s ease-out"
      }
    }
  },
  plugins: []
};
