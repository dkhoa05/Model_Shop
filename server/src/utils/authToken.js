import jwt from "jsonwebtoken";
import { COOKIE_NAME, cookieOptions, getJwtSecret } from "../config/env.js";

export function signUserToken(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role, tv: user.tokenVersion || 0 },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res, user) {
  res.cookie(COOKIE_NAME, signUserToken(user), cookieOptions());
}

export function clearAuthCookie(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
}

export function extractToken(req) {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return { token: fromCookie, via: "cookie" };
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) return { token: h.split(" ")[1], via: "bearer" };
  return { token: "", via: "" };
}

/** Trả user hợp lệ (chưa bị chặn, tokenVersion khớp) hoặc null */
export async function resolveUser(token, UserModel) {
  const decoded = jwt.verify(token, getJwtSecret());
  const user = await UserModel.findById(decoded.id).select("-password");
  if (!user) return { error: "User not found", status: 401 };
  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) return { error: "Session expired", status: 401 };
  if (user.isBlocked) return { error: "Account is blocked", status: 403 };
  return { user };
}
