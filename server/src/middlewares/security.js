import rateLimit from "express-rate-limit";
import { COOKIE_NAME, isAllowedOrigin } from "../config/env.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Chống CSRF cho request dùng cookie: yêu cầu thay đổi dữ liệu phải có
 * Origin/Referer thuộc CORS_ORIGINS. (Kết hợp SameSite cookie.)
 */
export function csrfGuard(req, res, next) {
  if (SAFE.has(req.method) || !req.cookies?.[COOKIE_NAME]) return next();
  let origin = req.headers.origin;
  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {
      origin = "";
    }
  }
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ message: "Origin không hợp lệ" });
  }
  next();
}

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: message || "Quá nhiều yêu cầu, vui lòng thử lại sau." }
  });

const MIN = 60 * 1000;
export const apiLimiter = make(MIN, 300);
export const loginLimiter = make(15 * MIN, 10, "Đăng nhập sai quá nhiều lần, thử lại sau 15 phút.");
export const registerLimiter = make(60 * MIN, 10, "Quá nhiều lượt đăng ký, thử lại sau.");
export const forgotLimiter = make(60 * MIN, 5, "Quá nhiều yêu cầu đặt lại mật khẩu, thử lại sau.");
export const guestLookupLimiter = make(15 * MIN, 20);
export const uploadLimiter = make(10 * MIN, 20, "Tải lên quá nhiều, thử lại sau.");
export const aiLimiter = make(MIN, 20);
