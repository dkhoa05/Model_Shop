import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: "Khác" },
    note: { type: String, trim: true, default: "" },
    expenseDate: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);

