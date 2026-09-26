import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { auth } from "../middlewares/auth.js";
import { sendPasswordResetEmail } from "../services/mail.js";
import { setAuthCookie, clearAuthCookie } from "../utils/authToken.js";
import { loginLimiter, registerLimiter, forgotLimiter } from "../middlewares/security.js";

const router = express.Router();

function isSafeImageUrl(u) {
  return u === "" || u.startsWith("/uploads/") || /^https:\/\//i.test(u);
}
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function passwordError(pw) {
  if (typeof pw !== "string" || pw.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (pw.length > 72) return "Mật khẩu tối đa 72 ký tự";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Mật khẩu phải gồm cả chữ và số";
  return "";
}

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if ([name, username, email, password].some((v) => typeof v !== "string" || !v.trim())) {
      return res.status(400).json({ message: "Họ tên, tên đăng nhập, email và mật khẩu là bắt buộc" });
    }
    const pwErr = passwordError(password);
    if (pwErr) return res.status(400).json({ message: pwErr });
    const un = username.toLowerCase().trim();
    const em = email.toLowerCase().trim();
    if (!/^[a-z0-9_.-]{3,30}$/.test(un)) {
      return res.status(400).json({ message: "Tên đăng nhập 3–30 ký tự (a-z, 0-9, _ . -)" });
    }
    if (!EMAIL_RE.test(em) || em.length > 254) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    const existing = await User.findOne({ $or: [{ email: em }, { username: un }] });
    if (existing) {
      return res.status(400).json({ message: "Email hoặc tên đăng nhập đã được sử dụng" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim().slice(0, 100), username: un, email: em, password: hashed });

    return res.status(201).json({ id: user._id, name: user.name, email: user.email, username: user.username });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập/email và mật khẩu" });
    }
    const id = String(identifier).toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: id }, { username: id }]
    });
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH); // giảm chênh lệch thời gian để khó dò tài khoản
      return res.status(400).json({ message: "Tên đăng nhập/email hoặc mật khẩu không đúng" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Tên đăng nhập/email hoặc mật khẩu không đúng" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Tài khoản đã bị chặn. Vui lòng liên hệ admin." });
    }

    setAuthCookie(res, user);

    return res.json({
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

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Đã đăng xuất" });
});

/** Không trả các trường nội bộ (tokenVersion, reset token, __v) */
function publicUser(u) {
  const o = typeof u.toObject === "function" ? u.toObject() : { ...u };
  delete o.password;
  delete o.tokenVersion;
  delete o.resetToken;
  delete o.resetTokenExpiry;
  delete o.__v;
  return o;
}

router.get("/me", auth, (req, res) => {
  return res.json(publicUser(req.user));
});

router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone, address, avatarUrl, paymentMethods, defaultPaymentMethod } = req.body || {};
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
        phone: typeof phone === "string" ? phone.trim().slice(0, 20) : req.user.phone,
        address: typeof address === "string" ? address.trim().slice(0, 500) : req.user.address,
        avatarUrl: typeof avatarUrl === "string" && isSafeImageUrl(avatarUrl.trim()) ? avatarUrl.trim() : req.user.avatarUrl,
        paymentMethods: nextPaymentMethods,
        defaultPaymentMethod: nextDefault
      },
      { new: true }
    ).select("-password -tokenVersion -resetToken -resetTokenExpiry -__v");
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
    const pwErr = passwordError(newPassword);
    if (pwErr) return res.status(400).json({ message: pwErr });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "User not found" });
    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    const hashed = await bcrypt.hash(String(newPassword), 10);
    const fresh = await User.findByIdAndUpdate(
      req.user._id,
      { password: hashed, $inc: { tokenVersion: 1 } },
      { new: true }
    );
    setAuthCookie(res, fresh); // phiên hiện tại tiếp tục, các phiên khác bị thu hồi
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", forgotLimiter, async (req, res) => {
  const genericMessage =
    "Nếu email đã đăng ký trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút. Hãy kiểm tra cả mục Thư rác.";

  try {
    const { email } = req.body || {};
    if (typeof email !== "string" || !email.trim()) return res.status(400).json({ message: "Vui lòng nhập email" });
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
    const pwErr = passwordError(newPassword);
    if (pwErr) return res.status(400).json({ message: pwErr });
    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({ resetToken: tokenHash, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Link không hợp lệ hoặc đã hết hạn" });

    const hashed = await bcrypt.hash(String(newPassword), 10);
    await User.findByIdAndUpdate(user._id, { password: hashed, resetToken: null, resetTokenExpiry: null, $inc: { tokenVersion: 1 } });
    return res.json({ message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập." });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
