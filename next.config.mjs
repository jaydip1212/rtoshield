/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ["postgres", "bullmq", "ioredis"] },
  async headers() {
    return [
      {
        // The public SDK: long-lived immutable cache + nosniff. CORS lets any
        // storefront load the script (loading JS is not a data-access boundary;
        // the /api/track endpoint enforces the real per-org allow-list).
        source: "/sdk/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        // Baseline security headers for the whole app.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ]
  },
}
export default nextConfig
