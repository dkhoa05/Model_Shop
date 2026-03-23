import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Order } from "../models/Order.js";
import { Expense } from "../models/Expense.js";

const router = express.Router();

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
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

    const parsedFrom = toDateOrNull(req.query.from);
    const parsedTo = toDateOrNull(req.query.to);
    const def = getDefaultRange(period);
    const from = parsedFrom || def.from;
    const to = parsedTo || def.to;

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

    const parsedFrom = toDateOrNull(req.query.from);
    const parsedTo = toDateOrNull(req.query.to);
    const def = getDefaultRange(period);
    const from = parsedFrom || def.from;
    const to = parsedTo || def.to;

    const orderMatch = { createdAt: { $gte: from, $lte: to } };
    if (status && status !== "all") orderMatch.status = status;

    const expenseMatch = { expenseDate: { $gte: from, $lte: to } };

    const [revSeries, expSeries] = await Promise.all([
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
    const series = Array.from(byLabel.values()).sort((a, b) => String(a.label).localeCompare(String(b.label)));
    const totals = series.reduce(
      (acc, x) => {
        acc.revenue += Number(x.revenue || 0);
        acc.expense += Number(x.expense || 0);
        acc.orders += Number(x.orders || 0);
        return acc;
      },
      { revenue: 0, expense: 0, orders: 0 }
    );
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

export default router;

