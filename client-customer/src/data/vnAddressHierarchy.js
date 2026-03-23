/**
 * Dữ liệu địa giới rút gọn phục vụ demo (đủ cấu trúc Tỉnh → Quận → Phường).
 * Báo cáo có thể ghi: có thể thay bằng API/dataset đầy đủ 63 tỉnh.
 */
export const PROVINCES = [
  "Thành phố Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng"
];

export const DISTRICTS_BY_PROVINCE = {
  "Thành phố Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 7", "Thành phố Thủ Đức", "Quận Bình Thạnh"],
  "Hà Nội": ["Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Cầu Giấy", "Quận Đống Đa", "Huyện Đông Anh"],
  "Đà Nẵng": ["Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Huyện Hòa Vang"],
  "Cần Thơ": ["Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Huyện Phong Điền"],
  "Hải Phòng": ["Quận Hồng Bàng", "Quận Lê Chân", "Quận Ngô Quyền", "Quận Kiến An", "Huyện An Dương"]
};

export const WARDS_BY_DISTRICT = {
  "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Đa Kao", "Phường Tân Định"],
  "Quận 3": ["Phường 1", "Phường 5", "Phường 11", "Phường Võ Thị Sáu"],
  "Quận 7": ["Phường Tân Hưng", "Phường Tân Phú", "Phường Tân Thuận Đông", "Phường Phú Mỹ"],
  "Thành phố Thủ Đức": ["Phường Linh Xuân", "Phường Hiệp Bình", "Phường Phước Long", "Phường Long Bình"],
  "Quận Bình Thạnh": ["Phường 1", "Phường 3", "Phường 12", "Phường 25"],
  "Quận Ba Đình": ["Phường Điện Biên", "Phường Giảng Võ", "Phường Ngọc Hà", "Phường Thành Công"],
  "Quận Hoàn Kiếm": ["Phường Chương Dương", "Phường Hàng Bạc", "Phường Hàng Gai", "Phường Lý Thái Tổ"],
  "Quận Cầu Giấy": ["Phường Dịch Vọng", "Phường Nghĩa Đô", "Phường Quan Hoa", "Phường Yên Hòa"],
  "Quận Đống Đa": ["Phường Khâm Thiên", "Phường Láng", "Phường Ô Chợ Dừa", "Phường Văn Miếu"],
  "Huyện Đông Anh": ["Thị trấn Đông Anh", "Xã Đông Hội", "Xã Tiên Dương", "Xã Vĩnh Phú"],
  "Quận Hải Châu": ["Phường Hải Châu I", "Phường Nam Dương", "Phường Thạch Thang", "Phường Thuận Phước"],
  "Quận Thanh Khê": ["Phường An Khê", "Phường Hòa Khê", "Phường Tam Thuận", "Phường Thanh Khê Tây"],
  "Quận Sơn Trà": ["Phường An Hải Bắc", "Phường Mân Thái", "Phường Nại Hiên Đông", "Phường Thọ Quang"],
  "Quận Ngũ Hành Sơn": ["Phường Hòa Hải", "Phường Khuê Mỹ", "Phường Mỹ An", "Phường Mỹ Đa"],
  "Huyện Hòa Vang": ["Thị trấn Hòa Vang", "Xã Hòa Châu", "Xã Hòa Nhơn", "Xã Hòa Phong"],
  "Quận Ninh Kiều": ["Phường An Bình", "Phường Cái Khế", "Phường Ninh Kiều", "Phường Tân An"],
  "Quận Bình Thủy": ["Phường An Thới", "Phường Bình Thủy", "Phường Thới An Đông", "Phường Trà An"],
  "Quận Cái Răng": ["Phường Ba Láng", "Phường Hưng Phú", "Phường Lê Bình", "Phường Thường Thạnh"],
  "Quận Ô Môn": ["Phường Châu Văn Liêm", "Phường Long Hưng", "Phường Phước Thới", "Phường Thới Hòa"],
  "Huyện Phong Điền": ["Thị trấn Phong Điền", "Xã Giai Xuân", "Xã Mỹ Khánh", "Xã Tân Thới"],
  "Quận Hồng Bàng": ["Phường Hạ Lý", "Phường Hoàng Văn Thụ", "Phường Minh Khai", "Phường Quán Toan"],
  "Quận Lê Chân": ["Phường An Biên", "Phường Cát Dài", "Phường Đông Hải", "Phường Trần Nguyên Hãn"],
  "Quận Ngô Quyền": ["Phường Cầu Đất", "Phường Đằng Giang", "Phường Lạch Tray", "Phường Máy Chai"],
  "Quận Kiến An": ["Phường Đồng Hòa", "Phường Nam Sơn", "Phường Phù Liễn", "Phường Trại Chuối"],
  "Huyện An Dương": ["Thị trấn An Dương", "Xã An Hòa", "Xã Bắc Sơn", "Xã Hồng Phong"]
};
