import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },
    paymentMethods: {
      type: [String],
      default: ["cod"],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.every((m) => ["cod", "bank_transfer", "momo", "zalopay"].includes(m)),
        message: "Invalid payment method"
      }
    },
    defaultPaymentMethod: {
      type: String,
      enum: ["cod", "bank_transfer", "momo", "zalopay"],
      default: "cod"
    },
    // Stores SHA-256 hash of the reset token (never store the raw token).
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
