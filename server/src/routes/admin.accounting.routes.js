import express from "express";
import { auth, isAdmin, isFinance } from "../middlewares/auth.js";
import { Invoice } from "../models/Invoice.js";
import { Order } from "../models/Order.js";
import { Expense } from "../models/Expense.js";
import { AccountingSetting } from "../models/AccountingSetting.js";
import { Account } from "../models/Account.js";
import { JournalEntry } from "../models/JournalEntry.js";
import {
  ensureDefaultAccounts,
  makeInvoiceCode,
  postInvoiceJournal,
  postPaymentJournal,
  postInvoiceVoidJournal,
  syncOrderAccounting,
  syncExpenseJournal,
  getLockedUntil
} from "../services/accounting.js";
import { validateObjectId } from "../utils/validate.js";

const router = express.Router();
router.param("id", validateObjectId);
router.param("orderId", validateObjectId);

router.get("/accounts", auth, isFinance, async (req, res) => {
  try {
    await ensureDefaultAccounts();
    const accounts = await Account.find().sort({ code: 1 }).lean();
    return res.json(accounts);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/accounts", auth, isFinance, async (req, res) => {
  try {
    const { code, name, type } = req.body || {};
    if (!code || !name || !["asset", "liability", "equity", "revenue", "expense"].includes(type)) {
      return res.status(400).json({ message: "code, name và type hợp lệ là bắt buộc" });
    }
    const account = await Account.create({ code: String(code).trim(), name: String(name).trim(), type });
    return res.status(201).json(account);
  } catch (error) {
    return res.status(400).json({ message: "Invalid account payload" });
  }
});

router.get("/journal-entries", auth, isFinance, async (req, res) => {
  try {
    const entries = await JournalEntry.find()
      .populate("lines.account", "code name type")
      .sort({ date: -1, createdAt: -1 })
      .limit(300)
      .lean();
    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/invoices", auth, isFinance, async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("order", "paymentRef status totalPrice").sort({ createdAt: -1 }).lean();
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/invoices/from-order/:orderId", auth, isFinance, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    const existing = await Invoice.findOne({ order: order._id });
    if (existing) return res.status(400).json({ message: "Invoice already exists for this order" });

    const subtotal = Number(order.subtotal || order.totalPrice || 0);
    const taxAmount = 0;
    const totalAmount = Number(order.totalPrice || 0);
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      code: makeInvoiceCode(),
      order: order._id,
      customerName: order.recipientName || order.user?.name || "Customer",
      customerEmail: order.guestEmail || order.user?.email || "",
      subtotal,
      taxAmount,
      totalAmount,
      status: "posted",
      dueDate,
      createdBy: req.user?._id || null
    });
    await postInvoiceJournal(invoice, req.user?._id);
    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(400).json({ message: "Cannot create invoice" });
  }
});

router.post("/invoices", auth, isFinance, async (req, res) => {
  try {
    const b = req.body || {};
    const customerName = typeof b.customerName === "string" ? b.customerName.trim() : "";
    if (!customerName) return res.status(400).json({ message: "customerName is required" });
    const subtotal = Number(b.subtotal || 0);
    const taxAmount = Number(b.taxAmount || 0);
    if (![subtotal, taxAmount].every((n) => Number.isFinite(n) && n >= 0)) {
      return res.status(400).json({ message: "Invalid amounts" });
    }
    const status = b.status === "posted" ? "posted" : "draft"; // thu tiền phải làm qua bước "paid" riêng
    const invoice = await Invoice.create({
      code: makeInvoiceCode(),
      customerName,
      customerEmail: typeof b.customerEmail === "string" ? b.customerEmail.trim() : "",
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      status,
      dueDate: b.dueDate ? new Date(b.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      note: typeof b.note === "string" ? b.note.slice(0, 500) : "",
      createdBy: req.user?._id || null
    });
    if (status === "posted") await postInvoiceJournal(invoice, req.user?._id);
    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(400).json({ message: "Invalid invoice payload" });
  }
});

/** Chuyển trạng thái hóa đơn: draft→posted→paid; draft/posted→cancelled (posted có bút toán đảo) */
router.put("/invoices/:id", auth, isFinance, async (req, res) => {
  try {
    const b = req.body || {};
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (typeof b.note === "string") invoice.note = b.note.slice(0, 500);
    if (b.dueDate) invoice.dueDate = new Date(b.dueDate);

    const next = b.status;
    if (next && next !== invoice.status) {
      const allowed = { draft: ["posted", "cancelled"], posted: ["paid", "cancelled"], paid: [], cancelled: [] };
      if (!(allowed[invoice.status] || []).includes(next)) {
        return res.status(400).json({ message: `Không thể chuyển hóa đơn từ ${invoice.status} sang ${next}` });
      }
      const wasPosted = invoice.status === "posted";
      invoice.status = next;
      if (next === "paid") invoice.paidAt = new Date();
      await invoice.save();
      if (next === "posted") await postInvoiceJournal(invoice, req.user?._id);
      if (next === "paid") {
        await postInvoiceJournal(invoice, req.user?._id);
        await postPaymentJournal(invoice, req.user?._id);
      }
      if (next === "cancelled" && wasPosted) await postInvoiceVoidJournal(invoice, req.user?._id);
    } else {
      await invoice.save();
    }
    return res.json(invoice);
  } catch (error) {
    return res.status(400).json({ message: "Invalid invoice payload" });
  }
});

/** Khóa kỳ kế toán: mọi chứng từ có ngày <= mốc bị khóa. Chỉ cho dời mốc về phía sau (admin mới được mở khóa/lùi mốc). */
router.get("/accounting/lock", auth, isFinance, async (req, res) => {
  return res.json({ lockedUntil: await getLockedUntil() });
});

router.put("/accounting/lock", auth, isFinance, async (req, res) => {
  try {
    const raw = req.body?.lockedUntil;
    const next = raw === null ? null : new Date(String(raw));
    if (next !== null && Number.isNaN(next.getTime())) return res.status(400).json({ message: "Ngày khóa không hợp lệ" });
    if (next && next > new Date()) return res.status(400).json({ message: "Không thể khóa kỳ trong tương lai" });
    const current = await getLockedUntil();
    const movingBack = current && (next === null || next < new Date(current));
    if (movingBack && req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được mở khóa hoặc lùi mốc khóa kỳ" });
    }
    const s = await AccountingSetting.findOneAndUpdate({}, { $set: { lockedUntil: next, lockedBy: req.user._id } }, { upsert: true, new: true });
    return res.json({ lockedUntil: s.lockedUntil });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

/** Đối soát: ghi sổ bổ sung cho các đơn đã giao chưa có hóa đơn/bút toán (idempotent) */
router.post("/accounting/reconcile", auth, isFinance, async (req, res) => {
  try {
    const orders = await Order.find({ status: "delivered" }).select("_id").sort({ createdAt: -1 }).limit(1000).lean();
    let processed = 0;
    let failed = 0;
    for (const o of orders) {
      try {
        await syncOrderAccounting(o._id, req.user?._id);
        processed += 1;
      } catch (err) {
        failed += 1;
        console.error("[accounting] reconcile failed", String(o._id), err.message);
      }
    }
    const expenses = await Expense.find().lean();
    let expensesPosted = 0;
    for (const e of expenses) {
      try {
        await syncExpenseJournal(e, req.user?._id);
        expensesPosted += 1;
      } catch (err) {
        failed += 1;
        console.error("[accounting] expense reconcile failed", String(e._id), err.message);
      }
    }
    return res.json({ processed, expensesPosted, failed });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
