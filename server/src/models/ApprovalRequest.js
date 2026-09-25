import mongoose from "mongoose";

const approvalRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["discount", "refund", "purchase", "inventory_adjustment", "custom"],
      default: "custom"
    },
    title: { type: String, required: true, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    requiredApprovals: { type: Number, min: 1, default: 1 },
    approvalSteps: {
      type: [
        {
          approver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          status: { type: String, enum: ["approved", "rejected"], required: true },
          note: { type: String, trim: true, default: "" },
          at: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decisionNote: { type: String, trim: true, default: "" },
    decidedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

approvalRequestSchema.index({ status: 1, createdAt: -1 });

export const ApprovalRequest = mongoose.model("ApprovalRequest", approvalRequestSchema);
