export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  image: string;
  date: string;
  tag: string;
  category: string;
  readTime: string;
}

export const blogs: BlogPost[] = [
  {
    id: "b-001",
    title: "Nên bắt đầu chơi Gundam từ dòng nào?",
    slug: "nen-bat-dau-choi-gundam-tu-dong-nao",
    excerpt:
      "Gợi ý chọn HG, RG hay MG cho người mới dựa trên ngân sách, thời gian build và độ chi tiết mong muốn.",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=85&w=1200",
    date: "2026-05-12",
    tag: "Beginner Guide",
    category: "Gunpla",
    readTime: "6 phút đọc",
    content: [
      "Nếu bạn mới bắt đầu, High Grade thường là lựa chọn nhẹ nhàng nhất vì giá hợp lý, ít runner và thời gian hoàn thiện nhanh. Đây là cách tốt để làm quen với kìm cắt, xử lý nub mark và đọc hướng dẫn lắp ráp.",
      "Real Grade phù hợp khi bạn muốn nhiều chi tiết hơn trong tỉ lệ nhỏ. Tuy vậy, một số mẫu RG có nhiều part bé nên cần thao tác cẩn thận hơn.",
      "Master Grade là bước nâng cấp đáng giá nếu bạn thích khung xương, tỉ lệ 1/100 và trải nghiệm build dài hơn. Hãy chọn mẫu có review ổn định như Barbatos, Dynames hoặc Freedom 2.0 để bắt đầu."
    ]
  },
  {
    id: "b-002",
    title: "Phân biệt HG, RG, MG, PG trong Gundam",
    slug: "phan-biet-hg-rg-mg-pg-trong-gundam",
    excerpt:
      "So sánh nhanh các grade phổ biến của Bandai để bạn chọn đúng bộ kit cho nhu cầu trưng bày và build.",
    image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&q=85&w=1200",
    date: "2026-05-08",
    tag: "Gunpla Grade",
    category: "Gunpla",
    readTime: "8 phút đọc",
    content: [
      "HG có quy mô sản phẩm rộng nhất và là cửa ngõ tốt cho người mới. Độ chi tiết vừa đủ, tốc độ build nhanh, dễ custom.",
      "RG mang triết lý chi tiết cao trong tỉ lệ 1/144. Nhiều mẫu đời mới có engineering rất tốt, đặc biệt RG Hi-Nu, Sazabi và Nu Gundam.",
      "MG cân bằng giữa kích thước, khung xương và trải nghiệm lắp ráp. PG là dòng cao cấp nhất về kích thước và độ phức tạp, hợp với collector đã có kinh nghiệm."
    ]
  },
  {
    id: "b-003",
    title: "Cách bảo quản figure anime tránh xuống màu",
    slug: "cach-bao-quan-figure-anime-tranh-xuong-mau",
    excerpt:
      "Các nguyên tắc về ánh sáng, bụi, nhiệt độ và vệ sinh để figure PVC giữ màu đẹp trong nhiều năm.",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=85&w=1200",
    date: "2026-04-28",
    tag: "Figure Care",
    category: "Figure",
    readTime: "5 phút đọc",
    content: [
      "Tránh đặt figure dưới ánh nắng trực tiếp vì tia UV có thể làm phai màu sơn và ảnh hưởng bề mặt nhựa PVC. Tủ kính nên đặt ở nơi khô, mát, ít biến động nhiệt.",
      "Bụi nên được xử lý bằng cọ mềm hoặc bóng thổi bụi. Không dùng khăn ướt mạnh tay lên các chi tiết sơn mảnh như mắt, tóc hoặc hiệu ứng trong suốt.",
      "Nếu trưng bày lâu dài, hãy kiểm tra điểm tiếp xúc với base định kỳ để tránh nghiêng hoặc cong part mảnh."
    ]
  }
];
