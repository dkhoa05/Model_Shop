import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { auth, isAdmin } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import {
  STORE_PICKUP_ADDRESS,
  SHIPPING_FLAT_FEE,
  FREE_SHIPPING_THRESHOLD
} from "../constants/checkout.js";
import { Coupon } from "../models/Coupon.js";
import { resolveCouponDiscount } from "../services/couponResolve.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";
import {
  sendPaymentSuccessEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail
} from "../services/mail.js";

const router = express.Router();

function resolveCustomerEmail(order) {
  if (order.user && typeof order.user === "object" && order.user.email) {
    return String(order.user.email).trim();
  }
  if (order.guestEmail) return String(order.guestEmail).trim();
  return "";
}

/** Gửi email bất đồng bộ; ghi log nếu thiếu email / SMTP / lỗi gửi */
function queueOrderCustomerEmail(order, sendFn, context) {
  const to = resolveCustomerEmail(order);
  if (!to) {
    console.warn(
      `[mail] ${context}: bỏ qua — không có email khách (nhập email khi đặt hoặc đăng nhập tài khoản có email). Mã: ${order.paymentRef || order._id}`
    );
    return;
  }
  const recipientName =
    order.recipientName?.trim() ||
    (order.user && typeof order.user === "object" ? order.user.name?.trim() : "") ||
    "";
  sendFn({ to, recipientName, order })
    .then((r) => {
      if (r && !r.sent) {
        console.warn(
          `[mail] ${context}: không gửi được (${r.reason || "unknown"}) — kiểm tra SMTP trong server/.env. Mã: ${order.paymentRef || order._id}`
        );
      }
    })
    .catch((err) => console.error(`[mail] ${context}:`, err));
}

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

/** `items.product` có thể là ObjectId hoặc document đã populate */
function getOrderItemProductId(item) {
  const p = item?.product;
  if (p == null) return null;
  if (typeof p === "object" && p._id != null) return p._id;
  return p;
}

async function rollbackStockDecrements(rows) {
  for (const row of [...rows].reverse()) {
    const pid = getOrderItemProductId(row) ?? row.product;
    if (pid == null) continue;
    await Product.findByIdAndUpdate(pid, { $inc: { stock: row.quantity } });
  }
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

    const rawCouponInput = typeof couponCode === "string" ? couponCode : "";
    if (rawCouponInput.trim() && !req.user) {
      return res.status(400).json({ message: "Vui lòng đăng nhập để sử dụng mã giảm giá." });
    }
    const lineItemsForCoupon = normalizedItems.map((i) => ({
      product: String(i.product),
      quantity: i.quantity,
      price: i.price
    }));
    const resolved = await resolveCouponDiscount(
      rawCouponInput,
      subtotal,
      lineItemsForCoupon,
      req.user?._id
    );
    if (rawCouponInput.trim() && !resolved.normalizedCode) {
      return res.status(400).json({
        message: resolved.error || "Mã giảm giá không hợp lệ hoặc không áp dụng được cho đơn này."
      });
    }
    const discountAmount = resolved.discount;
    const appliedCoupon = resolved.normalizedCode;
    const appliedCouponId = resolved.coupon?._id ? String(resolved.coupon._id) : null;

    let shippingFee = 0;
    if (dt === "delivery") {
      shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
    }

    const totalPrice = Math.max(0, subtotal - discountAmount + shippingFee);

    /** Trừ kho nguyên tử (tránh race + đảm bảo không tạo đơn nếu không đủ hàng) */
    const decremented = [];
    try {
      for (const item of normalizedItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: false }
        );
        if (!updated) {
          await rollbackStockDecrements(decremented);
          const p = await Product.findById(item.product).select("name stock");
          const name = p?.name || "sản phẩm";
          return res.status(400).json({
            message:
              p && p.stock < item.quantity
                ? `Không đủ tồn kho cho: ${name} (còn ${p.stock}, cần ${item.quantity}).`
                : `Không thể trừ tồn kho cho: ${name}.`
          });
        }
        decremented.push({ product: item.product, quantity: item.quantity });
      }

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
        await InventoryMovement.create({
          product: item.product,
          type: "out",
          quantity: item.quantity,
          reason: "sale",
          note: `Order ${order.paymentRef || order._id}`,
          refType: "order",
          refId: String(order._id),
          createdBy: req.user?._id || null
        });
      }

      if (appliedCouponId) {
        await Coupon.findByIdAndUpdate(appliedCouponId, { $inc: { usedCount: 1 } });
      }

      return res.status(201).json(order);
    } catch (err) {
      await rollbackStockDecrements(decremented);
      if (err?.code === 11000 && rawCouponInput.trim() && req.user) {
        return res.status(400).json({
          message: "Bạn đã sử dụng mã giảm giá này rồi — mỗi tài khoản chỉ áp dụng một lần."
        });
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
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
    const prev = await Order.findById(req.params.id);
    if (!prev) return res.status(404).json({ message: "Order not found" });

    const update = {
      paymentStatus,
      paidAt: paymentStatus === "paid" ? new Date() : null
    };
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("user", "email name")
      .populate("items.product", "name");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (paymentStatus === "paid" && prev.paymentStatus !== "paid") {
      queueOrderCustomerEmail(order, sendPaymentSuccessEmail, "payment paid");
    }

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
      const pid = getOrderItemProductId(item);
      if (pid) {
        await Product.findByIdAndUpdate(pid, { $inc: { stock: item.quantity } });
        await InventoryMovement.create({
          product: pid,
          type: "in",
          quantity: item.quantity,
          reason: "return",
          note: `Customer cancelled order ${order.paymentRef || order._id}`,
          refType: "order",
          refId: String(order._id),
          createdBy: req.user?._id || null
        });
      }
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

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate("user", "email name")
      .populate("items.product", "name");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // If admin cancels an order that wasn't cancelled before, restock items.
    if (prev.status !== "cancelled" && status === "cancelled") {
      for (const item of prev.items || []) {
        const pid = getOrderItemProductId(item);
        if (pid) {
          await Product.findByIdAndUpdate(pid, { $inc: { stock: item.quantity } });
          await InventoryMovement.create({
            product: pid,
            type: "in",
            quantity: item.quantity,
            reason: "return",
            note: `Admin cancelled order ${order.paymentRef || order._id}`,
            refType: "order",
            refId: String(order._id),
            createdBy: req.user?._id || null
          });
        }
      }
      queueOrderCustomerEmail(order, sendOrderCancelledEmail, "cancelled (admin)");
    }

    if (prev.status !== "delivered" && status === "delivered") {
      queueOrderCustomerEmail(order, sendOrderDeliveredEmail, "delivered");
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: create refund approval request for paid order
router.post("/:id/refund-request", auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Only paid orders can request refund" });
    }
    if (order.refundStatus === "refunded") {
      return res.status(400).json({ message: "Order already refunded" });
    }
    if (order.refundApprovalRequest) {
      const oldApproval = await ApprovalRequest.findById(order.refundApprovalRequest);
      if (oldApproval && oldApproval.status === "pending") {
        return res.status(400).json({ message: "Refund approval already pending" });
      }
    }

    const amount = Number(order.totalPrice || 0);
    const requiredApprovals = amount >= 5000000 ? 2 : 1;
    const approval = await ApprovalRequest.create({
      type: "refund",
      title: `Refund ${order.paymentRef || order._id}`,
      payload: { orderId: String(order._id), amount },
      requiredApprovals,
      requestedBy: req.user?._id || null
    });

    order.refundStatus = "pending_approval";
    order.refundAmount = amount;
    order.refundApprovalRequest = approval._id;
    await order.save();
    return res.status(201).json({ order, approval });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: execute refund after approval
router.post("/:id/refund/execute", auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.refundApprovalRequest) {
      return res.status(400).json({ message: "Refund approval request is missing" });
    }
    if (order.refundStatus === "refunded") {
      return res.status(400).json({ message: "Order already refunded" });
    }
    const approval = await ApprovalRequest.findById(order.refundApprovalRequest);
    if (!approval || approval.status !== "approved") {
      return res.status(400).json({ message: "Refund approval is not approved yet" });
    }

    order.refundStatus = "refunded";
    order.refundedAt = new Date();
    await order.save();
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
