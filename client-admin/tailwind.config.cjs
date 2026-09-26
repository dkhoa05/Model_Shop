/**
 * Cùng hệ token với web khách (xem src/index.css). Các thang màu cũ (slate, gray, rose, cyan, indigo...) được ánh xạ
 * sang token để các trang admin cũ tự thích ứng sáng/tối mà không phải viết lại từng class.
 */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const neutral = Object.fromEntries(STEPS.map((s) => [s, v(`z-${s}`)]));
const accent = {
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
const ok = { 50: v("ok-text"), 100: v("ok-text"), 200: v("ok-text"), 300: v("ok-text"), 400: v("ok-text"), 500: v("ok"), 600: v("ok"), 700: v("ok"), 800: v("ok"), 900: v("ok") };
const warn = { 50: v("warn-text"), 100: v("warn-text"), 200: v("warn-text"), 300: v("warn-text"), 400: v("warn-text"), 500: v("warn"), 600: v("warn"), 700: v("warn"), 800: v("warn"), 900: v("warn") };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        zinc: neutral,
        slate: neutral,
        gray: neutral,
        neutral,
        stone: neutral,
        fg: v("fg"),
        "on-accent": v("accent-fg"),
        accent: { DEFAULT: v("accent"), text: v("accent-text"), strong: v("accent-strong") },
        red: accent,
        rose: accent,
        pink: accent,
        cyan: accent,
        sky: accent,
        blue: accent,
        indigo: accent,
        violet: accent,
        purple: accent,
        orange: accent,
        emerald: ok,
        green: ok,
        teal: ok,
        amber: warn,
        yellow: warn
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        pop: "0 24px 60px -24px rgb(0 0 0 / 0.6)"
      }
    }
  },
  plugins: []
};
