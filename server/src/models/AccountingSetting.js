import mongoose from "mongoose";

/** Cấu hình kế toán (một document duy nhất). lockedUntil: mọi bút toán/chi phí có ngày <= mốc này bị khóa (khóa kỳ). */
const accountingSettingSchema = new mongoose.Schema(
  {
    lockedUntil: { type: Date, default: null },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export const AccountingSetting = mongoose.model("AccountingSetting", accountingSettingSchema);
