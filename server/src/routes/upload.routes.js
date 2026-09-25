import express from "express";
import { auth, isAdmin, isBackoffice } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { uploadImage, verifyImageMagic } from "../config/upload.js";
import { uploadLimiter } from "../middlewares/security.js";

const router = express.Router();

router.post("/", auth, isBackoffice, uploadLimiter, uploadImage.single("image"), verifyImageMagic, (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// Upload avatar for logged-in users
router.post("/avatar", auth, uploadLimiter, uploadImage.single("image"), verifyImageMagic, (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// Upload minh chứng thanh toán (đã đăng nhập hoặc khách — optionalAuth)
router.post("/payment-proof", optionalAuth, uploadLimiter, uploadImage.single("image"), verifyImageMagic, (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default router;

