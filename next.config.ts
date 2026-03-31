import { readFileSync } from "fs";
import { join } from "path";
import type { NextConfig } from "next";

import { ARCHIVED_LEAGUE_SLUGS, DEFAULT_LEAGUE } from "./src/lib/leagues";

// const injectWhyDidYouRender = require("./scripts/why-did-you-render");

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf-8"),
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "web.poecdn.com",
      },
    ],
  },
  webpack: (config) => {
    // Force conservative chunking to optimize for edge requests
    config.optimization.splitChunks = {
      chunks: "all",
      minSize: 2000000, // force large chunks
    };

    // Force inline webpack chunk
    config.optimization.runtimeChunk = false;
    return config;
  },
  // Checks done in CI
  typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: {
    compilationMode: "annotation",
  },
  env: {
    PDT_APP_VERSION: packageJson.version,
    PDT_APP_NAME: packageJson.name,
  },
  devIndicators: process.env.PLAYWRIGHT ? false : undefined, // Disable dev tools in Playwright for VRT
  // Static redirects - handled at CDN/edge level
  async redirects() {
    return [
      // Root redirect - temporary because DEFAULT_LEAGUE changes
      {
        source: "/",
        destination: `/${DEFAULT_LEAGUE}`,
        permanent: false,
      },
      // Archival leagues - permanent because these URLs will not come back
      ...ARCHIVED_LEAGUE_SLUGS.map((archivedLeague) => ({
        source: `/${archivedLeague}`,
        destination: `/${DEFAULT_LEAGUE}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
