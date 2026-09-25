import express from "express";
import mongoose from "mongoose";
import { auth, isAdmin, isStaff } from "../middlewares/auth.js";
import { Product } from "../models/Product.js";
import { InventoryMovement } from "../models/InventoryMovement.js";

const router = express.Router();

router.get("/inventory/movements", auth, isStaff, async (req, res) => {
  try {
    const movements = await InventoryMovement.find()
      .populate("product", "name stock category")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.json(movements);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/inventory/movements", auth, isStaff, async (req, res) => {
  try {
    const { product, type, quantity, reason, note } = req.body || {};
    if (!product || !type || quantity === undefined || quantity === null) {
      return res.status(400).json({ message: "product, type, quantity are required" });
    }
    if (!["in", "out", "adjustment"].includes(type)) {
      return res.status(400).json({ message: "Invalid movement type" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(product))) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const qty = Number(quantity);
    const min = type === "adjustment" ? 0 : 1;
    if (!Number.isInteger(qty) || qty < min) {
      return res.status(400).json({ message: `quantity must be an integer >= ${min}` });
    }
    const allowedReasons = ["purchase", "sale", "return", "damage", "manual"];
    const movementReason = allowedReasons.includes(reason) ? reason : "manual";

    // Cập nhật tồn kho nguyên tử (không đọc-rồi-ghi) để tránh lệch khi có đơn đồng thời
    let p;
    if (type === "in") {
      p = await Product.findByIdAndUpdate(product, { $inc: { stock: qty } }, { new: true });
    } else if (type === "out") {
      p = await Product.findOneAndUpdate({ _id: product, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { new: true });
      if (!p) {
        const exists = await Product.findById(product).select("stock");
        return exists
          ? res.status(400).json({ message: `Not enough stock (${exists.stock})` })
          : res.status(404).json({ message: "Product not found" });
      }
    } else {
      p = await Product.findByIdAndUpdate(product, { $set: { stock: qty } }, { new: true });
    }
    if (!p) return res.status(404).json({ message: "Product not found" });

    const movement = await InventoryMovement.create({
      product: p._id,
      type,
      quantity: qty,
      reason: movementReason,
      note: typeof note === "string" ? note.slice(0, 500) : "",
      refType: "manual",
      refId: "",
      createdBy: req.user?._id || null
    });

    return res.status(201).json({ movement, product: p });
  } catch (error) {
    return res.status(400).json({ message: "Invalid movement payload" });
  }
});

export default router;
