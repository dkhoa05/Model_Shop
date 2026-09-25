import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Lead } from "../models/Lead.js";
import { Supplier } from "../models/Supplier.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { Invoice } from "../models/Invoice.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";

const router = express.Router();

router.get("/stats", auth, isAdmin, async (req, res) => {
  try {
    const [orderCounts, paymentBreakdown, totals, customers, products, leads, suppliers, purchaseOrders, invoicesOpen, approvalsPending] = await Promise.all([
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
      Product.countDocuments({}),
      Lead.countDocuments({}),
      Supplier.countDocuments({ active: true }),
      PurchaseOrder.countDocuments({ status: { $in: ["draft", "ordered"] } }),
      Invoice.countDocuments({ status: { $in: ["draft", "posted"] } }),
      ApprovalRequest.countDocuments({ status: "pending" })
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
      leads,
      suppliers,
      purchaseOrdersOpen: purchaseOrders,
      invoicesOpen,
      approvalsPending,
      payment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

