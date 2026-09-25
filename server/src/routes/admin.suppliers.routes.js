import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Supplier } from "../models/Supplier.js";

const router = express.Router();

router.get("/suppliers", auth, isAdmin, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 }).lean();
    return res.json(suppliers);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/suppliers", auth, isAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    return res.status(201).json(supplier);
  } catch (error) {
    return res.status(400).json({ message: "Invalid supplier payload" });
  }
});

router.put("/suppliers/:id", auth, isAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.json(supplier);
  } catch (error) {
    return res.status(400).json({ message: "Invalid supplier payload" });
  }
});

router.delete("/suppliers/:id", auth, isAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
