import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { Expense } from "../models/Expense.js";
import { parseOptionalDayBounds } from "../utils/dateRangeQuery.js";

const router = express.Router();

router.get("/expenses", auth, isAdmin, async (req, res) => {
  try {
    const { from, to } = parseOptionalDayBounds(req.query.from, req.query.to);
    const match = {};
    if (from) match.expenseDate = { ...(match.expenseDate || {}), $gte: from };
    if (to) match.expenseDate = { ...(match.expenseDate || {}), $lte: to };

    const items = await Expense.find(match).sort({ expenseDate: -1, createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/expenses", auth, isAdmin, async (req, res) => {
  try {
    const { title, amount, category, note, expenseDate } = req.body || {};
    if (!title || typeof title !== "string") return res.status(400).json({ message: "Tiêu đề là bắt buộc" });
    if (!Number.isFinite(Number(amount)) || Number(amount) < 0) return res.status(400).json({ message: "Số tiền không hợp lệ" });

    const d = expenseDate ? new Date(String(expenseDate)) : new Date();
    if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Ngày chi không hợp lệ" });

    const item = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      category: category ? String(category).trim() : "Khác",
      note: note ? String(note).trim() : "",
      expenseDate: d
    });
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/expenses/:id", auth, isAdmin, async (req, res) => {
  try {
    const { title, amount, category, note, expenseDate } = req.body || {};
    const update = {};
    if (typeof title === "string") update.title = title.trim();
    if (amount !== undefined) {
      if (!Number.isFinite(Number(amount)) || Number(amount) < 0) return res.status(400).json({ message: "Số tiền không hợp lệ" });
      update.amount = Number(amount);
    }
    if (typeof category === "string") update.category = category.trim();
    if (typeof note === "string") update.note = note.trim();
    if (expenseDate !== undefined) {
      const d = new Date(String(expenseDate));
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Ngày chi không hợp lệ" });
      update.expenseDate = d;
    }

    const item = await Expense.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Không tìm thấy khoản chi" });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/expenses/:id", auth, isAdmin, async (req, res) => {
  try {
    const item = await Expense.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy khoản chi" });
    return res.json({ message: "Đã xóa" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

