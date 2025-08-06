import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "web.poecdn.com",
      },
    ],
  },
};

export default nextConfig;
