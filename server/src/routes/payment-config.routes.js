import express from "express";
import { PaymentConfig } from "../models/PaymentConfig.js";
import { getEnabledPaymentMethods } from "../services/paymentMethods.js";
import { freeShippingThreshold, shippingFlatFee, storePickupAddress } from "../constants/checkout.js";

const router = express.Router();

async function getConfig() {
  let config = await PaymentConfig.findOne();
  if (!config) {
    config = await PaymentConfig.create({});
  }
  return config;
}

/** GET /api/payment-config/checkout — phí ship, ngưỡng miễn phí, địa chỉ nhận tại cửa hàng (nguồn duy nhất cho giao diện) */
router.get("/checkout", (req, res) => {
  res.json({
    shippingFlatFee: shippingFlatFee(),
    freeShippingThreshold: freeShippingThreshold(),
    pickupAddress: storePickupAddress()
  });
});

/** GET /api/payment-config — công khai, cho trang chi tiết đơn (khách) */
router.get("/", async (req, res) => {
  try {
    const config = await getConfig();
    return res.json({ ...config.toObject(), enabledMethods: await getEnabledPaymentMethods() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
