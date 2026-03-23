import express from "express";
import { PaymentConfig } from "../models/PaymentConfig.js";

const router = express.Router();

async function getConfig() {
  let config = await PaymentConfig.findOne();
  if (!config) {
    config = await PaymentConfig.create({});
  }
  return config;
}

/** GET /api/payment-config — công khai, cho trang chi tiết đơn (khách) */
router.get("/", async (req, res) => {
  try {
    const config = await getConfig();
    return res.json(config);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
