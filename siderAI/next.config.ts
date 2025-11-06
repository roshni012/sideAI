import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Suppress development overlays that might show unwanted text
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Use Turbopack (Next.js 16 default) - set root to silence warning about multiple lockfiles
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
