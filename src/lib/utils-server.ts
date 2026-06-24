import "server-only";

export const isDevelopment = process.env.NODE_ENV !== "production";
export const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
