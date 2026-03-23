import express from "express";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

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

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
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
    const comment = String(req.body?.comment || "").trim();
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

router.post("/", auth, isAdmin, async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!category || typeof category !== "string") {
      return res.status(400).json({ message: "Category is required" });
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Price must be >= 0" });
    }
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.put("/:id", auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
