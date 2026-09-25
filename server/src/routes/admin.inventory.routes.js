import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Product } from "../models/Product.js";
import { InventoryMovement } from "../models/InventoryMovement.js";

const router = express.Router();

router.get("/inventory/movements", auth, isAdmin, async (req, res) => {
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

router.post("/inventory/movements", auth, isAdmin, async (req, res) => {
  try {
    const { product, type, quantity, reason, note } = req.body || {};
    if (!product || !type || !quantity) {
      return res.status(400).json({ message: "product, type, quantity are required" });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be >= 1" });
    }
    const p = await Product.findById(product);
    if (!p) return res.status(404).json({ message: "Product not found" });

    if (type === "out" && p.stock < qty) {
      return res.status(400).json({ message: `Not enough stock (${p.stock})` });
    }

    if (type === "in") p.stock += qty;
    if (type === "out") p.stock -= qty;
    if (type === "adjustment") p.stock = qty;
    await p.save();

    const movement = await InventoryMovement.create({
      product: p._id,
      type,
      quantity: qty,
      reason: reason || "manual",
      note: note || "",
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
