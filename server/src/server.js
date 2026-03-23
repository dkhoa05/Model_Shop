import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
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

dotenv.config();

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
  });
};

start();
