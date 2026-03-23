import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { PaymentConfig } from "../models/PaymentConfig.js";

const router = express.Router();

async function getConfig() {
  let config = await PaymentConfig.findOne();
  if (!config) {
    config = await PaymentConfig.create({});
  }
  return config;
}

/** GET /api/admin/payment-config — admin xem cấu hình */
router.get("/payment-config", auth, isAdmin, async (req, res) => {
  try {
    const config = await getConfig();
    return res.json(config);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

/** PUT /api/admin/payment-config — admin cập nhật STK, QR, SĐT ví */
router.put("/payment-config", auth, isAdmin, async (req, res) => {
  try {
    const { bankName, bankAccount, accountHolder, qrImageUrl, momoPhone, zalopayPhone } = req.body;
    const config = await PaymentConfig.findOneAndUpdate(
      {},
      {
        $set: {
          ...(bankName !== undefined && { bankName: String(bankName).trim() }),
          ...(bankAccount !== undefined && { bankAccount: String(bankAccount).trim() }),
          ...(accountHolder !== undefined && { accountHolder: String(accountHolder).trim() }),
          ...(qrImageUrl !== undefined && { qrImageUrl: String(qrImageUrl).trim() }),
          ...(momoPhone !== undefined && { momoPhone: String(momoPhone).trim() }),
          ...(zalopayPhone !== undefined && { zalopayPhone: String(zalopayPhone).trim() })
        }
      },
      { new: true, upsert: true }
    );
    return res.json(config);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;