const path = require("path");

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const api = new URL(apiUrl);
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "images.unsplash.com").split(",").map((h) => h.trim()).filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Docker: build gọn (standalone); tracing root = thư mục gốc monorepo
  output: "standalone",
  experimental: { outputFileTracingRoot: path.join(__dirname, "..") },
  images: {
    remotePatterns: [
      // Chỉ tối ưu ảnh từ các host được liệt kê (NEXT_PUBLIC_IMAGE_HOSTS, phân tách bằng dấu phẩy) và từ API.
      // Ảnh từ host khác vẫn hiển thị nhưng không đi qua image optimizer (xem ProductImage).
      ...imageHosts.map((hostname) => ({ protocol: "https", hostname })),
      { protocol: api.protocol.replace(":", ""), hostname: api.hostname, port: api.port || "" }
    ]
  },
  async redirects() {
    return [{ source: "/product/:slug", destination: "/products/:slug", permanent: true }];
  }
};

module.exports = nextConfig;
