import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, trim: true, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    description: { type: String, trim: true },
    /** Phiên bản / quy cách (vd: scale 1/7, bản Exclusive, blind box series) */
    variantLabel: { type: String, trim: true, default: "" },
    /**
     * Tình trạng: còn hàng, đặt trước, giới hạn, hết hàng
     * (blind box / figure limited thường gắn nhãn limited hoặc pre-order)
     */
    availability: {
      type: String,
      enum: ["in_stock", "pre_order", "limited", "sold_out"],
      default: "in_stock"
    },
    images: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    reviews: { type: [reviewSchema], default: [] },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
