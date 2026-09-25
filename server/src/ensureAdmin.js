import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const run = async () => {
  await connectDB();

  const password = await bcrypt.hash("admin", 10);
  const admin = await User.findOneAndUpdate(
    { username: "admin" },
    {
      name: "Admin",
      username: "admin",
      email: "admin@modelshop.com",
      password,
      role: "admin",
      isBlocked: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).select("name username email role");

  console.log("Admin account ready:");
  console.log({
    id: String(admin._id),
    username: admin.username,
    email: admin.email,
    role: admin.role
  });
  console.log("Login with username: admin / password: admin");
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
