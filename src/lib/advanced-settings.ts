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
 * as-is. The legacy key is removed after migrating. Returns the migrated
 * settings so the caller can adopt them as the current state, or null when
 * there was nothing to migrate.
 */
export function migrateLegacyAdvancedSettings(): AdvancedSettings | null {
  const legacyRaw = window.localStorage.getItem(
    LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
  );
  if (legacyRaw === null) return null;

  if (window.localStorage.getItem(ADVANCED_SETTINGS_STORAGE_KEY) !== null) {
    window.localStorage.removeItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1);
    return null;
  }

  let migrated: AdvancedSettings | null = null;
  try {
    const legacy = AdvancedSettingsSchema.safeParse(JSON.parse(legacyRaw));
    if (legacy.success) {
      migrated = {
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
    }
  } catch {
    // Invalid legacy data; fall through to cleanup
  } finally {
    window.localStorage.removeItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1);
  }
  return migrated;
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
