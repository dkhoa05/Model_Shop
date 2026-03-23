# Model Shop (NodeJS + React + MongoDB)

Đồ án web bán mô hình: Express + Mongoose + React + Tailwind.

## Yêu cầu

- NodeJS 18+ (khuyến nghị)
- MongoDB (dùng MongoDB Compass cũng được)

## Demo nhanh (thuyết trình)

- **Customer**: `http://localhost:5173`
- **Admin**: `http://localhost:5174`
- **API**: `http://localhost:5000/api`

### Tài khoản (seed)

- **Admin**: `admin@modelshop.com` / `Admin@123`
- **User**:
  - `user1@modelshop.com` / `Admin@123`
  - `user2@modelshop.com` / `Admin@123`

### Checklist demo gợi ý

- **Customer**
  - Xem danh sách sản phẩm → vào **chi tiết sản phẩm**
  - Thêm giỏ → checkout → chọn phương thức thanh toán
  - Vào **đơn hàng** → xem chi tiết → (nếu chuyển khoản/MoMo/ZaloPay) **upload bill** → chờ admin duyệt
  - Chi tiết sản phẩm: xem **đánh giá/nhận xét** và gửi đánh giá (chỉ khi đơn đã giao)
- **Admin**
  - CRUD sản phẩm (upload ảnh)
  - Quản lý đơn hàng: đổi trạng thái, xác nhận thanh toán / **duyệt bill**
  - Quản lý khách hàng: CRUD + chặn/mở chặn + reset mật khẩu (mặc định về `Admin@123`)
  - **Cấu hình thanh toán**: nhập STK + QR + SĐT MoMo/ZaloPay
  - **Khoản chi**: nhập chi phí (nhập hàng/vận hành/marketing…)
  - **Báo cáo**: biểu đồ **Thu–Chi–Lợi nhuận** theo ngày/tuần/tháng/năm

## Chạy backend

Tạo file `.env` trong `server/` dựa trên `server/.env.example`.

```bash
cd server
npm install
npm run dev
```

Seed dữ liệu mẫu (tạo admin + user + sản phẩm + đơn + khoản chi demo):

```bash
cd server
npm run seed
```

## Chạy frontend

Repo đã tách thành:
- `client-customer/`: web cho khách (port 5173)
- `client-admin/`: web cho admin (port 5174)

Tạo file `.env` trong từng client dựa trên file `.env.example` tương ứng (mặc định trỏ về `http://localhost:5000/api`).

```bash
cd client-customer
npm install
npm run dev
```

Mở:
- Customer: `http://localhost:5173`
- Admin: `http://localhost:5174`

Chạy admin:

```bash
cd client-admin
npm install
npm run dev
```

## Tài khoản admin (seed)

- Email: `admin@modelshop.com`
- Password: `Admin@123`

## Tính năng

- User: đăng ký/đăng nhập, quên mật khẩu/đặt lại mật khẩu, xem sản phẩm, giỏ hàng, đặt hàng, xem đơn hàng, hủy đơn khi "Chờ xử lý", quản lý tài khoản (SĐT + avatar + đổi mật khẩu)
- Admin: CRUD sản phẩm + upload ảnh, quản lý đơn hàng + đổi trạng thái (hủy hoàn kho), quản trị khách hàng (thêm/sửa/xóa/chặn/mở chặn/reset mật khẩu), cấu hình thanh toán (STK + QR), khoản chi, báo cáo thu–chi–lợi nhuận

