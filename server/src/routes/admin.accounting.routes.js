import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Invoice } from "../models/Invoice.js";
import { Order } from "../models/Order.js";
import { Account } from "../models/Account.js";
import { JournalEntry } from "../models/JournalEntry.js";

const router = express.Router();

function makeInvoiceCode() {
  const stamp = Date.now().toString().slice(-8);
  return `INV-${stamp}`;
}

const defaultAccounts = [
  { code: "111", name: "Cash", type: "asset" },
  { code: "131", name: "Accounts Receivable", type: "asset" },
  { code: "156", name: "Inventory", type: "asset" },
  { code: "331", name: "Accounts Payable", type: "liability" },
  { code: "511", name: "Sales Revenue", type: "revenue" },
  { code: "632", name: "COGS", type: "expense" }
];

async function ensureDefaultAccounts() {
  for (const row of defaultAccounts) {
    await Account.findOneAndUpdate({ code: row.code }, row, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
}

async function getAccountByCode(code) {
  return Account.findOne({ code, active: true });
}

async function postInvoiceJournal(invoice, userId) {
  const existing = await JournalEntry.findOne({ refType: "invoice", refId: String(invoice._id) });
  if (existing) return existing;

  await ensureDefaultAccounts();
  const receivable = await getAccountByCode("131");
  const revenue = await getAccountByCode("511");
  if (!receivable || !revenue) {
    throw new Error("Missing accounting accounts");
  }

  const amount = Number(invoice.totalAmount || 0);
  return JournalEntry.create({
    date: invoice.createdAt || new Date(),
    refType: "invoice",
    refId: String(invoice._id),
    description: `Post invoice ${invoice.code}`,
    lines: [
      { account: receivable._id, debit: amount, credit: 0, memo: "Customer receivable" },
      { account: revenue._id, debit: 0, credit: amount, memo: "Sales revenue" }
    ],
    postedBy: userId || null
  });
}

async function postPaymentJournal(invoice, userId) {
  const existing = await JournalEntry.findOne({ refType: "invoice_payment", refId: String(invoice._id) });
  if (existing) return existing;

  await ensureDefaultAccounts();
  const cash = await getAccountByCode("111");
  const receivable = await getAccountByCode("131");
  if (!cash || !receivable) {
    throw new Error("Missing accounting accounts");
  }

  const amount = Number(invoice.totalAmount || 0);
  return JournalEntry.create({
    date: invoice.paidAt || new Date(),
    refType: "invoice_payment",
    refId: String(invoice._id),
    description: `Receive payment ${invoice.code}`,
    lines: [
      { account: cash._id, debit: amount, credit: 0, memo: "Cash in" },
      { account: receivable._id, debit: 0, credit: amount, memo: "Close receivable" }
    ],
    postedBy: userId || null
  });
}

router.get("/accounts", auth, isAdmin, async (req, res) => {
  try {
    await ensureDefaultAccounts();
    const accounts = await Account.find().sort({ code: 1 }).lean();
    return res.json(accounts);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/accounts", auth, isAdmin, async (req, res) => {
  try {
    const account = await Account.create(req.body || {});
    return res.status(201).json(account);
  } catch (error) {
    return res.status(400).json({ message: "Invalid account payload" });
  }
});

router.get("/journal-entries", auth, isAdmin, async (req, res) => {
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

router.get("/invoices", auth, isAdmin, async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("order", "paymentRef status totalPrice").sort({ createdAt: -1 }).lean();
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/invoices/from-order/:orderId", auth, isAdmin, async (req, res) => {
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

router.post("/invoices", auth, isAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const invoice = await Invoice.create({
      ...payload,
      code: payload.code || makeInvoiceCode(),
      createdBy: req.user?._id || null
    });
    if (invoice.status === "posted" || invoice.status === "paid") {
      await postInvoiceJournal(invoice, req.user?._id);
    }
    if (invoice.status === "paid") {
      invoice.paidAt = invoice.paidAt || new Date();
      await invoice.save();
      await postPaymentJournal(invoice, req.user?._id);
    }
    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(400).json({ message: "Invalid invoice payload" });
  }
});

router.put("/invoices/:id", auth, isAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.status === "paid") payload.paidAt = new Date();
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (invoice.status === "posted" || invoice.status === "paid") {
      await postInvoiceJournal(invoice, req.user?._id);
    }
    if (invoice.status === "paid") {
      await postPaymentJournal(invoice, req.user?._id);
    }
    return res.json(invoice);
  } catch (error) {
    return res.status(400).json({ message: "Invalid invoice payload" });
  }
});

export default router;
