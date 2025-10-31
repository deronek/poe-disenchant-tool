import { z } from "zod";

export const OnlineStatusSchema = z.enum([
  "available", // Instant Buyout and In-Person Trade
  "securable", // Instant Buyout Only
  "online", // In-Person Trade Only
  "any", // Any
]);

export type OnlineStatus = z.infer<typeof OnlineStatusSchema>;
