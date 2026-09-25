import { User } from "../models/User.js";
import { extractToken, resolveUser } from "../utils/authToken.js";

export const auth = async (req, res, next) => {
  const { token } = extractToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const r = await resolveUser(token, User);
    if (r.error) return res.status(r.status).json({ message: r.error });
    req.user = r.user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/** Vai trò nội bộ: admin (toàn quyền), staff (bán hàng/kho), accountant (kế toán/duyệt hoàn tiền) */
export const BACKOFFICE_ROLES = ["admin", "staff", "accountant"];

export const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Forbidden: không đủ quyền" });
  }
  next();
};

export const isAdmin = allow("admin");
export const isStaff = allow("admin", "staff");
export const isFinance = allow("admin", "accountant");
export const isBackoffice = allow(...BACKOFFICE_ROLES);
