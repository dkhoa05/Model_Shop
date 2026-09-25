#!/usr/bin/env bash
# Sao lưu MongoDB (+ ảnh tải lên) từ stack docker compose.
# Dùng:  ./scripts/backup-mongo.sh            (mặc định giữ 14 bản gần nhất)
# Cron:  0 3 * * *  cd /opt/model-shop && ./scripts/backup-mongo.sh >> backups/backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."
KEEP="${KEEP:-14}"
DIR="backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DIR"

echo "[$(date -Is)] dump database..."
docker compose exec -T mongo mongodump --db model_shop --archive --gzip > "$DIR/db-$STAMP.archive.gz"

echo "[$(date -Is)] archive uploads..."
docker compose exec -T api tar -C /app/server -czf - uploads > "$DIR/uploads-$STAMP.tar.gz"

# Kiểm tra file không rỗng
for f in "$DIR/db-$STAMP.archive.gz" "$DIR/uploads-$STAMP.tar.gz"; do
  [ -s "$f" ] || { echo "Backup thất bại: $f rỗng" >&2; exit 1; }
done

# Xóa bản cũ, giữ $KEEP bản gần nhất mỗi loại
ls -1t "$DIR"/db-*.archive.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
ls -1t "$DIR"/uploads-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "[$(date -Is)] xong: $DIR/db-$STAMP.archive.gz, $DIR/uploads-$STAMP.tar.gz"
echo "Nhớ sao chép thư mục backups/ sang nơi lưu trữ ngoài máy chủ (S3, ổ khác...)."
