import express from "express";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { auth, isAdmin, isStaff } from "../middlewares/auth.js";
import { escapeRegex, parsePaging, validateObjectId } from "../utils/validate.js";

const AVAILABILITY = ["in_stock", "pre_order", "limited", "sold_out"];

/** Chỉ cho phép các field admin được sửa (chặn mass-assignment reviews/rating…) */
function pickProductInput(body = {}, { partial = false } = {}) {
  const out = {};
  const str = (v, max) => String(v).trim().slice(0, max);
  if (body.name !== undefined) out.name = str(body.name, 200);
  if (body.category !== undefined) out.category = str(body.category, 100);
  if (body.brand !== undefined) out.brand = str(body.brand, 100);
  if (body.description !== undefined) out.description = str(body.description, 10000);
  if (body.variantLabel !== undefined) out.variantLabel = str(body.variantLabel, 200);
  if (body.price !== undefined) out.price = Number(body.price);
  if (body.cost !== undefined) out.cost = Number(body.cost);
  if (body.stock !== undefined) out.stock = Math.floor(Number(body.stock));
  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.availability !== undefined) out.availability = body.availability;
  if (body.images !== undefined) {
    out.images = (Array.isArray(body.images) ? body.images : [])
      .filter((u) => typeof u === "string" && (u.startsWith("/uploads/") || /^https:\/\//i.test(u)))
      .slice(0, 20);
  }
  const errs = [];
  if (!partial || out.name !== undefined) if (!out.name) errs.push("Name is required");
  if (!partial || out.category !== undefined) if (!out.category) errs.push("Category is required");
  if (!partial || out.price !== undefined) if (!Number.isFinite(out.price) || out.price < 0) errs.push("Price must be >= 0");
  if (out.stock !== undefined && (!Number.isFinite(out.stock) || out.stock < 0)) errs.push("Stock must be >= 0");
  if (out.cost !== undefined && (!Number.isFinite(out.cost) || out.cost < 0)) errs.push("Cost must be >= 0");
  if (out.availability !== undefined && !AVAILABILITY.includes(out.availability)) errs.push("Invalid availability");
  return { data: out, error: errs[0] || "" };
}

const router = express.Router();
router.param("id", validateObjectId);

// Top sản phẩm mới nhất
router.get("/new", async (req, res) => {
  try {
    const top = Math.max(1, Math.min(24, Number(req.query.top || 8)));
    const products = await Product.find().sort({ createdAt: -1 }).limit(top);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Top sản phẩm bán chạy (đếm từ đơn delivered)
router.get("/hot", async (req, res) => {
  try {
    const top = Math.max(1, Math.min(24, Number(req.query.top || 8)));
    const hot = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", qty: { $sum: "$items.quantity" } } },
      { $sort: { qty: -1 } },
      { $limit: top }
    ]);
    const ids = hot.map((h) => h._id);
    const products = await Product.find({ _id: { $in: ids } });
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);
    return res.json(ordered);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const filter = {};

    if (typeof category === "string" && category) filter.category = category;
    if (typeof search === "string" && search.trim()) {
      filter.name = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: "i" };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (Number.isFinite(Number(minPrice)) && minPrice !== undefined && minPrice !== "") filter.price.$gte = Number(minPrice);
      if (Number.isFinite(Number(maxPrice)) && maxPrice !== undefined && maxPrice !== "") filter.price.$lte = Number(maxPrice);
      if (!Object.keys(filter.price).length) delete filter.price;
    }

    // Mặc định tối đa 200 sản phẩm (trả về mảng); dùng ?page=&limit= để phân trang
    const { limit, skip } = parsePaging(req.query, { defaultLimit: 200, maxLimit: 500 });
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);
    res.set("X-Total-Count", String(total));
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Reviews: list
router.get("/:id/reviews", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("reviews ratingAvg numReviews");
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({
      ratingAvg: product.ratingAvg || 0,
      numReviews: product.numReviews || 0,
      reviews: product.reviews || []
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Reviews: add/update (only if user bought delivered order contains product)
router.post("/:id/reviews", auth, async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim().slice(0, 2000);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1 đến 5" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const bought = await Order.exists({
      user: req.user._id,
      status: "delivered",
      "items.product": product._id
    });
    if (!bought) {
      return res.status(403).json({ message: "Bạn cần mua và nhận hàng trước khi đánh giá" });
    }

    const idx = (product.reviews || []).findIndex((r) => String(r.user) === String(req.user._id));
    if (idx >= 0) {
      product.reviews[idx].rating = rating;
      product.reviews[idx].comment = comment;
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name || req.user.email || "User",
        rating,
        comment
      });
    }

    product.numReviews = product.reviews.length;
    product.ratingAvg =
      product.numReviews > 0
        ? Math.round((product.reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / product.numReviews) * 10) / 10
        : 0;

    await product.save();
    return res.status(201).json({
      ratingAvg: product.ratingAvg,
      numReviews: product.numReviews,
      reviews: product.reviews
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, isStaff, async (req, res) => {
  try {
    const { data, error } = pickProductInput(req.body);
    if (error) return res.status(400).json({ message: error });
    const product = await Product.create(data);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.put("/:id", auth, isStaff, async (req, res) => {
  try {
    const { data, error } = pickProductInput(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: data }, {
      new: true,
      runValidators: true
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.delete("/:id", auth, isStaff, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
