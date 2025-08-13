import type { NextConfig } from "next";
const injectWhyDidYouRender = require("./scripts/why-did-you-render");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "web.poecdn.com",
      },
    ],
  },
  webpack: (config, context) => {
    // injectWhyDidYouRender(config, context);

    return config;
  },
};

export default nextConfig;
