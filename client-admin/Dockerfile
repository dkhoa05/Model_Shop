# Build context: thư mục gốc repo. VITE_* được nhúng lúc build → truyền qua build args.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client-customer/package.json client-customer/
COPY client-admin/package.json client-admin/
RUN npm ci --workspace client-admin --include-workspace-root=false

COPY client-admin client-admin
ARG VITE_API_BASE
ARG VITE_CUSTOMER_APP_URL
ENV VITE_API_BASE=$VITE_API_BASE VITE_CUSTOMER_APP_URL=$VITE_CUSTOMER_APP_URL
RUN npm run build --workspace client-admin

FROM nginx:1.27-alpine
COPY client-admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client-admin/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
