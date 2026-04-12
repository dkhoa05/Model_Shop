import { API_BASE } from "../services/api.js";

/**
 * Origin của server API (không có /api) — dùng cho ảnh tĩnh `/uploads/...`.
 * - `VITE_API_BASE` dạng `http://host:port/api` → `http://host:port`
 * - `VITE_API_BASE` dạng `/api` (relative): dùng `VITE_PUBLIC_UPLOAD_ORIGIN` / `VITE_SERVER_ORIGIN`,
 *   hoặc `window.location.origin` (khi dev proxy `/uploads` → backend)
 */
export function getServerOrigin() {
  const base = String(API_BASE || "").trim();
  if (/^https?:\/\//i.test(base)) {
    const origin = base.replace(/\/api\/?$/, "");
    if (
      import.meta.env.DEV &&
      typeof window !== "undefined" &&
      (origin === "http://localhost:5000" || origin === "http://127.0.0.1:5000")
    ) {
      const h = window.location.hostname;
      if (h === "localhost" || h === "127.0.0.1") return "";
    }
    return origin;
  }
  const explicit = (
    import.meta.env.VITE_PUBLIC_UPLOAD_ORIGIN ||
    import.meta.env.VITE_SERVER_ORIGIN ||
    ""
  ).trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function normalizeUploadPath(s) {
  const t = String(s).trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      if (u.pathname.startsWith("/api/uploads")) {
        u.pathname = u.pathname.replace(/^\/api\/uploads/, "/uploads");
        return u.toString();
      }
    } catch {
      /* ignore */
    }
    return t;
  }
  if (t.startsWith("/api/uploads")) return t.replace(/^\/api\/uploads/, "/uploads");
  return t;
}

function rewriteLocalhost5000UploadsToRelative(url) {
  if (!import.meta.env.DEV || typeof window === "undefined") return url;
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith("/uploads")) return url;
    if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return url;
    if (u.port !== "5000") return url;
    const wh = window.location.hostname;
    if (wh !== "localhost" && wh !== "127.0.0.1") return url;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return url;
  }
}

export function resolvePublicUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  let s = normalizeUploadPath(String(pathOrUrl).trim());
  if (/^https?:\/\//i.test(s)) {
    const rel = rewriteLocalhost5000UploadsToRelative(s);
    if (/^https?:\/\//i.test(rel)) return rel;
    s = rel;
  }
  const origin = getServerOrigin();
  const path = s.startsWith("/") ? s : `/${s}`;
  if (!origin) return path;
  return `${origin}${path}`;
}
