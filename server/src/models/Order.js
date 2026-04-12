import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    /** null = đặt hàng không đăng nhập (khách vãng lai) */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    recipientName: { type: String, trim: true, default: "" },
    guestEmail: { type: String, trim: true, default: "" },
    addressProvince: { type: String, trim: true, default: "" },
    addressDistrict: { type: String, trim: true, default: "" },
    addressWard: { type: String, trim: true, default: "" },
    addressDetail: { type: String, trim: true, default: "" },
    items: { type: [orderItemSchema], required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    /** Tổng tiền hàng (trước ship & giảm giá) */
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, trim: true, default: "" },
    deliveryType: {
      type: String,
      enum: ["pickup", "delivery"],
      default: "delivery",
      required: true
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "bank_transfer", "momo", "zalopay"],
      default: "cod",
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
      required: true
    },
    paidAt: { type: Date },
    paymentRef: { type: String, trim: true },
    paymentProofUrl: { type: String, trim: true },
    paymentProofSubmittedAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

/** Mỗi tài khoản chỉ một đơn có cùng mã giảm giá (tránh tái sử dụng + race) */
orderSchema.index(
  { user: 1, couponCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $type: "objectId" },
      couponCode: { $type: "string", $gt: "" }
    }
  }
);

export const Order = mongoose.model("Order", orderSchema);
