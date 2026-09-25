import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    source: {
      type: String,
      enum: ["website", "facebook", "zalo", "walk_in", "other"],
      default: "website"
    },
    stage: {
      type: String,
      enum: ["new", "qualified", "proposal", "won", "lost"],
      default: "new"
    },
    expectedValue: { type: Number, min: 0, default: 0 },
    note: { type: String, trim: true, default: "" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    nextActionAt: { type: Date, default: null }
  },
  { timestamps: true }
);

leadSchema.index({ stage: 1, createdAt: -1 });
leadSchema.index({ email: 1, phone: 1 });

export const Lead = mongoose.model("Lead", leadSchema);
