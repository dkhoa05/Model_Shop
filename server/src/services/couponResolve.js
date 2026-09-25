import mongoose from "mongoose";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";

/** Đã có đơn (cùng user) áp mã này chưa — so sánh mã không phân biệt hoa thường */
async function userAlreadyUsedCoupon(userId, normalizedCode) {
  if (!userId || !normalizedCode) return false;
  const idStr = String(userId);
  if (!mongoose.Types.ObjectId.isValid(idStr)) return false;
  const uid = new mongoose.Types.ObjectId(idStr);
  const codeNorm = String(normalizedCode).trim().toUpperCase();
  const found = await Order.findOne({
    user: uid,
    $expr: { $eq: [{ $toUpper: { $ifNull: ["$couponCode", ""] } }, codeNorm] }
  })
    .select("_id")
    .lean();
  return Boolean(found);
}

/**
 * Tổng tiền hàng được tính vào mã: toàn giỏ hoặc chỉ các SP được chọn.
 * @param {{ product: string, quantity: number, price: number }[]} lineItems
 * @param {unknown[]} applicableProductIds — ObjectId hoặc string
 */
export function eligibleSubtotalForCoupon(lineItems, applicableProductIds) {
  if (!lineItems?.length) return 0;
  const ids = (applicableProductIds || []).map((id) => String(id)).filter(Boolean);
  if (!ids.length) {
    return lineItems.reduce((s, row) => s + Number(row.price) * Number(row.quantity), 0);
  }
  const set = new Set(ids);
  return lineItems.reduce((s, row) => {
    const pid = String(row.product);
    if (set.has(pid)) return s + Number(row.price) * Number(row.quantity);
    return s;
  }, 0);
}

function couponHasProductRestriction(doc) {
  return Array.isArray(doc.applicableProductIds) && doc.applicableProductIds.length > 0;
}

/** @param {object | null} coupon — document Coupon (.lean()) */
export function computeDiscountFromCoupon(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.type === "percent") {
    const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0));
    const raw = Math.floor((subtotal * pct) / 100);
    const cap =
      coupon.maxDiscountAmount != null && Number.isFinite(coupon.maxDiscountAmount)
        ? Math.min(raw, Math.max(0, coupon.maxDiscountAmount))
        : raw;
    return Math.min(Math.max(0, cap), subtotal);
  }
  if (coupon.type === "fixed") {
    const v = Math.max(0, Number(coupon.value) || 0);
    return Math.min(v, subtotal);
  }
  return 0;
}

/**
 * @param {string} code
 * @param {number} fullSubtotal — tổng tiền hàng cả giỏ (ship tính riêng)
 * @param {{ product: string, quantity: number, price: number }[] | null} lineItems — bắt buộc nếu mã giới hạn sản phẩm
 * @param {import("mongoose").Types.ObjectId | string | null | undefined} userId — nếu có: mỗi user chỉ dùng mỗi mã một lần
 * @returns {Promise<{ discount: number, normalizedCode: string, coupon: object | null, error?: string }>}
 */
export async function resolveCouponDiscount(code, fullSubtotal, lineItems = null, userId = null) {
  if (!code || typeof code !== "string") {
    return { discount: 0, normalizedCode: "", coupon: null };
  }
  const c = code.trim().toUpperCase();
  if (!c) return { discount: 0, normalizedCode: "", coupon: null };

  const full = Math.max(0, Number(fullSubtotal) || 0);
  const doc = await Coupon.findOne({ code: c }).lean();

  if (doc && !doc.active) {
    return { discount: 0, normalizedCode: "", coupon: null, error: "Mã giảm giá không còn hiệu lực." };
  }

  if (doc) {
    const now = new Date();
    if (doc.expiresAt && new Date(doc.expiresAt) < now) {
      return { discount: 0, normalizedCode: "", coupon: null, error: "Mã giảm giá đã hết hạn." };
    }
    if (doc.usageLimit != null && doc.usedCount >= doc.usageLimit) {
      return { discount: 0, normalizedCode: "", coupon: null, error: "Mã giảm giá đã hết lượt sử dụng." };
    }

    const restricted = couponHasProductRestriction(doc);
    let basis = full;
    if (restricted) {
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return {
          discount: 0,
          normalizedCode: "",
          coupon: null,
          error: "Mã này chỉ áp dụng một số sản phẩm — cần thông tin giỏ hàng để kiểm tra."
        };
      }
      basis = eligibleSubtotalForCoupon(lineItems, doc.applicableProductIds);
      if (basis <= 0) {
        return {
          discount: 0,
          normalizedCode: "",
          coupon: null,
          error: "Giỏ hàng không có sản phẩm thuộc mã giảm giá này."
        };
      }
    }

    const minSub = Number(doc.minOrderSubtotal) || 0;
    if (basis < minSub) {
      const scope = restricted ? "phần sản phẩm áp mã" : "tiền hàng";
      return {
        discount: 0,
        normalizedCode: "",
        coupon: null,
        error: `Tổng ${scope} cần tối thiểu ${minSub.toLocaleString("vi-VN")} ₫ để dùng mã này (hiện ${basis.toLocaleString("vi-VN")} ₫).`
      };
    }

    const discount = computeDiscountFromCoupon(doc, basis);
    if (await userAlreadyUsedCoupon(userId, doc.code)) {
      return {
        discount: 0,
        normalizedCode: "",
        coupon: null,
        error: "Bạn đã sử dụng mã này rồi — mỗi tài khoản chỉ áp dụng một lần."
      };
    }
    return { discount, normalizedCode: doc.code, coupon: doc };
  }

  return {
    discount: 0,
    normalizedCode: "",
    coupon: null,
    error: "Mã giảm giá không tồn tại hoặc không áp dụng được."
  };
}
