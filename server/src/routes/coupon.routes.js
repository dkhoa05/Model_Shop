import express from "express";
import mongoose from "mongoose";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { resolveCouponDiscount } from "../services/couponResolve.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

function describeCoupon(c) {
  const n = Array.isArray(c.applicableProductIds) ? c.applicableProductIds.length : 0;
  const scope = n > 0 ? ` — ${n} sản phẩm` : "";
  if (c.description && String(c.description).trim()) return String(c.description).trim() + scope;
  if (c.type === "percent") {
    let s = `Giảm ${c.value}%`;
    if (c.maxDiscountAmount != null) s += ` tối đa ${Number(c.maxDiscountAmount).toLocaleString("vi-VN")} ₫`;
    if (c.minOrderSubtotal > 0) s += ` (đơn từ ${Number(c.minOrderSubtotal).toLocaleString("vi-VN")} ₫)`;
    return s + scope;
  }
  let s = `Giảm ${Number(c.value).toLocaleString("vi-VN")} ₫`;
  if (c.minOrderSubtotal > 0) s += ` (đơn từ ${Number(c.minOrderSubtotal).toLocaleString("vi-VN")} ₫)`;
  return s + scope;
}

function normalizePreviewLines(lines) {
  if (!Array.isArray(lines)) return [];
  const out = [];
  for (const row of lines) {
    const product = row?.product != null ? String(row.product).trim() : "";
    const q = Number(row?.quantity);
    const price = Number(row?.price);
    if (!product || !mongoose.Types.ObjectId.isValid(product)) continue;
    if (!Number.isFinite(q) || q < 1 || !Number.isFinite(price) || price < 0) continue;
    out.push({ product, quantity: Math.floor(q), price });
  }
  return out;
}

/** Gợi ý mã đang hoạt động (trang checkout) — chỉ khi đã đăng nhập */
router.get("/hints", auth, async (req, res) => {
  try {
    const now = new Date();
    const list = await Coupon.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    })
      .select("code description type value maxDiscountAmount minOrderSubtotal usageLimit usedCount applicableProductIds")
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const usedCodes = await Order.distinct("couponCode", {
      user: req.user._id,
      couponCode: { $nin: [null, ""] }
    });
    const usedSet = new Set(
      usedCodes.map((x) => String(x).trim().toUpperCase()).filter(Boolean)
    );

    const hints = list
      .filter((c) => c.usageLimit == null || Number(c.usedCount) < Number(c.usageLimit))
      .filter((c) => !usedSet.has(String(c.code).toUpperCase()))
      .slice(0, 40)
      .map((c) => ({ code: c.code, desc: describeCoupon(c) }));
    return res.json({ hints });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/coupons/preview?code=&subtotal=
 * Chỉ đúng với mã không giới hạn sản phẩm. Mã theo SP dùng POST /preview.
 */
router.get("/preview", auth, async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const subtotal = Number(req.query.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ message: "subtotal không hợp lệ" });
    }
    const r = await resolveCouponDiscount(code, subtotal, null, req.user._id);
    return res.json({
      discount: r.discount,
      normalizedCode: r.normalizedCode,
      error: r.error || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/coupons/preview
 * Body: { code, lines: [{ product, quantity, price }] }
 */
router.post("/preview", auth, async (req, res) => {
  try {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    const lines = normalizePreviewLines(req.body?.lines);
    const fullSub = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const r = await resolveCouponDiscount(code, fullSub, lines.length ? lines : null, req.user._id);
    return res.json({
      discount: r.discount,
      normalizedCode: r.normalizedCode,
      error: r.error || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
