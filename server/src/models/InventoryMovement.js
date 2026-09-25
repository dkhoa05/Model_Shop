import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: {
      type: String,
      enum: ["in", "out", "adjustment"],
      required: true
    },
    /** in/out: số lượng thay đổi; adjustment: tồn kho mới (>= 0) */
    quantity: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: ["purchase", "sale", "return", "damage", "manual"],
      default: "manual"
    },
    note: { type: String, trim: true, default: "" },
    refType: { type: String, trim: true, default: "" },
    refId: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model("InventoryMovement", inventoryMovementSchema);
