import mongoose from "mongoose";

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** router.param("id", validateObjectId) → 400 thay vì CastError 500 */
export function validateObjectId(req, res, next, value) {
  if (!mongoose.Types.ObjectId.isValid(value) || String(new mongoose.Types.ObjectId(value)) !== String(value)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  next();
}

export function parsePaging(query, { defaultLimit = 24, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
