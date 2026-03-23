import { API_BASE } from "../services/api.js";

export function getServerOrigin() {
  return String(API_BASE || "").replace(/\/api\/?$/, "");
}

export function resolvePublicUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const origin = getServerOrigin();
  if (!origin) return s.startsWith("/") ? s : `/${s}`;
  return `${origin}${s.startsWith("/") ? "" : "/"}${s}`;
}
