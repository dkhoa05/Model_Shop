# Model Shop

Cửa hàng mô hình (Gundam, Figure, Model Kit) gồm 3 thành phần tách biệt:

| Thành phần | Công nghệ | Vai trò | Cổng dev |
|---|---|---|---|
| `server/` | Node 22, Express, MongoDB (Mongoose) | API, đăng nhập (cookie httpOnly), đơn hàng, kho, kế toán | 5000 |
| `client-customer/` | Next.js 14 (App Router), Tailwind | Website cho khách | 3000 |
| `client-admin/` | React + Vite, Tailwind | Trang quản trị (admin / staff / accountant) | 5174 |

Kế hoạch đã thực hiện và quyết định thiết kế: [docs/PRODUCTION_PLAN.md](docs/PRODUCTION_PLAN.md).

## Chạy thử nhanh (không cần cài MongoDB)

```bash
npm install
npm run demo              # API + MongoDB trong bộ nhớ + dữ liệu mẫu (http://localhost:5000); dữ liệu mất khi tắt
npm run dev:customer      # Web khách  http://localhost:3000   (terminal khác)
npm run dev:admin         # Admin      http://localhost:5174   (terminal khác)
```

Tài khoản mẫu (mật khẩu chung `Admin@123`): `admin@modelshop.com`, `staff1@modelshop.com` (bán hàng/kho), `accountant1@modelshop.com` (kế toán), `user1@modelshop.com`, `user2@modelshop.com` (khách).
Dữ liệu mẫu có sẵn 69 sản phẩm, đơn hàng ở nhiều trạng thái, chi phí, sổ kế toán, thông tin nhận tiền **demo** (chuyển khoản + MoMo) và mã giảm giá `WELCOME10`, `MODEL50K`.

## Chạy local (dev)

Yêu cầu: Node 22+, một MongoDB (local hoặc Atlas).

```bash
npm install
cp server/.env.example server/.env          # điền MONGODB_URI, JWT_SECRET (xem ghi chú trong file)
cp client-customer/.env.example client-customer/.env.local
cp client-admin/.env.example client-admin/.env
npm run dev:server        # API  http://localhost:5000
npm run dev:customer      # Web  http://localhost:3000
npm run dev:admin         # Admin http://localhost:5174
```

Tạo tài khoản admin đầu tiên (không ghi đè tài khoản có sẵn):

```bash
# đặt ADMIN_EMAIL (và tuỳ chọn ADMIN_PASSWORD) trong server/.env rồi chạy:
npm run ensure-admin
```

Dữ liệu mẫu (chỉ dev, **xóa và ghi đè dữ liệu**): `npm run seed --workspace server`. Seed bị chặn ở production.

## Kiểm tra chất lượng

```bash
npm test               # 23 test tích hợp (Mongo replica set trong bộ nhớ, tự tải mongod lần đầu)
npm run typecheck      # TypeScript web khách
npm run check          # typecheck + test + build
```

CI (GitHub Actions) chạy test server, typecheck + build web khách, build admin, audit dependency.

## Triển khai production (Docker Compose, 1 máy chủ)

1. Trỏ DNS 3 domain về máy chủ: `SHOP_DOMAIN` (web khách), `ADMIN_DOMAIN`, `API_DOMAIN`.
2. `cp .env.production.example .env.production` rồi điền: domain, `JWT_SECRET` (≥ 32 ký tự), SMTP, phí ship.
3. Chạy:
   ```bash
   docker compose --env-file .env.production up -d --build
   docker compose exec -e ADMIN_EMAIL=ban@example.com api node server/src/ensureAdmin.js   # tạo admin, in mật khẩu tạm 1 lần
   ```
4. Kiểm tra: `https://<API_DOMAIN>/api/health` trả `{"status":"ok","db":"up"}`.

Stack gồm MongoDB 7 (replica set 1 node để dùng transaction, không mở cổng ra ngoài), API, web khách (Next standalone), admin (nginx tĩnh) và Caddy (HTTPS tự động).
Ảnh tải lên nằm trong volume `uploads`. Cookie đăng nhập dùng chung giữa các subdomain nhờ `COOKIE_DOMAIN=.example.com`; nếu các domain khác site hoàn toàn, đặt `COOKIE_SAMESITE=none` cho API.

Cập nhật phiên bản: `git pull && docker compose --env-file .env.production up -d --build`.

### Không dùng Docker / dùng dịch vụ đám mây

- **MongoDB Atlas**: dùng chuỗi `mongodb+srv://…` làm `MONGODB_URI` (Atlas là replica set nên transaction hoạt động), bỏ service `mongo` trong compose.
- **Web khách trên Vercel / admin trên Netlify hoặc Cloudflare Pages / API trên Render, Railway, Fly.io**: đặt các biến môi trường tương ứng (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_SITE_URL`, `VITE_API_BASE`, và toàn bộ biến của `server/.env.example`). Nền tảng không có ổ đĩa bền cần chuyển ảnh tải lên sang object storage (S3/Cloudinary) trước khi dùng.

## Vận hành

- **Log**: JSON có cấu trúc (pino) ra stdout, mỗi request có `X-Request-Id`; đặt `LOG_LEVEL`. Xem: `docker compose logs -f api`. Lỗi 500 trả về `requestId` để tra log.
- **Health check**: `GET /api/health` (503 nếu mất kết nối DB). Docker tự khởi động lại container lỗi. Server tắt êm khi nhận SIGTERM.
- **Sao lưu**: `./scripts/backup-mongo.sh` (DB + ảnh, giữ 14 bản gần nhất). Đặt cron hằng ngày và **sao chép `backups/` ra ngoài máy chủ**. Khôi phục: `./scripts/restore-mongo.sh backups/db-….archive.gz backups/uploads-….tar.gz`. Nên diễn tập khôi phục định kỳ.
- **Đối soát kế toán**: admin/kế toán gọi `POST /api/admin/accounting/reconcile` để ghi sổ bổ sung cho đơn/chi phí cũ (idempotent).
- **Giám sát lỗi**: chưa tích hợp Sentry/APM; có thể thêm bằng `SENTRY_DSN` khi cần. Nên bật uptime monitor cho `/api/health`.

## Phân quyền

| Vai trò | Quyền chính |
|---|---|
| `admin` | Toàn quyền, quản lý tài khoản nội bộ, khách hàng, cấu hình thanh toán |
| `staff` | Sản phẩm, đơn hàng, kho, CRM, nhà cung cấp, PO, coupon |
| `accountant` | Kế toán, hóa đơn, chi phí, báo cáo, duyệt và thực hiện hoàn tiền |

## Bảo mật (tóm tắt)

Cookie httpOnly + kiểm tra Origin chống CSRF, helmet, CORS theo whitelist, rate limit (đăng nhập, đăng ký, quên mật khẩu, tra cứu đơn, upload), kiểm tra magic bytes khi upload ảnh, whitelist trường khi ghi dữ liệu, thu hồi phiên khi đổi mật khẩu/vai trò.
**Nếu chuỗi kết nối MongoDB từng nằm trong git history, hãy đổi mật khẩu database.**
