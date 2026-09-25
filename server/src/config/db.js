import mongoose from "mongoose";
import dns from "dns";

// Chỉ khi mạng nội bộ chặn SRV lookup (mongodb+srv): đặt DNS_SERVERS=1.1.1.1,1.0.0.1
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/model_shop";
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};
