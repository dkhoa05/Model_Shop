#!/usr/bin/env bash
# Khôi phục từ bản sao lưu.  Dùng: ./scripts/restore-mongo.sh backups/db-YYYYMMDD-HHMMSS.archive.gz [backups/uploads-....tar.gz]
# CẢNH BÁO: ghi đè dữ liệu hiện tại (--drop). Hãy thử khôi phục trên môi trường thử trước.
set -euo pipefail

cd "$(dirname "$0")/.."
DB_FILE="${1:?Cần đường dẫn file db-*.archive.gz}"
UPLOADS_FILE="${2:-}"

read -r -p "Ghi đè database model_shop bằng $DB_FILE? Gõ 'yes' để tiếp tục: " ans
[ "$ans" = "yes" ] || { echo "Đã hủy."; exit 1; }

docker compose exec -T mongo mongorestore --archive --gzip --drop < "$DB_FILE"

if [ -n "$UPLOADS_FILE" ]; then
  docker compose exec -T api tar -C /app/server -xzf - < "$UPLOADS_FILE"
fi
echo "Khôi phục xong. Kiểm tra: curl https://<API_DOMAIN>/api/health"
