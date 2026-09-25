export const isProd = () => process.env.NODE_ENV === "production";

export const COOKIE_NAME = "ms_token";
const DEV_SECRET = "dev_secret_change_me";

/** JWT secret: bắt buộc ở production; dev dùng secret tạm để chạy local. */
export function getJwtSecret() {
  const s = (process.env.JWT_SECRET || "").trim();
  if (s) return s;
  if (isProd()) throw new Error("JWT_SECRET is required in production");
  return DEV_SECRET;
}

/** Gọi khi khởi động: dừng server nếu cấu hình production không an toàn. */
export function assertProductionConfig() {
  if (!isProd()) return;
  const problems = [];
  const s = (process.env.JWT_SECRET || "").trim();
  if (s.length < 32) problems.push("JWT_SECRET phải có ít nhất 32 ký tự");
  if (!process.env.MONGODB_URI) problems.push("MONGODB_URI là bắt buộc");
  if (!parseList(process.env.CORS_ORIGINS).length) problems.push("CORS_ORIGINS là bắt buộc (danh sách origin, phân tách bằng dấu phẩy)");
  if (problems.length) {
    console.error("[config] Cấu hình production không hợp lệ:\n - " + problems.join("\n - "));
    process.exit(1);
  }
}

function parseList(v) {
  return String(v || "")
    .split(",")
    .map((x) => x.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function allowedOrigins() {
  const list = parseList(process.env.CORS_ORIGINS);
  if (list.length) return list;
  if (isProd()) return [];
  return ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"];
}

export function isAllowedOrigin(origin) {
  return Boolean(origin) && allowedOrigins().includes(String(origin).replace(/\/$/, ""));
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function cookieOptions() {
  const prod = isProd();
  const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  const opts = {
    httpOnly: true,
    secure: prod || sameSite === "none",
    sameSite,
    path: "/",
    maxAge: WEEK_MS
  };
  if (process.env.COOKIE_DOMAIN) opts.domain = process.env.COOKIE_DOMAIN;
  return opts;
}
