import { z } from "zod";

import {
  ListingTimeFilterSchema,
  MIN_ITEM_LEVEL_RANGE,
  OnlineStatusSchema,
} from "@/lib/filters";

export const AdvancedSettingsSchema = z.object({
  minItemLevel: z
    .int()
    .min(MIN_ITEM_LEVEL_RANGE.min)
    .max(MIN_ITEM_LEVEL_RANGE.max)
    .prefault(78),
  includeCorrupted: z.boolean().prefault(true),
  listingTimeFilter: ListingTimeFilterSchema.prefault("3days"),
  onlineStatus: OnlineStatusSchema.prefault("available"),
});

export type AdvancedSettings = z.infer<typeof AdvancedSettingsSchema>;

const ADVANCED_SETTINGS_KEYS = Object.keys(
  AdvancedSettingsSchema.shape,
) as (keyof AdvancedSettings)[];

export function advancedSettingsDeepEqual(
  a: AdvancedSettings,
  b: AdvancedSettings,
): boolean {
  return ADVANCED_SETTINGS_KEYS.every((key) => a[key] === b[key]);
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings =
  AdvancedSettingsSchema.parse({});
