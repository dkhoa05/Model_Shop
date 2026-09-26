import crypto from "crypto";
import { Account } from "../models/Account.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Invoice } from "../models/Invoice.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { AccountingSetting } from "../models/AccountingSetting.js";

export class PeriodLockedError extends Error {
  constructor(lockedUntil) {
    super(`Kỳ kế toán đã khóa đến ${new Date(lockedUntil).toLocaleDateString("vi-VN")} — không thể ghi/sửa chứng từ trong kỳ này`);
    this.status = 409;
  }
}

export async function getLockedUntil() {
  const s = await AccountingSetting.findOne().lean();
  return s?.lockedUntil || null;
}

/** Ném PeriodLockedError nếu ngày thuộc kỳ đã khóa */
export async function assertPeriodOpen(date) {
  const locked = await getLockedUntil();
  if (locked && new Date(date || Date.now()) <= new Date(locked)) throw new PeriodLockedError(locked);
}

export const DEFAULT_ACCOUNTS = [
  { code: "111", name: "Cash", type: "asset" },
  { code: "131", name: "Accounts Receivable", type: "asset" },
  { code: "156", name: "Inventory", type: "asset" },
  { code: "331", name: "Accounts Payable", type: "liability" },
  { code: "511", name: "Sales Revenue", type: "revenue" },
  { code: "5211", name: "Sales Returns & Refunds", type: "revenue" }, // tài khoản giảm trừ doanh thu (số dư Nợ)
  { code: "632", name: "COGS", type: "expense" },
  { code: "641", name: "Operating Expenses", type: "expense" }
];

let accountsReady = false;
export async function ensureDefaultAccounts() {
  if (accountsReady) return;
  for (const row of DEFAULT_ACCOUNTS) {
    await Account.findOneAndUpdate({ code: row.code }, { $setOnInsert: row }, { upsert: true, setDefaultsOnInsert: true });
  }
  accountsReady = true;
}

async function accountIdByCode(code) {
  await ensureDefaultAccounts();
  const acc = await Account.findOne({ code, active: true }).select("_id");
  if (!acc) throw new Error(`Missing accounting account ${code}`);
  return acc._id;
}

/**
 * Ghi bút toán kép. Lines: [{ code, debit, credit, memo }]. Idempotent theo (refType, refId).
 * Từ chối bút toán không cân (tổng Nợ != tổng Có) hoặc bằng 0.
 */
export async function postEntry({ refType, refId, description, lines, date, userId }) {
  const debit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const credit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  if (!(debit > 0) || Math.round(debit) !== Math.round(credit)) {
    throw new Error(`Unbalanced journal entry (${debit} vs ${credit})`);
  }
  if (refType && refId) {
    const existing = await JournalEntry.findOne({ refType, refId: String(refId) });
    if (existing) return existing;
  }
  await assertPeriodOpen(date);
  const resolved = [];
  for (const l of lines) {
    resolved.push({
      account: await accountIdByCode(l.code),
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      memo: l.memo || ""
    });
  }
  try {
    return await JournalEntry.create({
      date: date || new Date(),
      refType: refType || "",
      refId: refId ? String(refId) : "",
      description: description || "",
      lines: resolved,
      postedBy: userId || null
    });
  } catch (err) {
    if (err?.code === 11000 && refType && refId) return JournalEntry.findOne({ refType, refId: String(refId) });
    throw err;
  }
}

export function makeInvoiceCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${ymd}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Ghi nhận doanh thu: Nợ 131 / Có 511 */
export function postInvoiceJournal(invoice, userId) {
  const amount = Number(invoice.totalAmount || 0);
  return postEntry({
    refType: "invoice",
    refId: invoice._id,
    date: invoice.createdAt || new Date(),
    description: `Post invoice ${invoice.code}`,
    userId,
    lines: [
      { code: "131", debit: amount, memo: "Customer receivable" },
      { code: "511", credit: amount, memo: "Sales revenue" }
    ]
  });
}

/** Thu tiền: Nợ 111 / Có 131 */
export function postPaymentJournal(invoice, userId) {
  const amount = Number(invoice.totalAmount || 0);
  return postEntry({
    refType: "invoice_payment",
    refId: invoice._id,
    date: invoice.paidAt || new Date(),
    description: `Receive payment ${invoice.code}`,
    userId,
    lines: [
      { code: "111", debit: amount, memo: "Cash in" },
      { code: "131", credit: amount, memo: "Close receivable" }
    ]
  });
}

/** Hủy hóa đơn đã ghi sổ (chưa thu tiền): bút toán đảo Nợ 511 / Có 131 */
export function postInvoiceVoidJournal(invoice, userId) {
  const amount = Number(invoice.totalAmount || 0);
  return postEntry({
    refType: "invoice_void",
    refId: invoice._id,
    description: `Void invoice ${invoice.code}`,
    userId,
    lines: [
      { code: "511", debit: amount, memo: "Reverse revenue" },
      { code: "131", credit: amount, memo: "Reverse receivable" }
    ]
  });
}

/** Chi phí hoạt động: Nợ 641 / Có 111 (ghi lại khi sửa, xóa khi xóa khoản chi) */
export async function syncExpenseJournal(expense, userId) {
  const old = await JournalEntry.findOne({ refType: "expense", refId: String(expense._id) }).select("date");
  if (old) await assertPeriodOpen(old.date);
  await JournalEntry.deleteOne({ refType: "expense", refId: String(expense._id) });
  const amount = Number(expense.amount || 0);
  if (!(amount > 0)) return null;
  return postEntry({
    refType: "expense",
    refId: expense._id,
    date: expense.expenseDate || new Date(),
    description: `Expense: ${expense.title}`,
    userId,
    lines: [
      { code: "641", debit: amount, memo: expense.category || "" },
      { code: "111", credit: amount, memo: "Cash out" }
    ]
  });
}

export async function removeExpenseJournal(expenseId) {
  const old = await JournalEntry.findOne({ refType: "expense", refId: String(expenseId) }).select("date");
  if (old) await assertPeriodOpen(old.date);
  return JournalEntry.deleteOne({ refType: "expense", refId: String(expenseId) });
}

/**
 * Đồng bộ kế toán cho đơn đã giao (idempotent — gọi lại bao nhiêu lần cũng không nhân đôi):
 *  - Hóa đơn + doanh thu (Nợ 131 / Có 511)
 *  - Giá vốn theo Product.cost (Nợ 632 / Có 156), lưu Order.cogsAmount
 *  - Nếu đơn đã thanh toán: thu tiền (Nợ 111 / Có 131) và đánh dấu hóa đơn đã thu
 * Doanh thu chỉ ghi nhận khi giao hàng; tiền nhận trước khi giao chưa lên sổ.
 */
export async function syncOrderAccounting(orderId, userId = null) {
  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order || order.status !== "delivered") return null;

  let invoice = await Invoice.findOne({ order: order._id });
  if (!invoice) {
    try {
      invoice = await Invoice.create({
        code: makeInvoiceCode(),
        order: order._id,
        customerName: order.recipientName || order.user?.name || "Customer",
        customerEmail: order.guestEmail || order.user?.email || "",
        subtotal: Number(order.subtotal || order.totalPrice || 0),
        taxAmount: 0,
        totalAmount: Number(order.totalPrice || 0),
        status: "posted",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: userId
      });
    } catch (err) {
      invoice = await Invoice.findOne({ order: order._id });
      if (!invoice) throw err;
    }
  }
  if (invoice.status === "draft") {
    invoice.status = "posted";
    await invoice.save();
  }
  if (invoice.status === "posted" || invoice.status === "paid") {
    await postInvoiceJournal(invoice, userId);
  }

  // Giá vốn (chốt một lần theo giá vốn tại thời điểm giao)
  if (!order.cogsAmount) {
    const ids = order.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids } }).select("cost").lean();
    const cost = new Map(products.map((p) => [String(p._id), Number(p.cost || 0)]));
    const cogs = order.items.reduce((s, i) => s + Number(i.quantity) * (cost.get(String(i.product)) || 0), 0);
    if (cogs > 0) {
      await postEntry({
        refType: "order_cogs",
        refId: order._id,
        description: `COGS ${order.paymentRef || order._id}`,
        userId,
        lines: [
          { code: "632", debit: cogs, memo: "Cost of goods sold" },
          { code: "156", credit: cogs, memo: "Inventory out" }
        ]
      });
      await Order.updateOne({ _id: order._id }, { $set: { cogsAmount: cogs } });
    }
  }

  if (order.paymentStatus === "paid" && invoice.status !== "paid") {
    invoice = await Invoice.findOneAndUpdate(
      { _id: invoice._id, status: "posted" },
      { $set: { status: "paid", paidAt: order.paidAt || new Date() } },
      { new: true }
    ) || (await Invoice.findById(invoice._id));
  }
  if (invoice.status === "paid") await postPaymentJournal(invoice, userId);
  return invoice;
}

/** Hoàn tiền đã thực hiện: Nợ 5211 / Có 111 (chỉ khi tiền đã lên sổ) và tùy chọn đảo giá vốn khi nhận hàng trả về */
export async function postRefundJournals(order, { amount, restock, userId }) {
  const invoice = await Invoice.findOne({ order: order._id });
  const paidOnBooks = invoice && (await JournalEntry.exists({ refType: "invoice_payment", refId: String(invoice._id) }));
  if (paidOnBooks && amount > 0) {
    await postEntry({
      refType: "order_refund",
      refId: order._id,
      description: `Refund ${order.paymentRef || order._id}`,
      userId,
      lines: [
        { code: "5211", debit: amount, memo: "Sales return / refund" },
        { code: "111", credit: amount, memo: "Cash out" }
      ]
    });
  }
  if (restock && order.cogsAmount > 0) {
    await postEntry({
      refType: "order_cogs_reversal",
      refId: order._id,
      description: `COGS reversal ${order.paymentRef || order._id}`,
      userId,
      lines: [
        { code: "156", debit: order.cogsAmount, memo: "Inventory returned" },
        { code: "632", credit: order.cogsAmount, memo: "Reverse COGS" }
      ]
    });
  }
}
