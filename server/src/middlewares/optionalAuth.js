import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/** Gắn req.user nếu có Bearer hợp lệ; không có token vẫn next (khách) */
export const optionalAuth = async (req, res, next) => {
  req.user = null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (user && !user.isBlocked) req.user = user;
  } catch {
    /* ignore invalid token for guest checkout */
  }
  next();
};
