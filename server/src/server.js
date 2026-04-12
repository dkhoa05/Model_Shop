import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Luôn đọc server/.env
const envPath = path.join(__dirname, "../.env");
const envResult = dotenv.config({ path: envPath });
if (envResult.error && process.env.NODE_ENV !== "test") {
  console.warn("[env] Không đọc được file .env tại:", envPath, envResult.error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Vì giờ frontend + backend cùng 1 domain, CORS không còn quá quan trọng.
// Giữ thoáng để local/dev không bị oẳng.
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(UPLOADS_DIR));

// ===== API routes =====
app.get("/api/health", (req, res) => {
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

// ===== Static frontend paths =====
const publicDir = path.join(__dirname, "../public");
const customerDist = path.join(publicDir, "customer");
const adminDist = path.join(publicDir, "admin");

const customerIndex = path.join(customerDist, "index.html");
const adminIndex = path.join(adminDist, "index.html");

const hasCustomerBuild = fs.existsSync(customerIndex);
const hasAdminBuild = fs.existsSync(adminIndex);

if (hasAdminBuild) {
  app.use("/admin", express.static(adminDist));
}

if (hasCustomerBuild) {
  app.use(express.static(customerDist));
}

// ===== SPA fallback =====
if (hasAdminBuild) {
  app.get("/admin/*splat", (req, res) => {
    res.sendFile(adminIndex);
  });
}

if (hasCustomerBuild) {
  app.get("/*splat", (req, res, next) => {
    // Không nuốt /api
    if (req.path.startsWith("/api")) return next();
    if (req.path.startsWith("/uploads")) return next();
    if (req.path.startsWith("/admin") && hasAdminBuild) return next();
    res.sendFile(customerIndex);
  });
}

// ===== Error handler =====
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
    console.log(`[static] customer build: ${hasCustomerBuild ? "found" : "missing"}`);
    console.log(`[static] admin build: ${hasAdminBuild ? "found" : "missing"}`);

    const h = process.env.SMTP_HOST?.trim();
    const u = process.env.SMTP_USER?.trim();
    const p = process.env.SMTP_PASS?.trim();
    if (h && u && p) {
      console.log("[env] SMTP: đã nạp HOST/USER/PASS.");
    } else {
      console.log("[env] SMTP: thiếu biến.");
    }
  });
};

start();
