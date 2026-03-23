import mongoose from "mongoose";

const paymentConfigSchema = new mongoose.Schema(
  {
    // Chuyển khoản ngân hàng
    bankName: { type: String, trim: true, default: "" },
    bankAccount: { type: String, trim: true, default: "" },
    accountHolder: { type: String, trim: true, default: "" },
    qrImageUrl: { type: String, trim: true, default: "" },
    // Ví MoMo / ZaloPay (SĐT nhận tiền)
    momoPhone: { type: String, trim: true, default: "" },
    zalopayPhone: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export const PaymentConfig = mongoose.model("PaymentConfig", paymentConfigSchema);
