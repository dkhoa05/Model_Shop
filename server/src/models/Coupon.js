import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 40
    },
    /** percent: value = % (1–100); fixed: value = số tiền VND */
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    /** Chỉ khi type = percent — trần số tiền giảm (VND), null = không trần */
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    /** Tổng tiền hàng tối thiểu để áp mã */
    minOrderSubtotal: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    /** null = không giới hạn */
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    /** Mô tả hiển thị gợi ý (tuỳ chọn) */
    description: { type: String, trim: true, default: "" },
    /** Rỗng = áp dụng mọi sản phẩm (theo tổng tiền hàng & tối thiểu). Có id = chỉ tính giảm trên các dòng sản phẩm này; tối thiểu áp trên tổng phần đó */
    applicableProductIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: []
    },
    requiresApproval: { type: Boolean, default: false },
    approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null }
  },
  { timestamps: true }
);

couponSchema.pre("save", function (next) {
  if (this.code) this.code = String(this.code).trim().toUpperCase();
  next();
});

export const Coupon = mongoose.model("Coupon", couponSchema);
