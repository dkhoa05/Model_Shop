import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";
import { auth } from "../middlewares/auth.js";
import { sendPasswordResetEmail } from "../services/mail.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Họ tên, tên đăng nhập, email và mật khẩu là bắt buộc" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    const un = String(username).toLowerCase().trim();
    const em = String(email).toLowerCase().trim();
    const existing = await User.findOne({ $or: [{ email: em }, { username: un }] });
    if (existing) {
      return res.status(400).json({ message: "Email hoặc tên đăng nhập đã được sử dụng" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username: un, email: em, password: hashed });

    return res.status(201).json({ id: user._id, name: user.name, email: user.email, username: user.username });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập/email và mật khẩu" });
    }
    const id = String(identifier).toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: id }, { username: id }]
    });
    if (!user) {
      return res.status(400).json({ message: "Tên đăng nhập/email hoặc mật khẩu không đúng" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Tài khoản đã bị chặn. Vui lòng liên hệ admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Tên đăng nhập/email hoặc mật khẩu không đúng" });
    }

    const jwtSecret = process.env.JWT_SECRET || "dev_secret";
    if (process.env.NODE_ENV === "production" && jwtSecret === "dev_secret") {
      return res.status(500).json({ message: "Server misconfigured: missing JWT_SECRET" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", auth, (req, res) => {
  return res.json(req.user);
});

router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone, avatarUrl, paymentMethods, defaultPaymentMethod } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Họ tên là bắt buộc" });
    }
    const allowedPm = ["cod", "bank_transfer", "momo", "zalopay"];
    let nextPaymentMethods = req.user.paymentMethods;
    let nextDefault = req.user.defaultPaymentMethod;
    if (Array.isArray(paymentMethods)) {
      const uniq = Array.from(new Set(paymentMethods.map((x) => String(x))));
      const valid = uniq.filter((m) => allowedPm.includes(m));
      nextPaymentMethods = valid.length ? valid : ["cod"];
      if (nextDefault && !nextPaymentMethods.includes(nextDefault)) nextDefault = nextPaymentMethods[0];
    }
    if (typeof defaultPaymentMethod === "string" && allowedPm.includes(defaultPaymentMethod)) {
      nextDefault = defaultPaymentMethod;
      if (Array.isArray(nextPaymentMethods) && !nextPaymentMethods.includes(nextDefault)) {
        nextPaymentMethods = [...nextPaymentMethods, nextDefault];
      }
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        phone: typeof phone === "string" ? phone.trim() : req.user.phone,
        avatarUrl: typeof avatarUrl === "string" ? avatarUrl.trim() : req.user.avatarUrl,
        paymentMethods: nextPaymentMethods,
        defaultPaymentMethod: nextDefault
      },
      { new: true }
    ).select("-password");
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "User not found" });
    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    const hashed = await bcrypt.hash(String(newPassword), 10);
    await User.findByIdAndUpdate(req.user._id, { password: hashed });
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "Nếu email đã đăng ký trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút. Hãy kiểm tra cả mục Thư rác.";

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });
    const em = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: em });

    const baseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await User.findByIdAndUpdate(user._id, { resetToken: tokenHash, resetTokenExpiry: expiry });

    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetLink
    });

    if (mailResult.sent) {
      return res.json({ message: genericMessage });
    }

    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      const msgNotConfigured =
        "Chưa đọc được SMTP trong .env — kiểm tra file server/.env có SMTP_HOST, SMTP_USER, SMTP_PASS; lưu file và restart server.";
      const msgSendFailed =
        "SMTP đã cấu hình nhưng gửi thất bại (sai mật khẩu ứng dụng, chưa bật 2FA Gmail, v.v.). Xem log terminal [mail]. Dưới đây là link dev để thử.";
      return res.json({
        message:
          mailResult.reason === "send_failed" ? msgSendFailed : msgNotConfigured,
        resetLink,
        devReason: mailResult.reason || "unknown"
      });
    }

    return res.status(503).json({
      message:
        "Không thể gửi email lúc này. Vui lòng thử lại sau hoặc liên hệ quản trị (kiểm tra SMTP trên server)."
    });
  } catch (error) {
    console.error("[forgot-password]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token và mật khẩu mới là bắt buộc" });
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({ resetToken: tokenHash, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Link không hợp lệ hoặc đã hết hạn" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed, resetToken: null, resetTokenExpiry: null });
    return res.json({ message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập." });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
