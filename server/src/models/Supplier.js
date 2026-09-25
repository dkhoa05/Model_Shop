import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });

export const Supplier = mongoose.model("Supplier", supplierSchema);
