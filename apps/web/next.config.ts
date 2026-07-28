import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers.mjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          production: process.env.NODE_ENV === "production"
        })
      }
    ];
  },
  transpilePackages: [
    "@apostolic-ia/design-tokens",
    "@apostolic-ia/domain"
  ]
};

export default nextConfig;
