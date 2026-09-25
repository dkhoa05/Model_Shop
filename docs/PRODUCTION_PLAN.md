# Model Shop – Kế hoạch đưa lên production

Quyết định kiến trúc (chọn theo hướng dễ vận hành/bảo hành lâu dài):
- **3 thành phần tách biệt**: `server` (API Express), `client-customer` (Next.js, `next start`), `client-admin` (Vite SPA tĩnh). Cấu hình hoàn toàn bằng env, CORS whitelist theo domain.
- **Admin duy nhất = `client-admin`** (gọi API thật). Xóa `/admin/*` mock trong Next.js và các trang khách thừa trong client-admin.
- **Catalog chỉ từ DB/API**. Mock chỉ bật khi `NEXT_PUBLIC_USE_MOCK=1` (dev).
- **Thanh toán**: giữ COD + chuyển khoản/QR duyệt tay; ẩn MoMo/ZaloPay cho tới khi tích hợp cổng thật (webhook). Cần thêm trường idempotent để nối cổng sau này.
- **Ảnh**: upload qua storage adapter (mặc định đĩa, đổi sang S3/Cloudinary bằng env), không commit ảnh vào git.

## Hiện trạng: OK / cần sửa

### OK (giữ)
- Trừ kho nguyên tử (`findOneAndUpdate stock>=qty`) + rollback khi lỗi.
- Server tự tính giá từ DB (không tin giá client), tính ship/giảm giá phía server.
- Reset password: token hash SHA-256, hạn 1h, phản hồi chung không lộ email.
- Đổi mật khẩu/đặt lại: bcrypt; ẩn `password` khi trả user; user bị chặn bị từ chối ở middleware.
- Review chỉ cho người đã nhận hàng; coupon unique index mỗi user 1 lần.
- Approvals nhiều cấp, chặn tự duyệt.

### Cần sửa (theo mức độ)

**P0 – Bảo mật / chặn go-live**
1. `server/.env.example` chứa chuỗi Mongo Atlas thật `admin:123@…` → xóa, đổi mật khẩu DB ngay, coi như lộ (có trong git history).
2. `JWT_SECRET` fallback `"dev_secret"` (auth, optionalAuth, login) → bắt buộc env, server không khởi động nếu thiếu ở production.
3. `POST /api/admin/approvals`: `...req.body` cho phép client tự đặt `status:"approved"`, `approvalSteps`, `requiredApprovals` → whitelist field. Refund nhỏ (<5tr) requester tự duyệt được → luôn cấm tự duyệt.
4. `PUT /api/products/:id` và `POST` truyền thẳng `req.body` (mass assignment: `reviews`, `ratingAvg`, `numReviews`) → whitelist field.
5. Upload `POST /uploads/payment-proof` và `/avatar` không giới hạn → lấp đầy đĩa. Cần rate limit, kiểm tra magic bytes, giới hạn theo đơn; ảnh nên gắn vào đơn.
6. Thiếu `helmet`, rate-limit (login, register, forgot-password, guest order lookup, ai/ask), `express.json({limit})`, `trust proxy`, CORS `origin:true` → whitelist.
7. Tra cứu đơn khách chỉ bằng `_id + phone` (brute-force / lộ đơn) → thêm mã tra cứu ngẫu nhiên (token) hoặc mã đơn + phone + rate limit.
8. Token JWT 7 ngày lưu `localStorage` (XSS) và không thu hồi khi đổi mật khẩu → chuyển httpOnly cookie hoặc access ngắn + refresh; thêm `tokenVersion` trong User.
9. `search` dùng `$regex` từ input (ReDoS/regex injection) → escape; `GET /products` không phân trang.

**P1 – Đúng nghiệp vụ / toàn vẹn dữ liệu**
10. Đơn hàng: tạo đơn, InventoryMovement, tăng `usedCount` coupon không nằm trong transaction → dùng Mongo session/transaction (cần replica set; Atlas có sẵn).
11. Hủy đơn (khách/admin) không atomic, có thể hoàn kho 2 lần (race, và admin đổi `pending→cancelled→…`) → chuyển trạng thái bằng state machine + `findOneAndUpdate` có điều kiện; không cho rời `cancelled`/`delivered`; hoàn coupon/`usedCount`.
12. Khách chỉ hủy được khi `pending`, nhưng đơn đã `paid` thì hủy không có hoàn tiền → định nghĩa flow: paid → phải qua refund.
13. Refund: `execute` chỉ đổi cờ, không ghi sổ kế toán, không hoàn kho tùy trường hợp → nối JournalEntry + InventoryMovement.
14. Kế toán: hóa đơn/journal tạo ở route admin thủ công, không tự sinh từ đơn `delivered/paid`; COGS/giá vốn chưa có (Product không có `cost`) → thêm `cost`, bút toán tự động, khóa kỳ.
15. `paymentRef` `MS+8 số cuối timestamp` có thể trùng → dùng sequence/nanoid, unique index.
16. Coupon: kiểm tra hạn/giới hạn dùng/`minSubtotal` phải ở trong luồng atomic (`usedCount < maxUses` khi tăng); bỏ mã legacy hard-code `WELCOME10/MODEL50K` trong `constants/checkout.js`.
17. `STORE_PICKUP_ADDRESS`, phí ship, ngưỡng free ship, bank config hard-code → đưa vào bảng cấu hình (đã có PaymentConfig).
18. Email gửi fire-and-forget, không retry, không log bền → hàng đợi đơn giản + log; nội dung đúng trạng thái.
19. Admin API dùng chung prefix `/api/admin` nhiều router, thiếu validation input (Purchase/Inventory/Leads…) → thêm schema validation (zod/joi) và phân quyền theo vai trò (admin/staff/accountant).
20. `hot`/reports aggregate không index → thêm index (`Order.status,createdAt`, `Order.items.product`, `Product.category/name`).

**P2 – Frontend / UX**
21. Xóa admin mock Next.js (`app/admin/**`, `lib/erp.ts`, `AdminShell`) và trang khách thừa trong `client-admin` (Cart/Checkout/Home/… ), `client-customer/dist` đã commit, file `.jsx` lẻ trong dự án TS (`CartDrawer.jsx`, `CartContents.jsx`, `UserAvatar.jsx`, `cartStorage.js`).
22. Catalog khách bỏ fallback mock; giỏ hàng lưu ID DB; xử lý sản phẩm hết hàng/đổi giá khi checkout (server trả lỗi rõ, UI cập nhật giỏ).
23. Trang chi tiết có 2 route (`/product/[slug]` và `/products/[slug]`) → thống nhất + redirect; SEO metadata, sitemap, `robots`.
24. Trang forgot/reset password của khách: kiểm tra khớp `FRONTEND_URL`; login khách và admin dùng chung backend nhưng khác domain → tách rõ token/cookie.
25. Next `images.domains` (deprecated) → `remotePatterns`, thêm domain ảnh của API/storage; `next/image` cho ảnh upload.
26. Loading/error state, i18n hiển thị lỗi tiếng Việt thống nhất (nhiều message tiếng Anh từ API).
27. Trang admin: xác nhận hành động nguy hiểm (xóa, hủy, refund), phân trang bảng, xuất báo cáo.

**P3 – Vận hành**
28. Logging có cấu trúc (pino), request id, `/api/health` kiểm tra DB, xử lý `unhandledRejection`, graceful shutdown.
29. `dns.setServers('1.1.1.1')` hard-code trong `db.js` → bỏ/để tùy env.
30. Dockerfile + docker-compose (api, customer, admin nginx), `.env.example` sạch cho từng service, CI (lint, typecheck, build, test).
31. Backup Mongo định kỳ + kịch bản restore; theo dõi lỗi (Sentry).
32. Test: unit cho tính giá/coupon/state machine, integration cho order/refund/auth (mongodb-memory-server), E2E checkout (Playwright).
33. README cập nhật (script `copy:*` cũ, `server/public/*` không còn dùng); script `seed` không chạy ở production; `ensure-admin` không dùng mật khẩu mặc định.

## Thứ tự thực hiện

| Plan | Nội dung | Mục |
|---|---|---|
| A | Bảo mật nền tảng: secrets, JWT, helmet, rate-limit, CORS, validation đầu vào, whitelist field, upload | 1–9 |
| B | Dọn kiến trúc: xóa mock/dead code/dist, một admin duy nhất, catalog chỉ từ API | 21–23 |
| C | Luồng đơn hàng & kho: transaction, state machine, coupon atomic, mã đơn, hoàn kho | 10–12, 15–17 |
| D | Thanh toán/refund/kế toán/duyệt: nối sổ, cost, phân quyền vai trò | 3, 13, 14, 19 |
| E | Frontend khách: giỏ, checkout, tài khoản, SEO, ảnh, UX lỗi | 22–27 |
| F | Vận hành: Docker, CI, logging, backup, test, README | 28–33 |

Mỗi plan làm xong → chạy typecheck/build/test → commit riêng.

**Trạng thái:** Plan A ✅ · B ✅ · C ✅ · D ✅ · E ✅ · F ✅ (Docker Compose + Caddy, CI, log pino, health check, backup/restore, README). Chưa build được image Docker trong môi trường phát triển (máy không có Docker).
