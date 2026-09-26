import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Product } from "./models/Product.js";
import { Order } from "./models/Order.js";
import { PaymentConfig } from "./models/PaymentConfig.js";
import { Expense } from "./models/Expense.js";
import { Coupon } from "./models/Coupon.js";
import { Invoice } from "./models/Invoice.js";
import { JournalEntry } from "./models/JournalEntry.js";
import { syncOrderAccounting } from "./services/accounting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Ảnh mẫu (Unsplash, miễn phí): chỉ dùng ảnh thật sự là mô hình/figure để bản demo trông đúng chủ đề.
 * Gundam dùng ảnh RX-78-2; các danh mục còn lại luân phiên giữa 2 ảnh figure. Thay bằng ảnh thật khi đưa vào sản xuất.
 */
const GUNDAM_IMAGE = "https://images.unsplash.com/photo-1612400200701-847d015ba101?w=800";
const FIGURE_IMAGES = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
  "https://images.unsplash.com/photo-1612400200701-847d015ba101?w=800&crop=entropy&fit=crop"
];
function getImageUrlByCategory(category, name = "") {
  if (/gundam/i.test(category)) return GUNDAM_IMAGE;
  return FIGURE_IMAGES[(name.length + category.length) % FIGURE_IMAGES.length];
}

export const runSeed = async ({ exit = true } = {}) => {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_IN_PRODUCTION !== "yes") {
    console.error("Từ chối chạy seed ở production (seed xóa/ghi đè dữ liệu). Đặt ALLOW_SEED_IN_PRODUCTION=yes nếu thật sự cần.");
    process.exit(1);
  }
  if (mongoose.connection.readyState !== 1) await connectDB();

  const adminEmail = "admin@modelshop.com";
  const adminPassword = process.env.SEED_PASSWORD || "Admin@123"; // chỉ dùng cho dev/local

  const hashed = await bcrypt.hash(adminPassword, 10);
  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    { name: "Admin", username: "admin", email: adminEmail, password: hashed, role: "admin" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const user1 = await User.findOneAndUpdate(
    { email: "user1@modelshop.com" },
    { name: "User One", username: "user1", email: "user1@modelshop.com", password: hashed, role: "user" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const user2 = await User.findOneAndUpdate(
    { email: "user2@modelshop.com" },
    { name: "User Two", username: "user2", email: "user2@modelshop.com", password: hashed, role: "user" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (const [role, email, name] of [
    ["staff", "staff1@modelshop.com", "Nhân viên bán hàng"],
    ["accountant", "accountant1@modelshop.com", "Kế toán"]
  ]) {
    await User.findOneAndUpdate(
      { email },
      { name, username: email.split("@")[0], email, password: hashed, role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await Product.deleteMany({});
  await Invoice.deleteMany({});
  await JournalEntry.deleteMany({});

  const baseProducts = [
    {
      name: "Gundam RX-78-2 HG 1/144",
      price: 350000,
      category: "Gundam",
      brand: "Bandai",
      description: "Mô hình Gundam RX-78-2 tỉ lệ 1/144, phù hợp người mới bắt đầu lắp ráp.",
      stock: 50,
      featured: true,
      variantLabel: "HG 1/144 — bản thường",
      availability: "in_stock"
    },
    {
      name: "Gundam Barbatos Lupus MG 1/100",
      price: 950000,
      category: "Gundam",
      brand: "Bandai",
      description: "Mô hình Barbatos Lupus tỉ lệ 1/100, chi tiết cao, nhiều điểm khớp.",
      stock: 15,
      featured: true,
      variantLabel: "MG 1/100",
      availability: "in_stock"
    },
    {
      name: "Nendoroid Anime Girl 10cm",
      price: 720000,
      category: "Figure",
      brand: "Good Smile Company",
      description: "Figure Nendoroid phong cách chibi, cao khoảng 10cm, nhiều phụ kiện biểu cảm.",
      stock: 25,
      variantLabel: "Nendoroid — chibi 10cm",
      availability: "pre_order"
    },
    {
      name: "Scale Figure 1/7 Hero",
      price: 1850000,
      category: "Figure",
      brand: "Kotobukiya",
      description: "Scale figure nhân vật anh hùng tỉ lệ 1/7, tô màu bóng đẹp, chi tiết sắc nét.",
      stock: 8,
      variantLabel: "Scale 1/7 — Limited",
      availability: "limited"
    },
    { name: "Lego Starship Set 800pcs", price: 1290000, category: "Lego", brand: "Lego", description: "Bộ Lego chủ đề phi thuyền không gian với hơn 800 mảnh ghép, phù hợp trưng bày.", stock: 12 },
    { name: "Dragon Ball Goku Figure 25cm", price: 640000, category: "Figure", brand: "Banpresto", description: "Figure nhân vật Goku cao 25cm, tạo dáng chiến đấu, đế trưng bày chắc chắn.", stock: 30 },
    { name: "One Piece Luffy Figure 22cm", price: 680000, category: "Figure", brand: "Banpresto", description: "Figure Luffy với mũ rơm đặc trưng, chi tiết gương mặt và trang phục đẹp.", stock: 18 },
    { name: "Naruto Uzumaki Figure 20cm", price: 610000, category: "Figure", brand: "Banpresto", description: "Figure Naruto ở trạng thái Sage Mode, hiệu ứng chakra bắt mắt.", stock: 22 },
    { name: "Gundam Exia RG 1/144", price: 820000, category: "Gundam", brand: "Bandai", description: "Mô hình Gundam Exia dòng Real Grade tỉ lệ 1/144, inner frame chi tiết.", stock: 20 },
    { name: "Lego Mech Robot 500pcs", price: 890000, category: "Lego", brand: "Lego", description: "Bộ Lego lắp ráp robot khổng lồ, có thể tạo nhiều tư thế khác nhau.", stock: 16 },
    { name: "Diorama Forest Base 1/12", price: 540000, category: "Diorama", brand: "Custom", description: "Đế diorama rừng cây 1/12, dùng trưng bày figure hoặc Gundam.", stock: 10 }
  ].map((p) => ({
    ...p,
    images: [getImageUrlByCategory(p.category, p.name)],
    variantLabel: p.variantLabel || "",
    availability: p.availability || "in_stock",
    cost: p.cost ?? Math.round((p.price || 0) * 0.6)
  }));

  const extraProducts = [
    {
      name: "Gundam Unicorn PG 1/60",
      price: 4500000,
      category: "Gundam",
      brand: "Bandai",
      description: "Perfect Grade Unicorn, tỉ lệ 1/60, chi tiết cực cao.",
      stock: 5,
      featured: true,
      variantLabel: "PG 1/60 — LED",
      availability: "limited"
    },
    { name: "Gundam Wing Zero HG 1/144", price: 380000, category: "Gundam", brand: "Bandai", description: "Mô hình Gundam Wing Zero Classic, dễ lắp.", stock: 40 },
    { name: "Nendoroid Pikachu 10cm", price: 650000, category: "Figure", brand: "Good Smile", description: "Nendoroid Pikachu đáng yêu, nhiều khuôn mặt.", stock: 35 },
    { name: "Figure Attack on Titan Eren 1/8", price: 2100000, category: "Anime", brand: "Kotobukiya", description: "Scale figure Eren Yeager tỉ lệ 1/8, chi tiết trang phục.", stock: 6 },
    { name: "Figure Demon Slayer Tanjiro 20cm", price: 750000, category: "Anime", brand: "Banpresto", description: "Figure Tanjiro Kamado với kiếm, đế trưng bày.", stock: 20 },
    { name: "Lego Harry Potter Hogwarts 600pcs", price: 1100000, category: "Lego", brand: "Lego", description: "Bộ Lego lâu đài Hogwarts thu nhỏ.", stock: 14 },
    { name: "Lego City Cảnh sát 300pcs", price: 450000, category: "Lego", brand: "Lego", description: "Bộ Lego City đồ chơi cảnh sát cho trẻ.", stock: 25 },
    { name: "Diorama City Street 1/12", price: 620000, category: "Diorama", brand: "Custom", description: "Đế diorama phố thành thị 1/12, có đèn.", stock: 8 },
    { name: "Figure Spy x Family Anya 15cm", price: 580000, category: "Anime", brand: "Banpresto", description: "Figure Anya Forger với biểu cảm đáng yêu.", stock: 28 },
    { name: "Mô hình Pokemon Charizard 25cm", price: 890000, category: "Game", brand: "Bandai", description: "Mô hình Charizard cao cấp, sơn bóng.", stock: 12 },
    { name: "Figure Final Fantasy Cloud 1/6", price: 3200000, category: "Game", brand: "Square Enix", description: "Scale figure Cloud Strife tỉ lệ 1/6, kèm kiếm Buster.", stock: 4 },
    { name: "Nendoroid Kirby 8cm", price: 520000, category: "Game", brand: "Good Smile", description: "Nendoroid Kirby nhiều phụ kiện biểu cảm.", stock: 30 },
    { name: "Figure Jujutsu Kaisen Gojo 22cm", price: 820000, category: "Anime", brand: "Banpresto", description: "Figure Satoru Gojo tạo dáng đặc trưng.", stock: 15 },
    { name: "Mô hình Transformers Optimus 30cm", price: 1500000, category: "Collectible", brand: "Hasbro", description: "Mô hình Optimus Prime có thể biến hình.", stock: 10 },
    { name: "Figure Marvel Iron Man Mark 50 1/10", price: 1850000, category: "Collectible", brand: "Hot Toys", description: "Figure Iron Man tỉ lệ 1/10, chi tiết nano suit.", stock: 7 },
    { name: "Tủ kính trưng bày 3 tầng", price: 380000, category: "Phụ kiện", brand: "Custom", description: "Tủ kính trưng bày mô hình 3 tầng, có đèn LED.", stock: 20 },
    { name: "Đế trưng bày xoay 360 độ", price: 120000, category: "Phụ kiện", brand: "Custom", description: "Đế xoay dùng pin, phù hợp figure 15-25cm.", stock: 50 },
    { name: "Bộ sơn + cọ vẽ model", price: 280000, category: "Phụ kiện", brand: "Tamiya", description: "Bộ sơn cơ bản và cọ vẽ cho mô hình Gundam.", stock: 35 },
    { name: "Figure Bleach Ichigo 20cm", price: 690000, category: "Manga", brand: "Banpresto", description: "Figure Ichigo Kurosaki với Zanpakuto.", stock: 18 },
    { name: "Figure One Piece Zoro 25cm", price: 780000, category: "Manga", brand: "Banpresto", description: "Figure Roronoa Zoro với 3 kiếm.", stock: 14 },
    { name: "Gundam Nu Ver.Ka MG 1/100", price: 1200000, category: "Gundam", brand: "Bandai", description: "Master Grade Nu Gundam Ver.Ka, decal nhiều.", stock: 9 },
    { name: "Nendoroid Hatsune Miku 10cm", price: 720000, category: "Anime", brand: "Good Smile", description: "Nendoroid Miku với micro và phụ kiện.", stock: 22 },
    { name: "Lego Ninjago Dragon 400pcs", price: 680000, category: "Lego", brand: "Lego", description: "Bộ Lego Ninjago rồng và đền.", stock: 18 },
    { name: "Figure My Hero Academia Deku 18cm", price: 610000, category: "Anime", brand: "Banpresto", description: "Figure Izuku Midoriya tạo dáng chiến đấu.", stock: 24 },
    { name: "Diorama Battlefield 1/144", price: 450000, category: "Diorama", brand: "Custom", description: "Đế diorama chiến trường cho Gundam 1/144.", stock: 15 },
    { name: "Figure Sword Art Online Kirito 1/7", price: 2200000, category: "Anime", brand: "Kotobukiya", description: "Scale figure Kirito tỉ lệ 1/7 với Elucidator.", stock: 5 },
    { name: "Mô hình Gundam Sazabi RG 1/144", price: 980000, category: "Gundam", brand: "Bandai", description: "Real Grade Sazabi, chi tiết inner frame.", stock: 11 },
    { name: "Bộ dụng cụ lắp ráp model", price: 195000, category: "Phụ kiện", brand: "Tamiya", description: "Kềm cắt, giấy nhám, dao lắp mô hình.", stock: 40 }
    ,
    // 1–10: Anime Figure
    {
      name: "Figure Bleach Ichigo 20cm (Anime Figure)",
      price: 690000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Ichigo Kurosaki (20cm). Prompt ảnh: anime figure Ichigo Kurosaki holding zanpakuto, dynamic pose, studio lighting, red background, high detail, 20cm scale",
      stock: 18
    },
    {
      name: "Figure Naruto Sage Mode 22cm",
      price: 750000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Naruto Sage Mode (22cm). Prompt ảnh: Naruto sage mode figure, orange outfit, glowing eyes, action pose, anime collectible, high detail",
      stock: 20
    },
    {
      name: "Figure Luffy Gear 5 25cm",
      price: 890000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Luffy Gear 5 (25cm). Prompt ảnh: Luffy gear 5 white hair smiling, cartoonish power aura, anime figure, high detail, dramatic lighting",
      stock: 16
    },
    {
      name: "Figure Gojo Satoru 21cm",
      price: 820000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Gojo Satoru (21cm). Prompt ảnh: Gojo Satoru blindfold, purple energy aura, Jujutsu Kaisen figure, stylish pose",
      stock: 15
    },
    {
      name: "Figure Levi Ackerman 18cm",
      price: 680000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Levi Ackerman (18cm). Prompt ảnh: Levi Ackerman attack pose with blades, cloak flowing, anime figure realistic detail",
      stock: 22
    },
    {
      name: "Figure Tanjiro Kamado 20cm (Water Breathing)",
      price: 700000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Tanjiro Kamado (20cm). Prompt ảnh: Tanjiro water breathing slash, blue water effects, anime figure dynamic pose",
      stock: 24
    },
    {
      name: "Figure Nezuko 18cm",
      price: 650000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Nezuko (18cm). Prompt ảnh: Nezuko bamboo mouth, pink kimono, cute anime figure, soft lighting",
      stock: 26
    },
    {
      name: "Figure Eren Titan Form 25cm",
      price: 950000,
      category: "Anime Figure",
      brand: "Kotobukiya",
      description:
        "Figure Attack Titan (25cm). Prompt ảnh: Attack Titan roaring pose, muscular detail, anime statue, cinematic lighting",
      stock: 10
    },
    {
      name: "Figure Itachi Uchiha 20cm",
      price: 780000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Itachi Uchiha (20cm). Prompt ảnh: Itachi sharingan, crow illusion effect, dark anime aesthetic",
      stock: 18
    },
    {
      name: "Figure Mikasa Ackerman 19cm",
      price: 720000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Mikasa Ackerman (19cm). Prompt ảnh: Mikasa with scarf, dual blades, action pose, anime figure high detail",
      stock: 20
    },

    // 11–20: Gundam
    {
      name: "Gundam RX-78-2 MG 1/100",
      price: 950000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit MG 1/100. Prompt ảnh: RX-78-2 Gundam standing pose, white blue red armor, clean background, high detail model kit",
      stock: 12
    },
    {
      name: "Gundam Barbatos HG 1/144",
      price: 420000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit HG 1/144. Prompt ảnh: Gundam Barbatos aggressive stance, battle damage, realistic lighting",
      stock: 35
    },
    {
      name: "Gundam Exia MG 1/100",
      price: 980000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit MG 1/100. Prompt ảnh: Gundam Exia green GN particles, futuristic design, sharp detail",
      stock: 10
    },
    {
      name: "Gundam Unicorn RG 1/144",
      price: 600000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit RG 1/144. Prompt ảnh: Unicorn Gundam transformation mode, glowing red psycho frame",
      stock: 22
    },
    {
      name: "Gundam Strike Freedom MGEX",
      price: 1800000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit MGEX. Prompt ảnh: Strike Freedom wings spread, gold frame, dramatic lighting",
      stock: 6,
      featured: true
    },
    {
      name: "Gundam Wing Zero EW",
      price: 1100000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit phiên bản Endless Waltz. Prompt ảnh: Wing Zero angel wings, flying pose, cinematic lighting",
      stock: 9
    },
    {
      name: "Gundam Zaku II HG",
      price: 350000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit HG. Prompt ảnh: Zaku II mono-eye, military style robot, battle stance",
      stock: 40
    },
    {
      name: "Gundam Nu Gundam RG",
      price: 700000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit RG. Prompt ảnh: Nu Gundam with fin funnels, space background",
      stock: 14
    },
    {
      name: "Gundam Sazabi MG",
      price: 1300000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit MG. Prompt ảnh: Sazabi red armor bulky mech, powerful pose",
      stock: 8
    },
    {
      name: "Gundam Aerial HG",
      price: 480000,
      category: "Gundam",
      brand: "Bandai",
      description:
        "Model kit HG. Prompt ảnh: Gundam Aerial blue energy effects, modern design",
      stock: 28
    },

    // 21–30: Khác (Game / Marvel / Cute Figure)
    {
      name: "Figure Spider-Man 20cm",
      price: 750000,
      category: "Marvel",
      brand: "Hot Toys",
      description:
        "Figure Spider-Man (20cm). Prompt ảnh: Spider-Man crouching pose, web shooting, realistic suit texture",
      stock: 12
    },
    {
      name: "Figure Iron Man Mark 85",
      price: 1200000,
      category: "Marvel",
      brand: "Hot Toys",
      description:
        "Figure Iron Man Mark 85. Prompt ảnh: Iron Man glowing arc reactor, battle stance, cinematic lighting",
      stock: 9
    },
    {
      name: "Figure Batman Dark Knight",
      price: 900000,
      category: "DC",
      brand: "DC Collectibles",
      description:
        "Figure Batman Dark Knight. Prompt ảnh: Batman dark suit, cape flowing, moody lighting",
      stock: 10
    },
    {
      name: "Figure Joker 20cm",
      price: 880000,
      category: "DC",
      brand: "DC Collectibles",
      description:
        "Figure Joker (20cm). Prompt ảnh: Joker smiling chaotic pose, purple suit, cinematic lighting",
      stock: 8
    },
    {
      name: "Figure Pikachu 15cm",
      price: 350000,
      category: "Pokemon",
      brand: "Bandai",
      description:
        "Figure Pikachu (15cm). Prompt ảnh: Pikachu cute pose, bright yellow, soft lighting",
      stock: 30
    },
    {
      name: "Figure Charizard 22cm",
      price: 800000,
      category: "Pokemon",
      brand: "Bandai",
      description:
        "Figure Charizard (22cm). Prompt ảnh: Charizard fire breath, wings spread, dynamic pose",
      stock: 14
    },
    {
      name: "Figure Genshin Impact Raiden Shogun",
      price: 950000,
      category: "Game Figure",
      brand: "miHoYo",
      description:
        "Figure Raiden Shogun. Prompt ảnh: Raiden Shogun purple lightning, elegant pose, anime style",
      stock: 10
    },
    {
      name: "Figure Hatsune Miku 20cm",
      price: 720000,
      category: "Vocaloid",
      brand: "Good Smile",
      description:
        "Figure Hatsune Miku (20cm). Prompt ảnh: Hatsune Miku singing pose, teal twin tails, stage lighting",
      stock: 18
    },
    {
      name: "Figure Among Us Mini Set",
      price: 250000,
      category: "Cute Figure",
      brand: "Among Us",
      description:
        "Set figure mini Among Us. Prompt ảnh: Among Us characters colorful, toy style, simple background",
      stock: 45
    },
    {
      name: "Figure One Piece Zoro 22cm (Anime Figure)",
      price: 850000,
      category: "Anime Figure",
      brand: "Banpresto",
      description:
        "Figure Zoro (22cm). Prompt ảnh: Zoro three swords style, green aura, action pose",
      stock: 16
    }
  ].map((p) => ({
    ...p,
    images: [getImageUrlByCategory(p.category, p.name)],
    variantLabel: p.variantLabel || "",
    availability: p.availability || "in_stock"
  }));

  let allProducts = await Product.insertMany([...baseProducts, ...extraProducts]);
  // Giá vốn mẫu = 60% giá bán (để báo cáo lợi nhuận có số liệu)
  await Product.updateMany({ cost: 0 }, [{ $set: { cost: { $round: [{ $multiply: ["$price", 0.6] }, 0] } } }]);
  allProducts = await Product.find();

  await Order.deleteMany({});
  await Expense.deleteMany({});

  const pick = (name) => allProducts.find((p) => p.name.startsWith(name));

  const sampleOrders = [
    {
      user: user1._id,
      items: [
        { product: pick("Gundam RX-78-2")?._id, quantity: 1 },
        { product: pick("Nendoroid Anime Girl")?._id, quantity: 2 }
      ],
      address: "123 Đường A, Quận 1, TP.HCM",
      phone: "0900000001",
      status: "delivered",
      paymentMethod: "bank_transfer",
      paymentStatus: "paid",
      paymentProofUrl: "/uploads/demo-proof-1.png",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19)
    },
    {
      user: user2._id,
      items: [
        { product: pick("One Piece Luffy")?._id, quantity: 1 },
        { product: pick("Lego Starship Set")?._id, quantity: 1 }
      ],
      address: "456 Đường B, Quận 3, TP.HCM",
      phone: "0900000002",
      status: "processing",
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
    },
    {
      user: user1._id,
      items: [
        { product: pick("Naruto Uzumaki")?._id, quantity: 1 },
        { product: pick("Diorama Forest Base")?._id, quantity: 1 }
      ],
      address: "789 Đường C, Quận 5, TP.HCM",
      phone: "0900000003",
      status: "pending",
      paymentMethod: "momo",
      paymentStatus: "unpaid",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      user: user2._id,
      items: [
        { product: pick("Gundam Exia")?._id, quantity: 2 }
      ],
      address: "12 Đường D, Quận 7, TP.HCM",
      phone: "0900000004",
      status: "delivered",
      paymentMethod: "zalopay",
      paymentStatus: "paid",
      paymentProofUrl: "/uploads/demo-proof-2.png",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11)
    }
  ];

  for (const o of sampleOrders) {
    const validItems = o.items.filter((i) => i.product);
    if (!validItems.length) continue;
    let total = 0;
    const itemsWithPrice = validItems.map((i) => {
      const prod = allProducts.find((p) => String(p._id) === String(i.product));
      total += prod.price * i.quantity;
      return { product: prod._id, quantity: i.quantity, price: prod.price };
    });
    await Order.create({
      user: o.user,
      recipientName: String(o.user) === String(user1._id) ? "User One" : "User Two",
      items: itemsWithPrice,
      address: o.address,
      phone: o.phone,
      subtotal: total,
      shippingFee: 0,
      discountAmount: 0,
      couponCode: "",
      deliveryType: "delivery",
      totalPrice: total,
      // demo variety for admin statistics
      paymentMethod: o.paymentMethod || "cod",
      paymentStatus: o.paymentStatus || "unpaid",
      paidAt: o.paymentStatus === "paid" ? (o.paidAt || new Date()) : null,
      paymentProofUrl: o.paymentProofUrl || "",
      paymentProofSubmittedAt: o.paymentProofUrl ? (o.paymentProofSubmittedAt || new Date()) : null,
      status: o.status || "pending",
      createdAt: o.createdAt || new Date()
    });
  }

  // Seed some expenses so Profit charts are not empty
  const now = new Date();
  const makeDate = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };
  await Expense.insertMany([
    { title: "Nhập hàng lô Gundam", amount: 5500000, category: "Nhập hàng", expenseDate: makeDate(25), note: "MG/HG" },
    { title: "Nhập hàng figure anime", amount: 3200000, category: "Nhập hàng", expenseDate: makeDate(18), note: "Banpresto" },
    { title: "Marketing Facebook", amount: 800000, category: "Marketing", expenseDate: makeDate(14), note: "Quảng cáo tuần" },
    { title: "Vận hành (điện/nước)", amount: 450000, category: "Vận hành", expenseDate: makeDate(10) },
    { title: "Đóng gói & vận chuyển", amount: 350000, category: "Vận hành", expenseDate: makeDate(6) },
    { title: "Nhập hàng bổ sung", amount: 2100000, category: "Nhập hàng", expenseDate: makeDate(3) }
  ]);

  // Thông tin nhận tiền DEMO để thử luồng chuyển khoản/ví; hãy thay bằng thông tin thật trong Admin → Payment Config
  await PaymentConfig.findOneAndUpdate(
    {},
    { $set: { bankName: "Vietcombank (demo)", bankAccount: "0123456789", accountHolder: "MODEL SHOP DEMO", momoPhone: "0900000000" } },
    { upsert: true, new: true }
  );

  await Coupon.findOneAndUpdate(
    { code: "WELCOME10" },
    {
      $set: {
        type: "percent",
        value: 10,
        maxDiscountAmount: 100000,
        minOrderSubtotal: 0,
        active: true,
        description: "Giảm 10% tối đa 100.000 ₫"
      },
      $setOnInsert: { code: "WELCOME10", usedCount: 0 }
    },
    { upsert: true }
  );
  await Coupon.findOneAndUpdate(
    { code: "MODEL50K" },
    {
      $set: {
        type: "fixed",
        value: 50000,
        maxDiscountAmount: null,
        minOrderSubtotal: 0,
        active: true,
        description: "Giảm 50.000 ₫"
      },
      $setOnInsert: { code: "MODEL50K", usedCount: 0 }
    },
    { upsert: true }
  );

  // Ghi sổ kế toán cho các đơn mẫu đã giao (doanh thu, giá vốn, thu tiền) và chi phí mẫu
  const delivered = await Order.find({ status: "delivered" }).select("_id");
  for (const o of delivered) await syncOrderAccounting(o._id, admin._id);
  const { syncExpenseJournal } = await import("./services/accounting.js");
  for (const e of await Expense.find()) await syncExpenseJournal(e, admin._id);

  console.log("Seed done.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Staff: staff1@modelshop.com, Accountant: accountant1@modelshop.com, Customers: user1@modelshop.com, user2@modelshop.com — mật khẩu như Admin");
  if (exit) process.exit(0);
};

// Chạy trực tiếp: node src/seed.js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSeed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

