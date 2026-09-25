import express from "express";
import mongoose from "mongoose";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Coupon } from "../models/Coupon.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";

const router = express.Router();
const DISCOUNT_APPROVAL_PERCENT_THRESHOLD = 50;
const DISCOUNT_APPROVAL_FIXED_THRESHOLD = 2000000;

function parseApplicableProductIds(raw) {
  if (raw == null) return undefined;
  const arr = Array.isArray(raw) ? raw : [];
  const ids = [...new Set(arr.map((x) => String(x).trim()).filter((id) => mongoose.Types.ObjectId.isValid(id)))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  return ids;
}

router.get("/coupons", auth, isAdmin, async (req, res) => {
  try {
    const list = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/coupons", auth, isAdmin, async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      maxDiscountAmount,
      minOrderSubtotal,
      active,
      expiresAt,
      usageLimit,
      description,
      applicableProductIds
    } = req.body || {};

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ message: "Mã coupon là bắt buộc" });
    }
    if (!["percent", "fixed"].includes(type)) {
      return res.status(400).json({ message: "Loại giảm: percent hoặc fixed" });
    }
    const val = Number(value);
    if (!Number.isFinite(val) || val < 0) {
      return res.status(400).json({ message: "Giá trị giảm không hợp lệ" });
    }
    if (type === "percent" && (val < 1 || val > 100)) {
      return res.status(400).json({ message: "Phần trăm giảm nên từ 1 đến 100" });
    }

    let expDate = null;
    if (expiresAt) {
      expDate = new Date(String(expiresAt));
      if (Number.isNaN(expDate.getTime())) {
        return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
      }
    }

    const productIds = parseApplicableProductIds(applicableProductIds);

    const requiresApproval =
      (type === "percent" && val >= DISCOUNT_APPROVAL_PERCENT_THRESHOLD) ||
      (type === "fixed" && val >= DISCOUNT_APPROVAL_FIXED_THRESHOLD);

    const doc = await Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value: type === "fixed" ? Math.floor(val) : val,
      maxDiscountAmount:
        type === "percent" && maxDiscountAmount != null && maxDiscountAmount !== ""
          ? Math.max(0, Math.floor(Number(maxDiscountAmount)))
          : null,
      minOrderSubtotal: Math.max(0, Math.floor(Number(minOrderSubtotal) || 0)),
      active: requiresApproval ? false : active !== false,
      expiresAt: expDate,
      usageLimit:
        usageLimit != null && usageLimit !== "" ? Math.max(1, Math.floor(Number(usageLimit))) : null,
      description: typeof description === "string" ? description.trim() : "",
      applicableProductIds: productIds !== undefined ? productIds : [],
      requiresApproval,
      approvalRequest: null
    });
    if (requiresApproval) {
      const approval = await ApprovalRequest.create({
        type: "discount",
        title: `Approve coupon ${doc.code}`,
        payload: {
          couponId: String(doc._id),
          code: doc.code,
          type,
          value: val,
          minOrderSubtotal: Number(minOrderSubtotal) || 0
        },
        requiredApprovals: 2,
        requestedBy: req.user?._id || null
      });
      doc.approvalRequest = approval._id;
      await doc.save();
    }
    return res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Mã coupon đã tồn tại" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/coupons/:id", auth, isAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const existing = await Coupon.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });

    const {
      code,
      type,
      value,
      maxDiscountAmount,
      minOrderSubtotal,
      active,
      expiresAt,
      usageLimit,
      description,
      applicableProductIds
    } = req.body || {};

    const update = {};
    if (typeof code === "string" && code.trim()) update.code = code.trim().toUpperCase();
    if (type !== undefined) {
      if (!["percent", "fixed"].includes(type)) {
        return res.status(400).json({ message: "Loại giảm: percent hoặc fixed" });
      }
      update.type = type;
    }
    const nextType = update.type ?? existing.type;
    if (value !== undefined) {
      const val = Number(value);
      if (!Number.isFinite(val) || val < 0) {
        return res.status(400).json({ message: "Giá trị giảm không hợp lệ" });
      }
      update.value = nextType === "fixed" ? Math.floor(val) : val;
    }
    if (maxDiscountAmount !== undefined) {
      update.maxDiscountAmount =
        maxDiscountAmount === null || maxDiscountAmount === ""
          ? null
          : Math.max(0, Math.floor(Number(maxDiscountAmount)));
    }
    if (minOrderSubtotal !== undefined) {
      update.minOrderSubtotal = Math.max(0, Math.floor(Number(minOrderSubtotal) || 0));
    }
    if (typeof active === "boolean") update.active = active;
    if (expiresAt !== undefined) {
      if (!expiresAt) {
        update.expiresAt = null;
      } else {
        const d = new Date(String(expiresAt));
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
        }
        update.expiresAt = d;
      }
    }
    if (usageLimit !== undefined) {
      update.usageLimit =
        usageLimit === null || usageLimit === "" ? null : Math.max(1, Math.floor(Number(usageLimit)));
    }
    if (typeof description === "string") update.description = description.trim();
    if (applicableProductIds !== undefined) {
      update.applicableProductIds = parseApplicableProductIds(applicableProductIds) ?? [];
    }

    const doc = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return res.json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Mã coupon đã tồn tại" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/coupons/:id", auth, isAdmin, async (req, res) => {
  try {
    const doc = await Coupon.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    return res.json({ message: "Đã xóa" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
