const path = require("path");

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const api = new URL(apiUrl);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Docker: build gọn (standalone); tracing root = thư mục gốc monorepo
  output: "standalone",
  experimental: { outputFileTracingRoot: path.join(__dirname, "..") },
  images: {
    remotePatterns: [
      // Ảnh sản phẩm do admin nhập URL https bất kỳ hoặc tải lên API
      { protocol: "https", hostname: "**" },
      { protocol: api.protocol.replace(":", ""), hostname: api.hostname, port: api.port || "" }
    ]
  },
  async redirects() {
    return [{ source: "/product/:slug", destination: "/products/:slug", permanent: true }];
  }
};

module.exports = nextConfig;
