export type ProductStatus = "in-stock" | "out-of-stock" | "pre-order" | "limited";
export type BadgeType = "new" | "hot" | "sale" | "pre-order" | "limited";

export interface ProductSpecs {
  brand: string;
  series: string;
  grade: string;
  scale: string;
  material: string;
  releaseDate: string;
  height: string;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  grade?: string;
  scale?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  status: ProductStatus;
  badge?: {
    text: string;
    type: BadgeType;
  };
  releaseDate?: string;
  description: string;
  specs: ProductSpecs;
  features: string[];
}

export const products: Product[] = [
  {
    id: "p-001",
    name: "Bandai PG Unleashed RX-78-2 Gundam 1/60",
    slug: "pg-unleashed-rx-78-2-gundam",
    brand: "Bandai Spirits",
    category: "Gundam PG",
    grade: "PG",
    scale: "1/60",
    price: 6850000,
    originalPrice: 7500000,
    images: [
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=85&w=1200",
      "https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&q=85&w=1200",
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 5,
    reviewCount: 48,
    stock: 5,
    status: "limited",
    badge: { text: "Limited", type: "limited" },
    releaseDate: "12/2020",
    description:
      "Perfect Grade Unleashed RX-78-2 là biểu tượng cao cấp của Bandai, nổi bật với khung xương nhiều lớp, cơ chế mở giáp tinh xảo và bộ chi tiết cơ khí sắc nét cho người chơi Gunpla lâu năm.",
    specs: {
      brand: "Bandai Spirits",
      series: "Mobile Suit Gundam",
      grade: "PG Unleashed",
      scale: "1/60",
      material: "PS, ABS, PP, PVC",
      releaseDate: "12/2020",
      height: "30 cm",
      status: "Còn hàng số lượng giới hạn"
    },
    features: [
      "Khung xương multi-layer truss system cao cấp.",
      "Hơn 90 điểm khớp hỗ trợ tạo dáng trưng bày.",
      "Chi tiết giáp mở và decal sắc nét chuẩn sưu tầm.",
      "Phù hợp làm centerpiece cho tủ trưng bày Gunpla."
    ]
  },
  {
    id: "p-002",
    name: "Bandai RG MSN-04 Sazabi 1/144",
    slug: "rg-msn-04-sazabi",
    brand: "Bandai Spirits",
    category: "Gundam RG",
    grade: "RG",
    scale: "1/144",
    price: 1150000,
    originalPrice: 1350000,
    images: [
      "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?auto=format&fit=crop&q=85&w=1200",
      "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.8,
    reviewCount: 120,
    stock: 25,
    status: "in-stock",
    badge: { text: "Hot", type: "hot" },
    releaseDate: "08/2018",
    description:
      "RG Sazabi tái hiện mobile suit huyền thoại của Char Aznable với tỉ lệ 1/144 nhưng độ chi tiết dày, nhiều panel line và hệ vũ khí Funnels đầy đủ.",
    specs: {
      brand: "Bandai Spirits",
      series: "Char's Counterattack",
      grade: "RG",
      scale: "1/144",
      material: "PS, ABS",
      releaseDate: "08/2018",
      height: "14.5 cm",
      status: "Còn hàng"
    },
    features: [
      "Form dáng lớn, đầm và rất nổi bật trong dòng RG.",
      "Kèm Beam Shot Rifle, Shield, Beam Saber và Funnels.",
      "Cơ chế mở giáp chân, vai, backpack linh hoạt.",
      "Lựa chọn đáng tiền cho cả người mới lẫn builder lâu năm."
    ]
  },
  {
    id: "p-003",
    name: "Bandai MG Gundam Barbatos 1/100",
    slug: "mg-gundam-barbatos",
    brand: "Bandai Spirits",
    category: "Gundam MG",
    grade: "MG",
    scale: "1/100",
    price: 1180000,
    originalPrice: 1280000,
    images: [
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=85&w=1200",
      "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.9,
    reviewCount: 95,
    stock: 14,
    status: "in-stock",
    badge: { text: "New", type: "new" },
    releaseDate: "12/2019",
    description:
      "MG Barbatos sở hữu khung Gundam Frame sắc nét, các piston cơ khí chuyển động theo khớp và bộ vũ khí đặc trưng từ Iron-Blooded Orphans.",
    specs: {
      brand: "Bandai Spirits",
      series: "Iron-Blooded Orphans",
      grade: "MG",
      scale: "1/100",
      material: "PS, ABS, PVC",
      releaseDate: "12/2019",
      height: "18.5 cm",
      status: "Còn hàng"
    },
    features: [
      "Khung xương Gundam Frame có độ hoàn thiện cao.",
      "Piston thủy lực mô phỏng chuyển động thực.",
      "Kèm mace, katana và smoothbore gun.",
      "Dễ pose, hợp cả chụp ảnh sản phẩm lẫn trưng bày."
    ]
  },
  {
    id: "p-004",
    name: "Bandai HG Gundam Calibarn 1/144",
    slug: "hg-gundam-calibarn",
    brand: "Bandai Spirits",
    category: "Gundam HG",
    grade: "HG",
    scale: "1/144",
    price: 520000,
    originalPrice: 600000,
    images: [
      "https://images.unsplash.com/photo-1608889825271-9696283ab804?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.7,
    reviewCount: 64,
    stock: 35,
    status: "in-stock",
    badge: { text: "Sale", type: "sale" },
    releaseDate: "07/2023",
    description:
      "HG Gundam Calibarn từ The Witch from Mercury có tông trắng hiện đại, rifle dạng broom độc đáo và các chi tiết trong suốt tạo hiệu ứng cầu vồng bắt mắt.",
    specs: {
      brand: "Bandai Spirits",
      series: "The Witch from Mercury",
      grade: "HG",
      scale: "1/144",
      material: "PS, PE",
      releaseDate: "07/2023",
      height: "13 cm",
      status: "Còn hàng"
    },
    features: [
      "Build nhanh, ít stress cho người mới chơi.",
      "Màu sắc đẹp ngay cả khi chưa sơn.",
      "Broom Rifle tạo dáng hành động rất tốt.",
      "Giá dễ tiếp cận cho bộ sưu tập Witch from Mercury."
    ]
  },
  {
    id: "p-005",
    name: "Megahouse P.O.P One Piece Roronoa Zoro WA-MAXIMUM",
    slug: "pop-one-piece-roronoa-zoro-wa-maximum",
    brand: "Megahouse",
    category: "Figure Anime",
    price: 5900000,
    originalPrice: 6500000,
    images: [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=85&w=1200",
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 5,
    reviewCount: 22,
    stock: 2,
    status: "limited",
    badge: { text: "Limited", type: "limited" },
    releaseDate: "09/2022",
    description:
      "P.O.P WA-MAXIMUM Roronoa Zoro có sculpt cơ bắp, hiệu ứng kiếm và thần thái Wano mạnh mẽ, dành cho collector muốn một figure trung tâm thật nổi bật.",
    specs: {
      brand: "Megahouse",
      series: "One Piece",
      grade: "P.O.P MAXIMUM",
      scale: "Non-scale",
      material: "PVC, ABS",
      releaseDate: "09/2022",
      height: "21 cm",
      status: "Còn hàng cực hiếm"
    },
    features: [
      "Sculpt chi tiết cơ bắp và chuyển động áo.",
      "Hiệu ứng kiếm bằng nhựa trong cao cấp.",
      "Box trưng bày đẹp, hợp sưu tầm lâu dài.",
      "Số lượng shop nhập rất ít."
    ]
  },
  {
    id: "p-006",
    name: "Kotobukiya ARTFX J Gojo Satoru Jujutsu Kaisen",
    slug: "artfx-j-gojo-satoru-jujutsu-kaisen",
    brand: "Kotobukiya",
    category: "Figure Anime",
    price: 3200000,
    images: [
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.9,
    reviewCount: 35,
    stock: 8,
    status: "in-stock",
    badge: { text: "Hot", type: "hot" },
    releaseDate: "12/2021",
    description:
      "Figure Gojo Satoru ARTFX J tỉ lệ 1/8 có tạo hình sắc nét, pose tự tin và phần base hiệu ứng chú lực rất hợp với fan Jujutsu Kaisen.",
    specs: {
      brand: "Kotobukiya",
      series: "Jujutsu Kaisen",
      grade: "ARTFX J",
      scale: "1/8",
      material: "PVC, ABS",
      releaseDate: "12/2021",
      height: "25 cm",
      status: "Còn hàng"
    },
    features: [
      "Tạo hình chuẩn character, sơn mặt sắc.",
      "Base hiệu ứng trong suốt đẹp khi lên đèn.",
      "Kích thước vừa vặn cho kệ trưng bày cá nhân.",
      "Hàng chính hãng, đầy đủ box."
    ]
  },
  {
    id: "p-007",
    name: "Tamiya Side Cutter Alpha For Plastic Model",
    slug: "tamiya-side-cutter-alpha",
    brand: "Tamiya",
    category: "Tools & Accessories",
    price: 350000,
    originalPrice: 420000,
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.6,
    reviewCount: 140,
    stock: 50,
    status: "in-stock",
    badge: { text: "Sale", type: "sale" },
    releaseDate: "Regular",
    description:
      "Kìm cắt Tamiya Side Cutter Alpha cho model kit nhựa, lưỡi sắc, tay cầm chắc và phù hợp để xử lý runner sạch hơn trong quá trình build.",
    specs: {
      brand: "Tamiya",
      series: "Modelling Tools",
      grade: "Tool",
      scale: "N/A",
      material: "Carbon steel, resin grip",
      releaseDate: "Regular",
      height: "12 cm",
      status: "Còn hàng"
    },
    features: [
      "Lưỡi mỏng, cắt sát part dễ hơn kìm phổ thông.",
      "Tay cầm chống trượt, có lò xo đàn hồi.",
      "Phù hợp HG, RG, MG và các kit nhựa khác.",
      "Một món tool cơ bản nên có cho người mới."
    ]
  },
  {
    id: "p-008",
    name: "Bandai MGEX Strike Freedom Gundam 1/100",
    slug: "mgex-strike-freedom-gundam",
    brand: "Bandai Spirits",
    category: "Pre-order",
    grade: "MGEX",
    scale: "1/100",
    price: 3450000,
    images: [
      "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?auto=format&fit=crop&q=85&w=1200",
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 5,
    reviewCount: 0,
    stock: 0,
    status: "pre-order",
    badge: { text: "Pre-order", type: "pre-order" },
    releaseDate: "Q3/2026",
    description:
      "MGEX Strike Freedom tập trung vào vẻ đẹp khung xương ánh kim, hệ cánh Super Dragoon và decal nổi cao cấp. Sản phẩm đang nhận đặt trước với số lượng phân bổ hạn chế.",
    specs: {
      brand: "Bandai Spirits",
      series: "Gundam SEED Destiny",
      grade: "MGEX",
      scale: "1/100",
      material: "PS, ABS, metallic plated parts",
      releaseDate: "Q3/2026 dự kiến",
      height: "19.5 cm",
      status: "Đang nhận đặt trước"
    },
    features: [
      "Khung xương ánh kim nhiều sắc độ.",
      "Hệ cánh Super Dragoon tháo rời trưng bày đẹp.",
      "Decal nổi tạo chiều sâu cao cấp.",
      "Ưu tiên giữ slot cho khách đặt sớm."
    ]
  },
  {
    id: "p-009",
    name: "Bandai RG Hi-Nu Gundam 1/144",
    slug: "rg-hi-nu-gundam",
    brand: "Bandai Spirits",
    category: "Gundam RG",
    grade: "RG",
    scale: "1/144",
    price: 1250000,
    images: [
      "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.9,
    reviewCount: 88,
    stock: 18,
    status: "in-stock",
    badge: { text: "Best Seller", type: "hot" },
    releaseDate: "09/2021",
    description:
      "RG Hi-Nu Gundam là một trong những RG được yêu thích nhất nhờ silhouette đẹp, fin funnels lớn và khả năng tạo dáng ổn định.",
    specs: {
      brand: "Bandai Spirits",
      series: "Beltorchika's Children",
      grade: "RG",
      scale: "1/144",
      material: "PS, ABS",
      releaseDate: "09/2021",
      height: "14 cm",
      status: "Còn hàng"
    },
    features: [
      "Tỉ lệ đẹp, cân bằng tốt khi pose.",
      "Fin funnels tạo điểm nhấn sau lưng.",
      "Độ chi tiết vượt trội trong phân khúc.",
      "Bán chạy ổn định quanh năm."
    ]
  },
  {
    id: "p-010",
    name: "Nendoroid Hatsune Miku Magical Mirai",
    slug: "nendoroid-hatsune-miku-magical-mirai",
    brand: "Good Smile Company",
    category: "Figure Anime",
    price: 1480000,
    images: [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=85&w=1200"
    ],
    rating: 4.8,
    reviewCount: 41,
    stock: 0,
    status: "out-of-stock",
    badge: { text: "Sold Out", type: "sale" },
    releaseDate: "05/2024",
    description:
      "Nendoroid Hatsune Miku Magical Mirai với nhiều face plate, phụ kiện sân khấu và kích thước nhỏ gọn dễ trưng bày.",
    specs: {
      brand: "Good Smile Company",
      series: "Vocaloid",
      grade: "Nendoroid",
      scale: "Non-scale",
      material: "PVC, ABS",
      releaseDate: "05/2024",
      height: "10 cm",
      status: "Tạm hết hàng"
    },
    features: [
      "Nhiều phụ kiện thay thế.",
      "Dễ trưng bày trên bàn làm việc.",
      "Phong cách chibi dễ thương.",
      "Sản phẩm đang chờ restock."
    ]
  }
];
