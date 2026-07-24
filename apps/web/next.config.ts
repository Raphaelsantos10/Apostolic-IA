import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@apostolic-ia/design-tokens",
    "@apostolic-ia/domain"
  ]
};

export default nextConfig;
