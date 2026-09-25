import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Tạo tài khoản admin đầu tiên (KHÔNG ghi đè tài khoản đã có).
 * Cấu hình: ADMIN_EMAIL, ADMIN_USERNAME (mặc định "admin"), ADMIN_PASSWORD
 * (nếu bỏ trống sẽ sinh mật khẩu ngẫu nhiên và in ra một lần).
 */
const run = async () => {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!email) {
    console.error("Thiếu ADMIN_EMAIL trong server/.env");
    process.exit(1);
  }
  const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase().trim();
  await connectDB();

  const existing = await User.findOne({ $or: [{ email }, { username }] }).select("email username role");
  if (existing) {
    console.log(`Đã tồn tại tài khoản (${existing.username} / ${existing.email}, role=${existing.role}). Không thay đổi.`);
    process.exit(0);
  }

  const generated = !process.env.ADMIN_PASSWORD;
  const plain = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
  if (plain.length < 8) {
    console.error("ADMIN_PASSWORD phải có ít nhất 8 ký tự");
    process.exit(1);
  }
  await User.create({
    name: "Admin",
    username,
    email,
    password: await bcrypt.hash(plain, 10),
    role: "admin"
  });
  console.log(`Đã tạo admin: ${username} / ${email}`);
  if (generated) console.log(`Mật khẩu tạm (chỉ hiển thị một lần, hãy đổi ngay): ${plain}`);
  process.exit(0);
};

run().catch((error) => {
  console.error("ensure-admin failed:", error);
  process.exit(1);
});
