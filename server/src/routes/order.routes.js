import express from "express";
import { validateObjectId } from "../utils/validate.js";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { auth, isAdmin, isBackoffice, isFinance, isStaff } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { guestLookupLimiter } from "../middlewares/security.js";
import {
  storePickupAddress,
  shippingFlatFee,
  freeShippingThreshold,
  MAX_ITEM_QUANTITY
} from "../constants/checkout.js";
import crypto from "crypto";
import { getEnabledPaymentMethods } from "../services/paymentMethods.js";
import { syncOrderAccounting, postRefundJournals } from "../services/accounting.js";
import { HttpError, withTransaction } from "../utils/tx.js";
import { Coupon } from "../models/Coupon.js";
import { resolveCouponDiscount } from "../services/couponResolve.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";
import { Invoice } from "../models/Invoice.js";
import {
  sendPaymentSuccessEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendOrderPlacedEmail
} from "../services/mail.js";

const router = express.Router();
router.param("id", validateObjectId);

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

/** Luồng trạng thái hợp lệ (delivered/cancelled là trạng thái cuối) */
const TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

function makePaymentRef() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `MS${ymd}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Hoàn kho + ghi phiếu kho + trả lượt mã giảm giá cho đơn bị hủy (gọi sau khi đã chuyển trạng thái nguyên tử) */
async function releaseOrderResources(order, { note, userId, session }) {
  const opt = session ? { session } : {};
  for (const item of order.items || []) {
    const pid = getOrderItemProductId(item);
    if (!pid) continue;
    await Product.updateOne({ _id: pid }, { $inc: { stock: item.quantity } }, opt);
    await InventoryMovement.create(
      [
        {
          product: pid,
          type: "in",
          quantity: item.quantity,
          reason: "return",
          note,
          refType: "order",
          refId: String(order._id),
          createdBy: userId || null
        }
      ],
      opt
    );
  }
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, opt);
    await Order.updateOne(
      { _id: order._id },
      { $set: { releasedCouponCode: order.couponCode, couponCode: "" } },
      opt
    );
  }
}

/**
 * Chuyển trạng thái nguyên tử (chỉ thành công nếu đơn vẫn đang ở `from`) — chặn double-restock / race.
 * Trả về đơn mới hoặc null nếu trạng thái đã bị đổi bởi request khác.
 */
async function transitionOrder(id, from, to, extra = {}, { userId, noteOnCancel } = {}) {
  return withTransaction(async (session) => {
    const before = await Order.findOneAndUpdate(
      { _id: id, status: from },
      { $set: { status: to, ...extra } },
      session ? { session, new: false } : { new: false }
    );
    if (!before) return null;
    if (to === "cancelled") {
      try {
        await releaseOrderResources(before, { note: noteOnCancel, userId, session });
      } catch (err) {
        if (!session) await Order.updateOne({ _id: id }, { $set: { status: from } }); // bù trừ khi không có transaction
        throw err;
      }
    }
    return Order.findById(id).session(session || null);
  });
}

/** Ghi sổ kế toán sau khi giao hàng/thu tiền; lỗi không làm hỏng thao tác chính (đối soát lại được qua /admin/accounting/reconcile) */
async function syncAccountingSafe(orderId, userId) {
  try {
    await syncOrderAccounting(orderId, userId);
  } catch (err) {
    console.error("[accounting] sync failed", String(orderId), err.message);
  }
}

/** Tìm đơn của người gọi: user đăng nhập (theo user) hoặc khách (id + accessToken) */
async function findOwnedOrder(req, id, token) {
  if (req.user) return Order.findOne({ _id: id, user: req.user._id });
  if (typeof token !== "string" || token.length < 16) return null;
  return Order.findOne({ _id: id, user: null, accessToken: token.trim() });
}

/** Tra cứu đơn khách (không đăng nhập): khớp mã đơn + SĐT */
/** Tra cứu đơn khách (không đăng nhập): mã đơn + token nhận được khi đặt hàng */
router.get("/guest/:id", guestLookupLimiter, async (req, res) => {
  try {
    const { token } = req.query;
    if (typeof token !== "string" || token.length < 16) {
      return res.status(400).json({ message: "Thiếu mã tra cứu đơn" });
    }
    const order = await Order.findOne({ _id: req.params.id, user: null, accessToken: token.trim() })
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
      note,
      addressProvince,
      addressDistrict,
      addressWard,
      addressDetail
    } = req.body || {};
    if (!Array.isArray(items) || !items.length || items.length > 50) {
      return res.status(400).json({ message: "Đơn hàng chưa có sản phẩm" });
    }
    if (!phone || typeof phone !== "string" || !/^[0-9+()\s.-]{8,20}$/.test(phone.trim())) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    const isGuest = !req.user;
    if (isGuest && (!recipientName || typeof recipientName !== "string" || !recipientName.trim())) {
      return res.status(400).json({ message: "Họ tên người nhận là bắt buộc khi chưa đăng nhập" });
    }
    const recipient = String(recipientName || "").trim() || req.user?.name || "";
    if (!recipient) {
      return res.status(400).json({ message: "Thiếu họ tên người nhận" });
    }
    const guestMail = typeof guestEmail === "string" ? guestEmail.trim() : "";
    if (guestMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestMail)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (isGuest && !guestMail) {
      return res.status(400).json({ message: "Vui lòng nhập email để nhận xác nhận và link theo dõi đơn hàng" });
    }
    const customerNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

    const dt = deliveryType === "pickup" ? "pickup" : "delivery";
    let finalAddress = dt === "pickup" ? storePickupAddress() : "";
    if (dt === "delivery") {
      const parts = [addressDetail, addressWard, addressDistrict, addressProvince]
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean);
      finalAddress = parts.length >= 2 ? parts.join(", ") : String(address || "").trim();
      if (!finalAddress) {
        return res.status(400).json({ message: "Địa chỉ giao hàng là bắt buộc khi chọn giao tận nơi" });
      }
      if (finalAddress.length > 500) {
        return res.status(400).json({ message: "Địa chỉ quá dài" });
      }
    }
    const pm = String(paymentMethod || "cod");
    if (!["cod", "bank_transfer", "momo", "zalopay"].includes(pm)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }
    if (!(await getEnabledPaymentMethods()).includes(pm)) {
      return res.status(400).json({ message: "Phương thức thanh toán này hiện chưa được hỗ trợ" });
    }

    // Gộp các dòng trùng sản phẩm, kiểm tra số lượng nguyên dương
    const wanted = new Map();
    for (const rawItem of items) {
      const productIdStr = normalizeProductIdFromBody(rawItem?.product);
      const qty = Number(rawItem?.quantity);
      if (!productIdStr || !Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QUANTITY) {
        return res.status(400).json({ message: "Sản phẩm hoặc số lượng trong đơn không hợp lệ" });
      }
      if (!mongoose.Types.ObjectId.isValid(productIdStr)) {
        return res.status(400).json({ message: "Mã sản phẩm trong đơn không hợp lệ" });
      }
      wanted.set(productIdStr, (wanted.get(productIdStr) || 0) + qty);
    }

    let subtotal = 0;
    const normalizedItems = [];
    for (const [pid, quantity] of wanted) {
      const product = await Product.findById(pid).select("name price stock availability");
      if (!product) {
        return res.status(400).json({
          message:
            "Một hoặc nhiều mô hình không còn trong hệ thống (giỏ có thể lưu mã cũ). Vui lòng xóa giỏ và thêm lại từ danh mục."
        });
      }
      if (product.availability === "sold_out" || product.stock < quantity) {
        return res.status(400).json({ message: `Không đủ tồn kho cho: ${product.name}` });
      }
      subtotal += product.price * quantity;
      normalizedItems.push({ product: product._id, quantity, price: product.price });
    }

    const rawCouponInput = typeof couponCode === "string" ? couponCode : "";
    if (rawCouponInput.trim() && !req.user) {
      return res.status(400).json({ message: "Vui lòng đăng nhập để sử dụng mã giảm giá." });
    }
    const resolved = await resolveCouponDiscount(
      rawCouponInput,
      subtotal,
      normalizedItems.map((i) => ({ product: String(i.product), quantity: i.quantity, price: i.price })),
      req.user?._id
    );
    if (rawCouponInput.trim() && !resolved.normalizedCode) {
      return res.status(400).json({
        message: resolved.error || "Mã giảm giá không hợp lệ hoặc không áp dụng được cho đơn này."
      });
    }
    const discountAmount = resolved.discount;
    const appliedCoupon = resolved.normalizedCode;
    const appliedCouponId = resolved.coupon?._id || null;

    const shippingFee = dt === "delivery" && subtotal < freeShippingThreshold() ? shippingFlatFee() : 0;
    const totalPrice = Math.max(0, subtotal - discountAmount + shippingFee);
    const accessToken = isGuest ? crypto.randomBytes(24).toString("hex") : undefined;

    const order = await withTransaction(async (session) => {
      const opt = session ? { session } : {};
      const done = []; // để bù trừ khi không có transaction
      try {
        // 1) Trừ kho nguyên tử: chỉ trừ khi còn đủ
        for (const item of normalizedItems) {
          const r = await Product.updateOne(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            opt
          );
          if (r.modifiedCount !== 1) {
            const p = await Product.findById(item.product).select("name stock");
            throw new HttpError(
              400,
              p ? `Không đủ tồn kho cho: ${p.name} (còn ${p.stock}, cần ${item.quantity}).` : "Sản phẩm không còn tồn tại."
            );
          }
          done.push({ type: "stock", ...item });
        }
        // 2) Tăng lượt dùng mã có điều kiện (chống vượt usageLimit khi nhiều đơn đồng thời)
        if (appliedCouponId) {
          const c = await Coupon.updateOne(
            {
              _id: appliedCouponId,
              active: true,
              $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }]
            },
            { $inc: { usedCount: 1 } },
            opt
          );
          if (c.modifiedCount !== 1) throw new HttpError(400, "Mã giảm giá đã hết lượt sử dụng.");
          done.push({ type: "coupon", id: appliedCouponId });
        }
        // 3) Tạo đơn (paymentRef unique — thử lại nếu trùng)
        let created;
        for (let attempt = 0; attempt < 5 && !created; attempt++) {
          try {
            [created] = await Order.create(
              [
                {
                  user: req.user?._id || null,
                  recipientName: recipient,
                  customerNote,
                  guestEmail: guestMail,
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
                  paymentRef: makePaymentRef(),
                  accessToken
                }
              ],
              opt
            );
          } catch (e) {
            const dupRef = e?.code === 11000 && /paymentRef/.test(String(e.message));
            if (!dupRef || attempt === 4) throw e;
          }
        }
        // 4) Phiếu xuất kho
        await InventoryMovement.create(
          normalizedItems.map((item) => ({
            product: item.product,
            type: "out",
            quantity: item.quantity,
            reason: "sale",
            note: `Order ${created.paymentRef}`,
            refType: "order",
            refId: String(created._id),
            createdBy: req.user?._id || null
          })),
          opt
        );
        return created;
      } catch (err) {
        if (!session) {
          for (const d of done.reverse()) {
            if (d.type === "stock") await Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } });
            if (d.type === "coupon") await Coupon.updateOne({ _id: d.id }, { $inc: { usedCount: -1 } });
          }
        }
        throw err;
      }
    });

    const body = order.toObject();
    if (accessToken) body.accessToken = accessToken; // chỉ trả về một lần cho khách vãng lai

    // Email xác nhận (không chặn phản hồi): khách vãng lai nhận link có token để tra cứu lại
    const to = req.user?.email || guestMail;
    if (to) {
      const base = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
      const trackingUrl = accessToken
        ? `${base}/orders/track?id=${order._id}&token=${accessToken}`
        : `${base}/orders/${order._id}`;
      Order.findById(order._id)
        .populate("items.product", "name")
        .then((full) => sendOrderPlacedEmail({ to, recipientName: recipient, order: full || order, trackingUrl }))
        .catch((err) => console.error("[mail] order placed:", err));
    }
    return res.status(201).json(body);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
    if (err?.code === 11000 && /couponCode/.test(String(err.message))) {
      return res.status(400).json({
        message: "Bạn đã sử dụng mã giảm giá này rồi — mỗi tài khoản chỉ áp dụng một lần."
      });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: confirm payment received
router.put("/:id/payment", auth, isBackoffice, async (req, res) => {
  try {
    const { paymentStatus } = req.body || {};
    if (!["unpaid", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid paymentStatus" });
    }
    const prev = await Order.findById(req.params.id);
    if (!prev) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    if (prev.status === "cancelled") {
      return res.status(400).json({ message: "Đơn đã hủy, không thể đổi trạng thái thanh toán" });
    }
    if (["pending_approval", "approved", "refunded"].includes(prev.refundStatus)) {
      return res.status(400).json({ message: "Đơn đang/đã xử lý hoàn tiền, không thể đổi trạng thái thanh toán" });
    }

    if (paymentStatus === "unpaid" && (await Invoice.exists({ order: prev._id, status: "paid" }))) {
      return res.status(400).json({ message: "Khoản thu đã được ghi sổ kế toán, không thể chuyển về chưa thanh toán" });
    }

    // Đổi có điều kiện để tránh gửi email 2 lần khi bấm đúp
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, paymentStatus: prev.paymentStatus },
      { paymentStatus, paidAt: paymentStatus === "paid" ? new Date() : null },
      { new: true }
    )
      .populate("user", "email name")
      .populate("items.product", "name");
    if (!order) return res.status(409).json({ message: "Đơn vừa được cập nhật bởi thao tác khác, hãy tải lại." });

    if (paymentStatus === "paid" && prev.paymentStatus !== "paid") {
      queueOrderCustomerEmail(order, sendPaymentSuccessEmail, "payment paid");
      await syncAccountingSafe(order._id, req.user?._id);
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Khách gửi minh chứng thanh toán (đăng nhập, hoặc khách vãng lai kèm token đơn)
router.post("/:id/payment-proof", guestLookupLimiter, optionalAuth, async (req, res) => {
  try {
    const { url, token } = req.body || {};
    if (!url || typeof url !== "string" || !/^\/uploads\/[\w.-]+$/.test(url.trim())) {
      return res.status(400).json({ message: "Thiếu hoặc sai url ảnh minh chứng" });
    }
    const order = await findOwnedOrder(req, req.params.id, token);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
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

// Khách tự hủy đơn: chỉ khi đang chờ xử lý và chưa thanh toán (đơn đã trả tiền → liên hệ shop để hoàn tiền)
router.post("/:id/cancel", guestLookupLimiter, optionalAuth, async (req, res) => {
  try {
    const order = await findOwnedOrder(req, req.params.id, req.body?.token);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Chỉ có thể hủy khi đơn đang chờ xử lý" });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Đơn đã thanh toán — vui lòng liên hệ shop để được hủy và hoàn tiền."
      });
    }
    const updated = await transitionOrder(order._id, "pending", "cancelled", {}, {
      userId: req.user?._id,
      noteOnCancel: `Customer cancelled order ${order.paymentRef || order._id}`
    });
    if (!updated) return res.status(409).json({ message: "Đơn vừa được cập nhật, hãy tải lại trang." });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, isBackoffice, async (req, res) => {
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

router.put("/:id", auth, isStaff, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!Object.keys(TRANSITIONS).includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const prev = await Order.findById(req.params.id);
    if (!prev) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    if (prev.status === status) return res.json(prev);
    if (!TRANSITIONS[prev.status].includes(status)) {
      return res.status(400).json({
        message: `Không thể chuyển đơn từ "${prev.status}" sang "${status}".`
      });
    }
    if (status === "cancelled" && prev.paymentStatus === "paid" && !["approved", "refunded"].includes(prev.refundStatus)) {
      return res.status(400).json({
        message: "Đơn đã thanh toán: hãy tạo yêu cầu hoàn tiền và được duyệt trước khi hủy đơn."
      });
    }

    // COD: giao thành công = đã thu tiền
    const extra = {};
    if (status === "delivered" && prev.paymentMethod === "cod" && prev.paymentStatus !== "paid") {
      extra.paymentStatus = "paid";
      extra.paidAt = new Date();
    }

    const updated = await transitionOrder(prev._id, prev.status, status, extra, {
      userId: req.user?._id,
      noteOnCancel: `Admin cancelled order ${prev.paymentRef || prev._id}`
    });
    if (!updated) return res.status(409).json({ message: "Đơn vừa được cập nhật bởi thao tác khác, hãy tải lại." });

    const order = await Order.findById(updated._id)
      .populate("user", "email name")
      .populate("items.product", "name");

    if (status === "cancelled") queueOrderCustomerEmail(order, sendOrderCancelledEmail, "cancelled (admin)");
    if (status === "delivered") {
      await syncAccountingSafe(order._id, req.user?._id);
      queueOrderCustomerEmail(order, sendOrderDeliveredEmail, "delivered");
      if (extra.paymentStatus === "paid") queueOrderCustomerEmail(order, sendPaymentSuccessEmail, "payment paid (cod)");
    }
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Tạo yêu cầu hoàn tiền cho đơn đã thanh toán (cần lý do; có thể hoàn một phần)
router.post("/:id/refund-request", auth, isBackoffice, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Chỉ đơn đã thanh toán mới có thể yêu cầu hoàn tiền" });
    }
    if (order.refundStatus === "refunded") {
      return res.status(400).json({ message: "Đơn đã được hoàn tiền" });
    }
    if (order.refundStatus === "pending_approval" || order.refundStatus === "approved") {
      return res.status(400).json({ message: "Đơn đã có yêu cầu hoàn tiền đang xử lý" });
    }
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 300) : "";
    if (!reason) return res.status(400).json({ message: "Cần nhập lý do hoàn tiền" });
    const total = Number(order.totalPrice || 0);
    const amount = req.body?.amount === undefined ? total : Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > total) {
      return res.status(400).json({ message: "Số tiền hoàn không hợp lệ (phải > 0 và không vượt tổng đơn)" });
    }

    const requiredApprovals = amount >= 5000000 ? 2 : 1;
    const approval = await ApprovalRequest.create({
      type: "refund",
      title: `Refund ${order.paymentRef || order._id}`,
      payload: { orderId: String(order._id), amount, reason },
      requiredApprovals,
      requestedBy: req.user._id
    });

    order.refundStatus = "pending_approval";
    order.refundAmount = amount;
    order.refundReason = reason;
    order.refundApprovalRequest = approval._id;
    await order.save();
    return res.status(201).json({ order, approval });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Thực hiện hoàn tiền sau khi được duyệt (kế toán/admin):
 *  - đơn chưa giao (pending/processing): tự hủy đơn + hoàn kho + trả lượt mã
 *  - đơn đã giao/đang giao: chỉ hoàn tiền; gửi restock:true nếu nhận lại hàng (nhập kho + đảo giá vốn)
 *  - ghi sổ: Nợ 5211 / Có 111 khi khoản thu đã lên sổ
 */
router.post("/:id/refund/execute", auth, isFinance, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    if (!order.refundApprovalRequest) {
      return res.status(400).json({ message: "Refund approval request is missing" });
    }
    if (order.refundStatus === "refunded") {
      return res.status(400).json({ message: "Đơn đã được hoàn tiền" });
    }
    const approval = await ApprovalRequest.findById(order.refundApprovalRequest);
    if (!approval || approval.status !== "approved" || order.refundStatus !== "approved") {
      return res.status(400).json({ message: "Refund approval is not approved yet" });
    }
    const restock = req.body?.restock === true && ["shipped", "delivered"].includes(order.status);
    const amount = Number(order.refundAmount || 0);

    // Bút toán idempotent theo đơn → ghi trước, rồi mới chốt trạng thái hoàn tiền
    await postRefundJournals(order, { amount, restock: restock && order.status === "delivered", userId: req.user?._id });

    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, refundStatus: "approved" },
      { $set: { refundStatus: "refunded", refundedAt: new Date() } },
      { new: true }
    );
    if (!claimed) return res.status(409).json({ message: "Hoàn tiền đã được xử lý bởi thao tác khác" });

    if (["pending", "processing"].includes(order.status)) {
      await transitionOrder(order._id, order.status, "cancelled", {}, {
        userId: req.user?._id,
        noteOnCancel: `Refund cancelled order ${order.paymentRef || order._id}`
      });
    } else if (restock) {
      for (const item of order.items || []) {
        const pid = getOrderItemProductId(item);
        if (!pid) continue;
        await Product.updateOne({ _id: pid }, { $inc: { stock: item.quantity } });
        await InventoryMovement.create({
          product: pid,
          type: "in",
          quantity: item.quantity,
          reason: "return",
          note: `Refund return ${order.paymentRef || order._id}`,
          refType: "order",
          refId: String(order._id),
          createdBy: req.user?._id || null
        });
      }
    }
    return res.json(await Order.findById(order._id));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
