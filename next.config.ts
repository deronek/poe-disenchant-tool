import { readFileSync } from "fs";
import { join } from "path";
import type { NextConfig } from "next";

//const injectWhyDidYouRender = require("./scripts/why-did-you-render");

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
  // webpack: (config, context) => {
  //   injectWhyDidYouRender(config, context);

  //   return config;
  // },
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
  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 180,
    },
  },
};

export default nextConfig;
