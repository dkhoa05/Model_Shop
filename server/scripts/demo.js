/**
 * Chạy thử nhanh KHÔNG cần cài MongoDB/Atlas: khởi tạo Mongo trong bộ nhớ (replica set), nạp dữ liệu mẫu, chạy API.
 * Dữ liệu mất khi tắt. Dùng:  npm run demo --workspace server   (cần mongodb-memory-server, có trong devDependencies)
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.JWT_SECRET = process.env.JWT_SECRET || "demo_secret_demo_secret_demo_secret_1234";
process.env.PORT = process.env.PORT || "5000";

console.log("[demo] Đang khởi động MongoDB trong bộ nhớ (lần đầu sẽ tải mongod, hơi lâu)...");
const repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGODB_URI = repl.getUri("model_shop");

const { runSeed } = await import("../src/seed.js");
const mongoose = (await import("mongoose")).default;
await mongoose.connect(process.env.MONGODB_URI);
await runSeed({ exit: false });

// server.js không tự chạy khi NODE_ENV=test; ở đây chạy bình thường
await import("../src/server.js");

const stop = async () => {
  await repl.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
