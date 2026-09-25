import express from "express";
import { auth, isAdmin, isStaff } from "../middlewares/auth.js";
import { Lead } from "../models/Lead.js";
import { validateObjectId } from "../utils/validate.js";

const router = express.Router();
router.param("id", validateObjectId);

router.get("/leads", auth, isStaff, async (req, res) => {
  try {
    const { stage, q } = req.query;
    const filter = {};
    if (stage) filter.stage = stage;
    if (q && String(q).trim()) {
      const kw = String(q).trim();
      filter.$or = [
        { name: { $regex: kw, $options: "i" } },
        { email: { $regex: kw, $options: "i" } },
        { phone: { $regex: kw, $options: "i" } }
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/leads", auth, isStaff, async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    return res.status(201).json(lead);
  } catch (error) {
    return res.status(400).json({ message: "Invalid lead payload" });
  }
});

router.put("/leads/:id", auth, isStaff, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    return res.json(lead);
  } catch (error) {
    return res.status(400).json({ message: "Invalid lead payload" });
  }
});

router.delete("/leads/:id", auth, isStaff, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
