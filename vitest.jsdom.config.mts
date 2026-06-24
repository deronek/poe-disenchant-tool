import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // .js/.ts files tested separately in node environment
    include: ["./src/tests/unit-ui/**/*.{test,spec}.?(c|m)[jt]sx"],
  },
});
