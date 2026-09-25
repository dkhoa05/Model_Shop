import { User } from "../models/User.js";
import { extractToken, resolveUser } from "../utils/authToken.js";

/** Gắn req.user nếu có phiên hợp lệ; không có vẫn next (khách vãng lai) */
export const optionalAuth = async (req, res, next) => {
  req.user = null;
  const { token } = extractToken(req);
  if (!token) return next();
  try {
    const r = await resolveUser(token, User);
    if (r.user) req.user = r.user;
  } catch {
    /* token không hợp lệ → coi như khách */
  }
  next();
};
