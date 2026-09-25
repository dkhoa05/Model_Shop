import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Order } from "../models/Order.js";
import { Expense } from "../models/Expense.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Account } from "../models/Account.js";
import { Invoice } from "../models/Invoice.js";
import { parseOptionalDayBounds, snapReportRangeToVnCalendar } from "../utils/dateRangeQuery.js";

const router = express.Router();

const REPORT_TZ = process.env.REPORT_TZ || "Asia/Ho_Chi_Minh";

/** Cùng khoảng ngày (VN) cho đơn hàng, chi phí và API danh sách khoản chi */
function resolveReportBounds(queryFrom, queryTo, period) {
  const def = getDefaultRange(period);
  const q = parseOptionalDayBounds(queryFrom, queryTo);
  const rawFrom = q.from ?? def.from;
  const rawTo = q.to ?? def.to;
  return snapReportRangeToVnCalendar(rawFrom, rawTo, REPORT_TZ);
}

function getDefaultRange(period) {
  const now = new Date();
  const to = now;
  const from = new Date(now);
  if (period === "day") from.setDate(from.getDate() - 29);
  else if (period === "week") from.setDate(from.getDate() - 7 * 11);
  else if (period === "month") from.setMonth(from.getMonth() - 11);
  else if (period === "year") from.setFullYear(from.getFullYear() - 4);
  else from.setDate(from.getDate() - 29);
  return { from, to };
}

function buildGroupStage(period) {
  const tz = process.env.REPORT_TZ || "Asia/Ho_Chi_Minh";
  if (period === "month") {
    return {
      _id: {
        $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: tz }
      }
    };
  }
  if (period === "year") {
    return {
      _id: {
        $dateToString: { format: "%Y", date: "$createdAt", timezone: tz }
      }
    };
  }
  if (period === "week") {
    return {
      _id: {
        y: { $isoWeekYear: "$createdAt" },
        w: { $isoWeek: "$createdAt" }
      }
    };
  }
  // day
  return {
    _id: {
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz }
    }
  };
}

function buildSortStage(period) {
  if (period === "week") return { "_id.y": 1, "_id.w": 1 };
  return { _id: 1 };
}

/** Sắp xếp nhãn kỳ báo cáo theo thời gian (tránh localeCompare sai tuần W9 > W10) */
function compareReportLabels(period, a, b) {
  const la = String(a?.label ?? "");
  const lb = String(b?.label ?? "");
  if (period === "week") {
    const pa = la.match(/^(\d+)-W(\d+)/);
    const pb = lb.match(/^(\d+)-W(\d+)/);
    if (pa && pb) {
      const ya = parseInt(pa[1], 10);
      const wa = parseInt(pa[2], 10);
      const yb = parseInt(pb[1], 10);
      const wb = parseInt(pb[2], 10);
      if (ya !== yb) return ya - yb;
      return wa - wb;
    }
  }
  return la.localeCompare(lb);
}

function buildProjectStage(period) {
  if (period !== "week") {
    return { label: "$_id", revenue: 1, orders: 1, _id: 0 };
  }
  return {
    _id: 0,
    label: {
      $concat: [
        { $toString: "$_id.y" },
        "-W",
        {
          $cond: [
            { $lt: ["$_id.w", 10] },
            { $concat: ["0", { $toString: "$_id.w" }] },
            { $toString: "$_id.w" }
          ]
        }
      ]
    },
    revenue: 1,
    orders: 1
  };
}

/**
 * GET /api/admin/reports/revenue
 * Query:
 * - period: day|week|month|year (default day)
 * - from: ISO date (optional)
 * - to: ISO date (optional)
 * - status: order status filter (default delivered)
 */
router.get("/reports/revenue", auth, isAdmin, async (req, res) => {
  try {
    const period = ["day", "week", "month", "year"].includes(String(req.query.period))
      ? String(req.query.period)
      : "day";
    const status = String(req.query.status || "delivered");

    const { from, to } = resolveReportBounds(req.query.from, req.query.to, period);

    const match = {
      createdAt: { $gte: from, $lte: to }
    };
    if (status && status !== "all") {
      match.status = status;
    }

    const series = await Order.aggregate([
      { $match: match },
      {
        $group: {
          ...buildGroupStage(period),
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: buildSortStage(period) },
      { $project: buildProjectStage(period) }
    ]);

    const totals = series.reduce(
      (acc, x) => {
        acc.revenue += Number(x.revenue || 0);
        acc.orders += Number(x.orders || 0);
        return acc;
      },
      { revenue: 0, orders: 0 }
    );

    return res.json({
      period,
      status,
      range: { from, to },
      totals,
      series
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/admin/reports/profit
 * Query:
 * - period: day|week|month|year (default day)
 * - from: ISO date (optional)
 * - to: ISO date (optional)
 * - status: order status filter for revenue (default delivered)
 */
router.get("/reports/profit", auth, isAdmin, async (req, res) => {
  try {
    const period = ["day", "week", "month", "year"].includes(String(req.query.period))
      ? String(req.query.period)
      : "day";
    const status = String(req.query.status || "delivered");

    const { from, to } = resolveReportBounds(req.query.from, req.query.to, period);

    const orderMatch = { createdAt: { $gte: from, $lte: to } };
    if (status && status !== "all") orderMatch.status = status;

    const expenseMatch = { expenseDate: { $gte: from, $lte: to } };

    const [revSeries, expSeries, expenseTotalAgg] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            ...buildGroupStage(period),
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 }
          }
        },
        { $sort: buildSortStage(period) },
        { $project: buildProjectStage(period) }
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            ...(period === "week"
              ? { _id: { y: { $isoWeekYear: "$expenseDate" }, w: { $isoWeek: "$expenseDate" } } }
              : period === "month"
                ? { _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate", timezone: process.env.REPORT_TZ || "Asia/Ho_Chi_Minh" } } }
                : period === "year"
                  ? { _id: { $dateToString: { format: "%Y", date: "$expenseDate", timezone: process.env.REPORT_TZ || "Asia/Ho_Chi_Minh" } } }
                  : { _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate", timezone: process.env.REPORT_TZ || "Asia/Ho_Chi_Minh" } } }),
            expense: { $sum: "$amount" },
            items: { $sum: 1 }
          }
        },
        { $sort: buildSortStage(period) },
        {
          $project:
            period === "week"
              ? {
                  _id: 0,
                  label: {
                    $concat: [
                      { $toString: "$_id.y" },
                      "-W",
                      {
                        $cond: [
                          { $lt: ["$_id.w", 10] },
                          { $concat: ["0", { $toString: "$_id.w" }] },
                          { $toString: "$_id.w" }
                        ]
                      }
                    ]
                  },
                  expense: 1,
                  items: 1
                }
              : { _id: 0, label: "$_id", expense: 1, items: 1 }
        }
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const byLabel = new Map();
    for (const r of revSeries) {
      byLabel.set(r.label, { label: r.label, revenue: r.revenue || 0, orders: r.orders || 0, expense: 0 });
    }
    for (const e of expSeries) {
      const cur = byLabel.get(e.label) || { label: e.label, revenue: 0, orders: 0, expense: 0 };
      cur.expense = Number(e.expense || 0);
      byLabel.set(e.label, cur);
    }
    const series = Array.from(byLabel.values()).sort((a, b) => compareReportLabels(period, a, b));
    const totals = series.reduce(
      (acc, x) => {
        acc.revenue += Number(x.revenue || 0);
        acc.expense += Number(x.expense || 0);
        acc.orders += Number(x.orders || 0);
        return acc;
      },
      { revenue: 0, expense: 0, orders: 0 }
    );
    totals.expense = Number(expenseTotalAgg[0]?.total || 0);
    totals.profit = totals.revenue - totals.expense;

    return res.json({
      period,
      status,
      range: { from, to },
      totals,
      series: series.map((x) => ({ ...x, profit: Number(x.revenue || 0) - Number(x.expense || 0) }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/reports/trial-balance", auth, isAdmin, async (req, res) => {
  try {
    const { from, to } = resolveReportBounds(req.query.from, req.query.to, "month");
    const match = { date: { $gte: from, $lte: to } };
    const grouped = await JournalEntry.aggregate([
      { $match: match },
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.account",
          debit: { $sum: "$lines.debit" },
          credit: { $sum: "$lines.credit" }
        }
      }
    ]);
    const accountIds = grouped.map((x) => x._id).filter(Boolean);
    const accounts = await Account.find({ _id: { $in: accountIds } }).lean();
    const accById = new Map(accounts.map((a) => [String(a._id), a]));
    const rows = grouped.map((row) => {
      const account = accById.get(String(row._id));
      return {
        accountId: row._id,
        code: account?.code || "N/A",
        name: account?.name || "Unknown",
        type: account?.type || "unknown",
        debit: Number(row.debit || 0),
        credit: Number(row.credit || 0),
        balance: Number(row.debit || 0) - Number(row.credit || 0)
      };
    }).sort((a, b) => a.code.localeCompare(b.code));
    const totals = rows.reduce((acc, row) => {
      acc.debit += row.debit;
      acc.credit += row.credit;
      return acc;
    }, { debit: 0, credit: 0 });
    return res.json({ range: { from, to }, totals, rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/reports/pnl", auth, isAdmin, async (req, res) => {
  try {
    const { from, to } = resolveReportBounds(req.query.from, req.query.to, "month");
    const match = { date: { $gte: from, $lte: to } };
    const grouped = await JournalEntry.aggregate([
      { $match: match },
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.account",
          debit: { $sum: "$lines.debit" },
          credit: { $sum: "$lines.credit" }
        }
      }
    ]);
    const accountIds = grouped.map((x) => x._id).filter(Boolean);
    const accounts = await Account.find({ _id: { $in: accountIds } }).lean();
    const accById = new Map(accounts.map((a) => [String(a._id), a]));
    let revenue = 0;
    let expense = 0;
    for (const row of grouped) {
      const account = accById.get(String(row._id));
      if (!account) continue;
      const dr = Number(row.debit || 0);
      const cr = Number(row.credit || 0);
      if (account.type === "revenue") revenue += cr - dr;
      if (account.type === "expense") expense += dr - cr;
    }
    return res.json({
      range: { from, to },
      totals: {
        revenue,
        expense,
        profit: revenue - expense
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/reports/ar-aging", auth, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const invoices = await Invoice.find({
      status: { $in: ["posted"] },
      totalAmount: { $gt: 0 }
    }).lean();

    const buckets = {
      "0_30": 0,
      "31_60": 0,
      "61_90": 0,
      "90_plus": 0
    };

    const rows = invoices.map((invoice) => {
      const due = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.createdAt);
      const diffDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)));
      const amount = Number(invoice.totalAmount || 0);
      let bucket = "0_30";
      if (diffDays > 90) bucket = "90_plus";
      else if (diffDays > 60) bucket = "61_90";
      else if (diffDays > 30) bucket = "31_60";
      buckets[bucket] += amount;
      return {
        invoiceId: invoice._id,
        code: invoice.code,
        customerName: invoice.customerName,
        dueDate: due,
        overdueDays: diffDays,
        amount,
        bucket
      };
    });

    return res.json({
      asOf: now,
      totals: buckets,
      grandTotal: Object.values(buckets).reduce((s, x) => s + Number(x || 0), 0),
      rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/reports/finance-kpis", auth, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const deliveredRevenueAgg = await Order.aggregate([
      { $match: { status: "delivered", createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]);
    const expenseAgg = await Expense.aggregate([
      { $match: { expenseDate: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, expense: { $sum: "$amount" } } }
    ]);
    const refundAgg = await Order.aggregate([
      { $match: { refundStatus: "refunded", refundedAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$refundAmount" } } }
    ]);
    const arAgg = await Invoice.aggregate([
      { $match: { status: "posted" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const revenue = Number(deliveredRevenueAgg[0]?.revenue || 0);
    const deliveredOrders = Number(deliveredRevenueAgg[0]?.orders || 0);
    const operatingExpense = Number(expenseAgg[0]?.expense || 0);
    const refundCount = Number(refundAgg[0]?.count || 0);
    const refundAmount = Number(refundAgg[0]?.amount || 0);
    const arOutstanding = Number(arAgg[0]?.total || 0);
    const grossProfit = revenue - operatingExpense;
    const refundRate = deliveredOrders > 0 ? refundCount / deliveredOrders : 0;
    const grossMargin = revenue > 0 ? grossProfit / revenue : 0;
    const arTurnover = arOutstanding > 0 ? revenue / arOutstanding : 0;

    return res.json({
      period: { from: monthStart, to: monthEnd },
      totals: {
        revenue,
        operatingExpense,
        grossProfit,
        grossMargin,
        refundCount,
        refundAmount,
        refundRate,
        arOutstanding,
        arTurnover
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

