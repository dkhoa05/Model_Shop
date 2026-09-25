import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// List customers (role=user) with simple search
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = { role: "user" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    }
    const users = await User.find(filter)
      .select("-password -resetToken -resetTokenExpiry")
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Create a customer account
router.post("/users", auth, isAdmin, async (req, res) => {
  try {
    const { name, username, email, phone, avatarUrl, password, isBlocked, paymentMethods, defaultPaymentMethod } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Họ tên, username, email, password là bắt buộc" });
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
    const hashed = await bcrypt.hash(String(password), 10);
    const allowedPm = ["cod", "bank_transfer", "momo", "zalopay"];
    const pmList = Array.isArray(paymentMethods)
      ? Array.from(new Set(paymentMethods.map((x) => String(x)))).filter((m) => allowedPm.includes(m))
      : ["cod"];
    const pmDefault =
      typeof defaultPaymentMethod === "string" && allowedPm.includes(defaultPaymentMethod)
        ? defaultPaymentMethod
        : (pmList[0] || "cod");
    const finalPmList = pmList.includes(pmDefault) ? pmList : [...pmList, pmDefault];

    const user = await User.create({
      name: String(name).trim(),
      username: un,
      email: em,
      phone: phone ? String(phone).trim() : "",
      avatarUrl: avatarUrl ? String(avatarUrl).trim() : "",
      password: hashed,
      role: "user",
      isBlocked: Boolean(isBlocked),
      paymentMethods: finalPmList.length ? finalPmList : ["cod"],
      defaultPaymentMethod: pmDefault
    });
    return res.status(201).json({
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isBlocked: user.isBlocked,
      paymentMethods: user.paymentMethods,
      defaultPaymentMethod: user.defaultPaymentMethod,
      createdAt: user.createdAt
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update customer basic info + block flag
router.put("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const { name, phone, avatarUrl, isBlocked, paymentMethods, defaultPaymentMethod } = req.body || {};
    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof phone === "string") update.phone = phone.trim();
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl.trim();
    if (typeof isBlocked === "boolean") update.isBlocked = isBlocked;
    const allowedPm = ["cod", "bank_transfer", "momo", "zalopay"];
    if (Array.isArray(paymentMethods)) {
      const uniq = Array.from(new Set(paymentMethods.map((x) => String(x))));
      const valid = uniq.filter((m) => allowedPm.includes(m));
      update.paymentMethods = valid.length ? valid : ["cod"];
    }
    if (typeof defaultPaymentMethod === "string" && allowedPm.includes(defaultPaymentMethod)) {
      update.defaultPaymentMethod = defaultPaymentMethod;
    }

    let user = await User.findOne({ _id: req.params.id, role: "user" });
    if (!user) return res.status(404).json({ message: "Customer not found" });
    if (update.paymentMethods && update.defaultPaymentMethod && !update.paymentMethods.includes(update.defaultPaymentMethod)) {
      update.paymentMethods = [...update.paymentMethods, update.defaultPaymentMethod];
    } else if (update.paymentMethods && !update.defaultPaymentMethod) {
      const nextDefault = user.defaultPaymentMethod || "cod";
      if (!update.paymentMethods.includes(nextDefault)) update.defaultPaymentMethod = update.paymentMethods[0] || "cod";
    } else if (update.defaultPaymentMethod && !update.paymentMethods) {
      const nextList = Array.isArray(user.paymentMethods) ? user.paymentMethods : ["cod"];
      if (!nextList.includes(update.defaultPaymentMethod)) update.paymentMethods = [...nextList, update.defaultPaymentMethod];
    }

    user = await User.findOneAndUpdate({ _id: req.params.id, role: "user" }, update, { new: true }).select(
      "-password -resetToken -resetTokenExpiry"
    );

    if (!user) return res.status(404).json({ message: "Customer not found" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Reset customer password (admin)
router.post("/users/:id/reset-password", auth, isAdmin, async (req, res) => {
  try {
    const DEFAULT_RESET_PASSWORD = process.env.DEFAULT_RESET_PASSWORD || "Admin@123";
    const user = await User.findOne({ _id: req.params.id, role: "user" });
    if (!user) return res.status(404).json({ message: "Customer not found" });
    const hashed = await bcrypt.hash(String(DEFAULT_RESET_PASSWORD), 10);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    return res.json({ message: `Đặt lại mật khẩu thành công. Mật khẩu mới: ${DEFAULT_RESET_PASSWORD}` });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete customer (admin)
router.delete("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: "user" });
    if (!user) return res.status(404).json({ message: "Customer not found" });
    return res.json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// List admin accounts
router.get("/admins", auth, isAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = { role: "admin" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    }
    const admins = await User.find(filter)
      .select("-password -resetToken -resetTokenExpiry")
      .sort({ createdAt: -1 });
    return res.json(admins);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Create admin account
router.post("/admins", auth, isAdmin, async (req, res) => {
  try {
    const { name, username, email, phone, avatarUrl, password } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Name, username, email, password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must have at least 6 chars" });
    }
    const un = String(username).toLowerCase().trim();
    const em = String(email).toLowerCase().trim();
    const existing = await User.findOne({ $or: [{ email: em }, { username: un }] });
    if (existing) {
      return res.status(400).json({ message: "Email or username already exists" });
    }
    const hashed = await bcrypt.hash(String(password), 10);
    const admin = await User.create({
      name: String(name).trim(),
      username: un,
      email: em,
      phone: phone ? String(phone).trim() : "",
      avatarUrl: avatarUrl ? String(avatarUrl).trim() : "",
      password: hashed,
      role: "admin",
      isBlocked: false
    });
    return res.status(201).json({
      id: admin._id,
      name: admin.name,
      username: admin.username,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      createdAt: admin.createdAt
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/admins/:id", auth, isAdmin, async (req, res) => {
  try {
    const { name, phone, avatarUrl, isBlocked } = req.body || {};
    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof phone === "string") update.phone = phone.trim();
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl.trim();
    if (typeof isBlocked === "boolean") update.isBlocked = isBlocked;

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      update,
      { new: true }
    ).select("-password -resetToken -resetTokenExpiry");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    return res.json(admin);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/admins/:id/reset-password", auth, isAdmin, async (req, res) => {
  try {
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";
    const admin = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const hashed = await bcrypt.hash(String(defaultPassword), 10);
    await User.findByIdAndUpdate(admin._id, { password: hashed });
    return res.json({ message: `Reset thành công. Mật khẩu mới: ${defaultPassword}` });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

