import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { allowedOrigins, assertProductionConfig } from "./config/env.js";
import { apiLimiter, aiLimiter, csrfGuard } from "./middlewares/security.js";
import pinoHttp from "pino-http";
import crypto from "crypto";
import mongoose from "mongoose";
import { logger } from "./utils/logger.js";
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
import adminLeadsRoutes from "./routes/admin.leads.routes.js";
import adminSuppliersRoutes from "./routes/admin.suppliers.routes.js";
import adminPurchaseOrdersRoutes from "./routes/admin.purchase-orders.routes.js";
import adminInventoryRoutes from "./routes/admin.inventory.routes.js";
import adminAccountingRoutes from "./routes/admin.accounting.routes.js";
import adminApprovalsRoutes from "./routes/admin.approvals.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Luôn đọc server/.env
const envPath = path.join(__dirname, "../.env");
const envResult = dotenv.config({ path: envPath });
if (envResult.error && process.env.NODE_ENV !== "test") {
  console.warn("[env] Không đọc được file .env tại:", envPath, envResult.error.message);
}

assertProductionConfig();

const app = express();
const PORT = process.env.PORT || 5000;

// Sau reverse proxy (Nginx/Render/…): đặt TRUST_PROXY=1 để rate-limit thấy IP thật
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.disable("x-powered-by");

// Ảnh /uploads được nhúng từ origin khác (Next.js) → cho phép cross-origin resource
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, cb) {
      // Không có Origin (curl, server-to-server, same-origin) → cho qua; có Origin thì phải nằm trong whitelist
      if (!origin || allowedOrigins().includes(origin.replace(/\/$/, ""))) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  })
);

// Log mỗi request kèm request id (client có thể gửi X-Request-Id; luôn trả lại trong header phản hồi)
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = String(req.headers["x-request-id"] || "").slice(0, 64) || crypto.randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    autoLogging: { ignore: (req) => req.url === "/api/health" },
    customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode })
    }
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    index: false,
    dotfiles: "deny",
    setHeaders: (res) => res.setHeader("Content-Disposition", "inline")
  })
);
app.use("/api", apiLimiter, csrfGuard);
app.use("/api/ai", aiLimiter);

// ===== API routes =====
/** Health check cho load balancer / Docker: 503 nếu chưa kết nối được MongoDB */
app.get("/api/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down", uptime: Math.round(process.uptime()) });
});

app.get("/", (req, res) => {
  return res.json({ message: "Model Shop API running", health: "/api/health" });
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
app.use("/api/admin", adminLeadsRoutes);
app.use("/api/admin", adminSuppliersRoutes);
app.use("/api/admin", adminPurchaseOrdersRoutes);
app.use("/api/admin", adminInventoryRoutes);
app.use("/api/admin", adminAccountingRoutes);
app.use("/api/admin", adminApprovalsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment-config", paymentConfigRoutes);
app.use("/api/ai", aiRoutes);

// Frontend chạy tách riêng (Next.js customer, Vite admin) — server chỉ phục vụ API và /uploads.
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

// ===== Error handler =====
app.use((err, req, res, next) => {
  if (err?.message?.includes("Only jpeg/png/webp allowed")) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large (max 5MB)" });
  }
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    return res.status(err.status || 400).json({ message: "Dữ liệu gửi lên không hợp lệ" });
  }
  (req.log || logger).error({ err }, "unhandled error");
  res.status(500).json({ message: "Internal server error", requestId: req.id });
});

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, "server listening");
    const smtpOk = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].every((k) => process.env[k]?.trim());
    logger.info({ smtp: smtpOk ? "configured" : "missing" }, "smtp status");
  });

  // Tắt êm: ngừng nhận kết nối mới, chờ request đang chạy, đóng MongoDB (Docker/K8s gửi SIGTERM khi deploy)
  let closing = false;
  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    logger.info({ signal }, "shutting down");
    const force = setTimeout(() => process.exit(1), 15000);
    force.unref();
    server.close(async () => {
      await mongoose.disconnect().catch(() => undefined);
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandledRejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  process.exit(1);
});

if (process.env.NODE_ENV !== "test") start();

export default app;
