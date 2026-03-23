import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { auth, isAdmin } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import {
  STORE_PICKUP_ADDRESS,
  SHIPPING_FLAT_FEE,
  FREE_SHIPPING_THRESHOLD,
  applyCoupon
} from "../constants/checkout.js";

const router = express.Router();

/** Chuẩn hóa id sản phẩm từ body (string hoặc { _id } / { $oid }) */
function normalizeProductIdFromBody(val) {
  if (val == null) return "";
  if (typeof val === "object") {
    if (val._id != null) return String(val._id).trim();
    if (val.$oid != null) return String(val.$oid).trim();
    return "";
  }
  return String(val).trim();
}

/** Tra cứu đơn khách (không đăng nhập): khớp mã đơn + SĐT */
router.get("/guest/:id", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({ message: "Cần số điện thoại để tra cứu đơn" });
    }
    const order = await Order.findOne({
      _id: req.params.id,
      user: null,
      phone: phone.trim()
    })
      .populate("items.product")
      .lean();
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      items,
      address,
      phone,
      paymentMethod,
      deliveryType,
      couponCode,
      recipientName,
      guestEmail,
      addressProvince,
      addressDistrict,
      addressWard,
      addressDetail
    } = req.body;
    if (!items?.length) {
      return res.status(400).json({ message: "Order items are required" });
    }
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({ message: "Phone is required" });
    }
    const isGuest = !req.user;
    if (isGuest && (!recipientName || typeof recipientName !== "string" || !recipientName.trim())) {
      return res.status(400).json({ message: "Họ tên người nhận là bắt buộc khi chưa đăng nhập" });
    }
    const recipient = recipientName?.trim() || req.user?.name || "";
    if (!recipient) {
      return res.status(400).json({ message: "Thiếu họ tên người nhận" });
    }

    const dt = deliveryType === "pickup" ? "pickup" : "delivery";
    let finalAddress = dt === "pickup" ? STORE_PICKUP_ADDRESS : "";
    if (dt === "delivery") {
      const parts = [
        addressDetail?.trim(),
        addressWard?.trim(),
        addressDistrict?.trim(),
        addressProvince?.trim()
      ].filter(Boolean);
      if (parts.length >= 2) {
        finalAddress = parts.join(", ");
      } else {
        finalAddress = String(address || "").trim();
      }
      if (!finalAddress) {
        return res.status(400).json({ message: "Địa chỉ giao hàng là bắt buộc khi chọn giao tận nơi" });
      }
    }
    const pm = String(paymentMethod || "cod");
    const allowedPm = ["cod", "bank_transfer", "momo", "zalopay"];
    if (!allowedPm.includes(pm)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let subtotal = 0;
    const normalizedItems = [];
    for (const rawItem of items) {
      const { product: rawProductRef, quantity } = rawItem || {};
      const productIdStr = normalizeProductIdFromBody(rawProductRef);
      if (!productIdStr || !Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
        return res.status(400).json({ message: "Invalid order item" });
      }
      if (!mongoose.Types.ObjectId.isValid(productIdStr)) {
        return res.status(400).json({ message: "Mã sản phẩm trong đơn không hợp lệ" });
      }

      let product;
      try {
        product = await Product.findById(productIdStr);
      } catch {
        return res.status(400).json({ message: "Mã sản phẩm trong đơn không hợp lệ" });
      }
      if (!product) {
        return res.status(400).json({
          message:
            "Một hoặc nhiều mô hình không còn trong hệ thống (giỏ có thể lưu mã cũ). Vui lòng xóa giỏ và thêm lại từ danh mục."
        });
      }
      if (product.stock < Number(quantity)) {
        return res
          .status(400)
          .json({ message: `Not enough stock for product: ${product.name}` });
      }

      subtotal += product.price * Number(quantity);
      normalizedItems.push({
        product: product._id,
        quantity: Number(quantity),
        price: product.price
      });
    }

    const { discount: discountAmount, normalizedCode: appliedCoupon } = applyCoupon(
      typeof couponCode === "string" ? couponCode : "",
      subtotal
    );

    let shippingFee = 0;
    if (dt === "delivery") {
      shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
    }

    const totalPrice = Math.max(0, subtotal - discountAmount + shippingFee);

    const order = await Order.create({
      user: req.user?._id || null,
      recipientName: recipient,
      guestEmail: guestEmail && typeof guestEmail === "string" ? guestEmail.trim() : "",
      addressProvince: dt === "delivery" ? String(addressProvince || "").trim() : "",
      addressDistrict: dt === "delivery" ? String(addressDistrict || "").trim() : "",
      addressWard: dt === "delivery" ? String(addressWard || "").trim() : "",
      addressDetail: dt === "delivery" ? String(addressDetail || "").trim() : "",
      items: normalizedItems,
      subtotal,
      shippingFee,
      discountAmount,
      couponCode: appliedCoupon,
      deliveryType: dt,
      address: finalAddress,
      phone: phone.trim(),
      totalPrice,
      paymentMethod: pm,
      paymentStatus: "unpaid",
      paymentRef: `MS${String(Date.now()).slice(-8)}-${req.user?._id ? String(req.user._id).slice(-4) : "GUEST"}`
    });

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: confirm payment received
router.put("/:id/payment", auth, isAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body || {};
    const allowed = ["unpaid", "paid"];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid paymentStatus" });
    }
    const update = {
      paymentStatus,
      paidAt: paymentStatus === "paid" ? new Date() : null
    };
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Customer: submit payment proof (image url) for non-COD orders — khách gửi kèm phone
router.post("/:id/payment-proof", optionalAuth, async (req, res) => {
  try {
    const { url, phone } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Thiếu url ảnh minh chứng" });
    }
    let order;
    if (req.user) {
      order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    } else {
      if (!phone || typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({ message: "Cần số điện thoại để xác nhận đơn khách" });
      }
      order = await Order.findOne({ _id: req.params.id, user: null, phone: phone.trim() });
    }
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Đơn đã hủy, không thể gửi minh chứng" });
    }
    if (order.paymentMethod === "cod") {
      return res.status(400).json({ message: "COD không cần minh chứng" });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Đơn đã được xác nhận thanh toán" });
    }

    order.paymentProofUrl = url.trim();
    order.paymentProofSubmittedAt = new Date();
    await order.save();

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Customer cancels their own pending order (khách gửi kèm phone trong body)
router.post("/:id/cancel", optionalAuth, async (req, res) => {
  try {
    const { phone } = req.body || {};
    let order;
    if (req.user) {
      order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    } else {
      if (!phone || typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({ message: "Cần số điện thoại để hủy đơn khách" });
      }
      order = await Order.findOne({ _id: req.params.id, user: null, phone: phone.trim() });
    }
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Chỉ có thể hủy khi đơn đang chờ xử lý" });
    }
    order.status = "cancelled";
    await order.save();
    for (const item of order.items || []) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const prev = await Order.findById(req.params.id);
    if (!prev) return res.status(404).json({ message: "Order not found" });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // If admin cancels an order that wasn't cancelled before, restock items.
    if (prev.status !== "cancelled" && status === "cancelled") {
      for (const item of prev.items || []) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
