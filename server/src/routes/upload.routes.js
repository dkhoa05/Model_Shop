import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { uploadImage } from "../config/upload.js";

const router = express.Router();

router.post("/", auth, isAdmin, uploadImage.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// Upload avatar for logged-in users
router.post("/avatar", auth, uploadImage.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// Upload minh chứng thanh toán (đã đăng nhập hoặc khách — optionalAuth)
router.post("/payment-proof", optionalAuth, uploadImage.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default router;

