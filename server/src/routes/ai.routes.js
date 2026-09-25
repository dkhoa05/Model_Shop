import express from "express";
import { Product } from "../models/Product.js";

const router = express.Router();

function buildRuleAnswer(question, products) {
  const normalized = String(question || "").toLowerCase();
  if (!normalized.trim()) return "Bạn hãy nhập câu hỏi cụ thể về sản phẩm, grade hoặc ngân sách.";
  if (normalized.includes("mới chơi") || normalized.includes("nguoi moi")) {
    const beginner = products.filter((p) => (p.category || "").toLowerCase().includes("hg")).slice(0, 3);
    if (beginner.length) {
      return `Gợi ý cho người mới: ${beginner.map((p) => p.name).join(", ")}. Bạn nên bắt đầu từ HG trước rồi lên MG/RG.`;
    }
    return "Bạn nên bắt đầu từ dòng HG vì dễ build, ít rủi ro và chi phí hợp lý.";
  }
  if (normalized.includes("pre-order") || normalized.includes("preorder")) {
    const pre = products.filter((p) => p.availability === "pre_order").slice(0, 4);
    if (!pre.length) return "Hiện chưa có mẫu pre-order nổi bật, bạn có thể theo dõi mục Pre-order để cập nhật đợt mở bán mới.";
    return `Các mẫu pre-order đang có: ${pre.map((p) => p.name).join(", ")}.`;
  }
  if (normalized.includes("dưới") || normalized.includes("duoi") || normalized.includes("ngân sách") || normalized.includes("budget")) {
    const under2m = products.filter((p) => Number(p.price || 0) <= 2000000).slice(0, 4);
    if (under2m.length) {
      return `Trong tầm dưới 2 triệu: ${under2m.map((p) => `${p.name} (${Number(p.price).toLocaleString("vi-VN")}₫)`).join(", ")}.`;
    }
  }
  if (normalized.includes("bảo quản") || normalized.includes("bao quan") || normalized.includes("figure")) {
    return "Để bảo quản figure: tránh nắng trực tiếp, để trong tủ kính thoáng, lau bụi bằng cọ mềm định kỳ và kiểm soát độ ẩm.";
  }
  return "Mình có thể tư vấn theo ngân sách, grade (HG/RG/MG/PG), dòng anime bạn thích, hoặc mục tiêu build/trưng bày.";
}

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body || {};
    const products = await Product.find().select("name category price availability").lean();
    const answer = buildRuleAnswer(question, products);
    return res.json({ answer });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
