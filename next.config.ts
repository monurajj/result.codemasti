import type { NextConfig } from "next";

const scholarshipApiBase = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!scholarshipApiBase) return [];
    return [
      {
        source: "/api/scholarship-test/:path*",
        destination: `${scholarshipApiBase}/api/scholarship-test/:path*`,
      },
    ];
  },
};

export default nextConfig;
