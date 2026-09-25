import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Thư mục lưu file upload — phải trùng với `express.static` trong server.js */
export const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype] || "";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Only jpeg/png/webp allowed"), ok);
};

/** Kiểm tra magic bytes thật của file (không tin Content-Type do client gửi) */
export function verifyImageMagic(req, res, next) {
  if (!req.file) return next();
  try {
    const fd = fs.openSync(req.file.path, "r");
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
    const ok =
      (req.file.mimetype === "image/jpeg" && isJpg) ||
      (req.file.mimetype === "image/png" && isPng) ||
      (req.file.mimetype === "image/webp" && isWebp);
    if (!ok) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "File không phải ảnh hợp lệ" });
    }
  } catch {
    return res.status(400).json({ message: "Không đọc được file tải lên" });
  }
  next();
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

