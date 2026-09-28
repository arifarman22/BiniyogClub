import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Local /public images are served directly — no remotePatterns needed
  },
};

export default nextConfig;
