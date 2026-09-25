import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { auth, isAdmin } from "../middlewares/auth.js";
import { escapeRegex, validateObjectId } from "../utils/validate.js";

const router = express.Router();
router.param("id", validateObjectId);

const STAFF_ROLES = ["admin", "staff", "accountant"];

// List customers (role=user) with simple search
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = { role: "user" };
    if (q) {
      filter.$or = [
        { name: { $regex: escapeRegex(q.slice(0, 100)), $options: "i" } },
        { username: { $regex: escapeRegex(q.slice(0, 100)), $options: "i" } },
        { email: { $regex: escapeRegex(q.slice(0, 100)), $options: "i" } },
        { phone: { $regex: escapeRegex(q.slice(0, 100)), $options: "i" } }
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
    if (String(password).length < 8) {
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
    const user = await User.findOne({ _id: req.params.id, role: "user" });
    if (!user) return res.status(404).json({ message: "Customer not found" });
    // Mật khẩu tạm ngẫu nhiên (hiển thị 1 lần); mọi phiên cũ bị thu hồi
    const tempPassword = `${crypto.randomBytes(6).toString("base64url")}9a`;
    const hashed = await bcrypt.hash(tempPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed, $inc: { tokenVersion: 1 } });
    return res.json({ message: `Đặt lại mật khẩu thành công. Mật khẩu tạm (chỉ hiển thị một lần): ${tempPassword}` });
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
    const filter = { role: { $in: STAFF_ROLES } };
    if (q) {
      const rx = { $regex: escapeRegex(q.slice(0, 100)), $options: "i" };
      filter.$or = [{ name: rx }, { username: rx }, { email: rx }, { phone: rx }];
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
    const { name, username, email, phone, avatarUrl, password, role } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Name, username, email, password are required" });
    }
    if (role !== undefined && !STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must have at least 8 chars" });
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
      role: role || "admin",
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
    const { name, phone, avatarUrl, isBlocked, role } = req.body || {};
    const update = {};
    if (role !== undefined) {
      if (!STAFF_ROLES.includes(role)) return res.status(400).json({ message: "Vai trò không hợp lệ" });
      update.role = role;
    }
    if (typeof name === "string") update.name = name.trim();
    if (typeof phone === "string") update.phone = phone.trim();
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl.trim();
    if (typeof isBlocked === "boolean") update.isBlocked = isBlocked;
    const self = String(req.params.id) === String(req.user._id);
    if (self && (update.isBlocked || (update.role && update.role !== "admin"))) {
      return res.status(400).json({ message: "Không thể tự chặn hoặc hạ quyền tài khoản của mình" });
    }
    // Luôn phải còn ít nhất 1 admin hoạt động
    if (update.isBlocked || (update.role && update.role !== "admin")) {
      const target = await User.findOne({ _id: req.params.id, role: "admin" }).select("_id");
      if (target) {
        const others = await User.countDocuments({ role: "admin", isBlocked: { $ne: true }, _id: { $ne: target._id } });
        if (others === 0) return res.status(400).json({ message: "Phải còn ít nhất một admin hoạt động" });
      }
    }
    if (update.isBlocked !== undefined || update.role) update.$inc = { tokenVersion: 1 };

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: STAFF_ROLES } },
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
    const admin = await User.findOne({ _id: req.params.id, role: { $in: STAFF_ROLES } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const tempPassword = `${crypto.randomBytes(6).toString("base64url")}9a`;
    const hashed = await bcrypt.hash(tempPassword, 10);
    await User.findByIdAndUpdate(admin._id, { password: hashed, $inc: { tokenVersion: 1 } });
    return res.json({ message: `Reset thành công. Mật khẩu tạm (chỉ hiển thị một lần): ${tempPassword}` });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

