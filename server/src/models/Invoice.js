import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, default: "" },
    subtotal: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "posted", "paid", "cancelled"],
      default: "draft"
    },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1, createdAt: -1 });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
