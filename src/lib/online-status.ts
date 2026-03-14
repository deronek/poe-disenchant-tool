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

export const ONLINE_STATUS_FILTER_OPTIONS = OnlineStatusSchema.options.map(
  (value) => ({
    value,
    label: ONLINE_STATUS_LABELS[value],
  }),
);

// Helper to get label from value
export const getOnlineStatusLabel = (value: OnlineStatus): string => {
  return ONLINE_STATUS_LABELS[value];
};

// Helper to get value from label
export const getOnlineStatusValue = (label: string): OnlineStatus => {
  const entry = Object.entries(ONLINE_STATUS_LABELS).find(
    ([, l]) => l === label,
  );

  if (!entry) {
    throw new Error(`Invalid online status filter label: ${label}`);
  }

  return entry[0] as OnlineStatus;
};
