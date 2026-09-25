# Build context: thư mục gốc repo (docker compose đã cấu hình sẵn)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Chỉ cài dependency production của workspace "server"
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client-customer/package.json client-customer/
COPY client-admin/package.json client-admin/
RUN npm ci --omit=dev --workspace server --include-workspace-root=false && npm cache clean --force

COPY server/src server/src
RUN mkdir -p server/uploads && chown -R node:node /app
USER node

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health >/dev/null || exit 1

CMD ["node", "server/src/server.js"]
