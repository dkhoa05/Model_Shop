import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { UPLOADS_DIR } from "./config/upload.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";
import adminStatsRoutes from "./routes/admin.stats.routes.js";
import paymentConfigRoutes from "./routes/payment-config.routes.js";
import adminPaymentConfigRoutes from "./routes/admin.payment-config.routes.js";
import adminReportsRoutes from "./routes/admin.reports.routes.js";
import adminExpensesRoutes from "./routes/admin.expenses.routes.js";
import adminCouponsRoutes from "./routes/admin.coupons.routes.js";
import couponRoutes from "./routes/coupon.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Luôn đọc server/.env (không phụ thuộc thư mục gọi lệnh node)
const envPath = path.join(__dirname, "../.env");
const envResult = dotenv.config({ path: envPath });
if (envResult.error && process.env.NODE_ENV !== "test") {
  console.warn("[env] Không đọc được file .env tại:", envPath, envResult.error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / server-to-server / curl
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/", (req, res) => {
  res.json({ message: "Model Shop API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/admin", adminStatsRoutes);
app.use("/api/admin", adminPaymentConfigRoutes);
app.use("/api/admin", adminReportsRoutes);
app.use("/api/admin", adminExpensesRoutes);
app.use("/api/admin", adminCouponsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment-config", paymentConfigRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err?.message?.includes("Only jpeg/png/webp allowed")) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large (max 5MB)" });
  }
  res.status(500).json({ message: "Internal server error" });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    const h = process.env.SMTP_HOST?.trim();
    const u = process.env.SMTP_USER?.trim();
    const p = process.env.SMTP_PASS?.trim();
    if (h && u && p) console.log("[env] SMTP: đã nạp HOST/USER/PASS (gửi mail quên mật khẩu bật).");
    else console.log("[env] SMTP: thiếu biến — quên mật khẩu chỉ hiện link trên dev.");
  });
};

start();
