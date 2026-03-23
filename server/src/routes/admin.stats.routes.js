import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";

const router = express.Router();

router.get("/stats", auth, isAdmin, async (req, res) => {
  try {
    const [orderCounts, paymentBreakdown, totals, customers, products] = await Promise.all([
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
        { $sort: { revenue: -1 } }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            revenueAll: { $sum: "$totalPrice" },
            revenueDelivered: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered"] }, "$totalPrice", 0]
              }
            },
            totalOrders: { $sum: 1 }
          }
        }
      ]),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({})
    ]);

    const counts = Object.fromEntries(orderCounts.map((x) => [x._id, x.count]));
    const payment = Object.fromEntries(
      paymentBreakdown.map((x) => [x._id, { count: x.count, revenue: x.revenue }])
    );
    const t = totals?.[0] || { revenueAll: 0, revenueDelivered: 0, totalOrders: 0 };

    return res.json({
      orders: {
        total: t.totalOrders || 0,
        byStatus: {
          pending: counts.pending || 0,
          processing: counts.processing || 0,
          shipped: counts.shipped || 0,
          delivered: counts.delivered || 0,
          cancelled: counts.cancelled || 0
        }
      },
      revenue: {
        all: t.revenueAll || 0,
        delivered: t.revenueDelivered || 0
      },
      customers,
      products,
      payment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

