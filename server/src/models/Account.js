import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["asset", "liability", "equity", "revenue", "expense"],
      required: true
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

accountSchema.index({ type: 1, code: 1 });

export const Account = mongoose.model("Account", accountSchema);
