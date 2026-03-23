import { API_BASE } from "../services/api.js";

/** Origin của server API (không có /api) — dùng cho ảnh tĩnh /uploads */
export function getServerOrigin() {
  return String(API_BASE || "").replace(/\/api\/?$/, "");
}

/** Đường dẫn tương đối /uploads/... hoặc URL đầy đủ */
export function resolvePublicUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const origin = getServerOrigin();
  if (!origin) return s.startsWith("/") ? s : `/${s}`;
  return `${origin}${s.startsWith("/") ? "" : "/"}${s}`;
}
