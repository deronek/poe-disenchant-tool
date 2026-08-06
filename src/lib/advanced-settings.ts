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
    .prefault(MIN_ITEM_LEVEL_RANGE.max),
  includeCorrupted: z.boolean().prefault(true),
  listingTimeFilter: ListingTimeFilterSchema.prefault("3days"),
  onlineStatus: OnlineStatusSchema.prefault("available"),
});

export type AdvancedSettings = z.infer<typeof AdvancedSettingsSchema>;

export const ADVANCED_SETTINGS_STORAGE_KEY = "poe-udt:trade-settings:v2";
export const LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1 =
  "poe-udt:trade-settings:v1";
export const LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1 = 78;

/**
 * One-time migration from the v1 storage key to the v2 storage key.
 *
 * Copies every setting over 1:1, except minItemLevel: the legacy default (78)
 * becomes the new default (highest item level), while custom values are kept
 * as-is. Legacy data always wins: even when v2 data already exists (e.g.,
 * after a rollback to an older version), the legacy values are migrated over
 * it. The legacy key is removed up front: if the v2 write then fails (e.g.,
 * storage quota exceeded), the v1 data is lost — this is accepted. Returns
 * the migrated settings so the caller can adopt them as the current state, or
 * null when there was nothing to migrate.
 */
export function migrateLegacyAdvancedSettings(): AdvancedSettings | null {
  const legacyRaw = window.localStorage.getItem(
    LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
  );
  if (legacyRaw === null) return null;

  window.localStorage.removeItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1);

  try {
    const legacy = AdvancedSettingsSchema.safeParse(JSON.parse(legacyRaw));
    if (!legacy.success) return null;

    const migrated: AdvancedSettings = {
      ...legacy.data,
      minItemLevel:
        legacy.data.minItemLevel === LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1
          ? MIN_ITEM_LEVEL_RANGE.max
          : legacy.data.minItemLevel,
    };
    window.localStorage.setItem(
      ADVANCED_SETTINGS_STORAGE_KEY,
      JSON.stringify(migrated),
    );
    return migrated;
  } catch {
    return null;
  }
}

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
