import { z } from "zod";

export const OnlineStatusSchema = z.enum([
  "available", // Instant Buyout and In Person Trade
  "securable", // Instant Buyout
  "onlineleague", // In Person (Online In League)
  "online", // In Person (Online)
  "any", // Any
]);

export type OnlineStatus = z.infer<typeof OnlineStatusSchema>;

export const ONLINE_STATUS_LABELS: Record<OnlineStatus, string> = {
  available: "Instant Buyout & In Person",
  securable: "Instant Buyout",
  onlineleague: "In Person (Online In League)",
  online: "In Person (Online)",
  any: "Any (Possibly Offline)",
};
