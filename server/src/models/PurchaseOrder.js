import mongoose from "mongoose";

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    items: { type: [purchaseOrderItemSchema], default: [] },
    expectedDate: { type: Date, default: null },
    receivedDate: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "ordered", "received", "cancelled"],
      default: "draft"
    },
    requiresApproval: { type: Boolean, default: false },
    approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null },
    totalAmount: { type: Number, min: 0, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ status: 1, createdAt: -1 });

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
