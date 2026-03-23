# Luồng mua hàng — Model Shop (website bán mô hình sưu tầm / toy figure)

Tài liệu phục vụ mô tả hệ thống, báo cáo đồ án hoặc slide thuyết trình.

---

## 1. Luồng mua hàng (dạng sơ đồ ngắn)

```
Trang chủ / Danh mục mô hình → Xem chi tiết mô hình → Chọn phiên bản & số lượng → Thêm vào giỏ hàng → Xem giỏ hàng
→ Nhập thông tin nhận hàng (hoặc đăng nhập để điền nhanh, nhận khuyến mãi)
→ Chọn phương thức giao hàng (giao tận nơi / nhận tại cửa hàng)
→ Chọn phương thức thanh toán (chuyển khoản ngân hàng, MoMo, COD)
→ Xác nhận đặt hàng → Thanh toán (theo phương thức đã chọn) → Hệ thống tạo đơn hàng → Theo dõi đơn hàng
```

---

## 2. Mô tả luồng bằng đoạn văn (ngữ cảnh bán mô hình)

Người dùng truy cập **trang chủ** hoặc **danh mục mô hình** (figure anime, kit Gundam/Gunpla, blind box, action figure, phụ kiện trưng bày…) để tìm sản phẩm phù hợp sở thích sưu tầm. Tại **trang chi tiết mô hình**, khách xem ảnh, mô tả, **phiên bản / quy cách** (ví dụ scale tỉ lệ, bản Limited, series blind box), **tình trạng hàng** (còn hàng, pre-order, giới hạn, hết hàng) và **tồn kho** có thể đặt. Sau khi **chọn số lượng** (giới hạn theo tồn kho), khách **thêm vào giỏ hàng** — giỏ lưu cục bộ; có thể mua tiếp hoặc vào **giỏ hàng** để kiểm tra lại tên mô hình, phiên bản và số lượng.

Khi **thanh toán**, hệ thống yêu cầu **đăng nhập** để gắn đơn với tài khoản: thuận tiện **điền nhanh** số điện thoại, **áp mã khuyến mãi** dành cho collector, và **theo dõi đơn** sau này. Khách nhập **thông tin nhận hàng** (có thể điều chỉnh sau khi đăng nhập), chọn **giao tận nơi** (có phí vận chuyển theo quy định, miễn phí khi đạt ngưỡng giá trị đơn) hoặc **nhận tại cửa hàng** (không phí giao). Tiếp theo, khách chọn **phương thức thanh toán**: **COD** (thanh toán khi nhận mô hình), **chuyển khoản ngân hàng**, hoặc **MoMo** (và ví tương tự nếu được cấu hình). Sau **xác nhận đặt hàng**, hệ thống **ghi nhận đơn**, trừ tồn kho phù hợp; khách thực hiện **thanh toán** (upload minh chứng nếu không chọn COD) và **theo dõi trạng thái đơn** (chờ xử lý, đang giao, đã giao…) trên trang đơn hàng.

---

## 3. Đặc thù ngành hàng được phản ánh trong hệ thống

| Đặc điểm | Cách triển khai trong Model Shop |
|----------|-----------------------------------|
| Nhiều phiên bản / quy cách | Trường **phiên bản / quy cách** (`variantLabel`) trên sản phẩm; hiển thị ở chi tiết, giỏ và checkout |
| Tình trạng hàng | **Còn hàng / Pre-order / Giới hạn (Limited) / Hết hàng** (`availability`) kết hợp **tồn kho** |
| Số lượng đặt | Chọn số lượng trên chi tiết; không vượt tồn kho |
| Đăng nhập | Bắt buộc khi checkout; lưu thông tin, khuyến mãi, theo dõi đơn |
| Giao hàng | **Giao tận nơi** hoặc **nhận tại cửa hàng** |
| Thanh toán | **Chuyển khoản**, **MoMo**, **COD** (và ZaloPay nếu cấu hình) |

---

*Tài liệu này có thể chèn nguyên hoặc rút gọn vào báo cáo đồ án.*
