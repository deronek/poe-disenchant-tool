import { beforeEach, describe, expect, it } from "vitest";

import {
  ADVANCED_SETTINGS_STORAGE_KEY,
  AdvancedSettingsSchema,
  DEFAULT_ADVANCED_SETTINGS,
  LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
  LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1,
  migrateLegacyAdvancedSettings,
} from "@/lib/advanced-settings";
import { MIN_ITEM_LEVEL_RANGE } from "@/lib/filters";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

let storage: Storage;

beforeEach(() => {
  storage = new MemoryStorage();
});

describe("DEFAULT_ADVANCED_SETTINGS", () => {
  it("uses the highest item level as default minItemLevel", () => {
    expect(DEFAULT_ADVANCED_SETTINGS.minItemLevel).toBe(
      MIN_ITEM_LEVEL_RANGE.max,
    );
  });

  it("fills missing minItemLevel with the highest item level", () => {
    const parsed = AdvancedSettingsSchema.parse({ includeCorrupted: false });
    expect(parsed.minItemLevel).toBe(MIN_ITEM_LEVEL_RANGE.max);
  });
});

describe("migrateLegacyAdvancedSettings", () => {
  it("returns null when there is no legacy key", () => {
    expect(migrateLegacyAdvancedSettings(storage)).toBeNull();
    expect(storage.getItem(ADVANCED_SETTINGS_STORAGE_KEY)).toBe(null);
  });

  it("migrates the legacy default minItemLevel to the highest item level", () => {
    storage.setItem(
      LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
      JSON.stringify({ minItemLevel: LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1 }),
    );

    const migrated = migrateLegacyAdvancedSettings(storage);

    expect(migrated).not.toBeNull();
    expect(migrated!.minItemLevel).toBe(MIN_ITEM_LEVEL_RANGE.max);
    expect(
      JSON.parse(storage.getItem(ADVANCED_SETTINGS_STORAGE_KEY)!).minItemLevel,
    ).toBe(MIN_ITEM_LEVEL_RANGE.max);
    expect(storage.getItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1)).toBeNull();
  });

  it("transfers custom minItemLevel values 1:1", () => {
    for (const minItemLevel of [
      MIN_ITEM_LEVEL_RANGE.min,
      70,
      80,
      83,
      MIN_ITEM_LEVEL_RANGE.max,
    ]) {
      storage.clear();
      storage.setItem(
        LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
        JSON.stringify({ minItemLevel }),
      );

      const migrated = migrateLegacyAdvancedSettings(storage);

      expect(migrated!.minItemLevel).toBe(minItemLevel);
      expect(
        JSON.parse(storage.getItem(ADVANCED_SETTINGS_STORAGE_KEY)!)
          .minItemLevel,
      ).toBe(minItemLevel);
    }
  });

  it("transfers all other settings 1:1", () => {
    storage.setItem(
      LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
      JSON.stringify({
        minItemLevel: LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1,
        includeCorrupted: false,
        listingTimeFilter: "1day",
        onlineStatus: "securable",
      }),
    );

    const migrated = migrateLegacyAdvancedSettings(storage);

    expect(migrated).toEqual({
      minItemLevel: MIN_ITEM_LEVEL_RANGE.max,
      includeCorrupted: false,
      listingTimeFilter: "1day",
      onlineStatus: "securable",
    });
  });

  it("removes the legacy key and returns null when its data is invalid", () => {
    storage.setItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1, "invalid-json");

    expect(migrateLegacyAdvancedSettings(storage)).toBeNull();
    expect(storage.getItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1)).toBeNull();
    expect(storage.getItem(ADVANCED_SETTINGS_STORAGE_KEY)).toBe(null);
  });

  it("migrates legacy v1 data over existing v2 data", () => {
    storage.setItem(
      ADVANCED_SETTINGS_STORAGE_KEY,
      JSON.stringify({ minItemLevel: 65 }),
    );
    storage.setItem(
      LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
      JSON.stringify({ minItemLevel: LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1 }),
    );

    const migrated = migrateLegacyAdvancedSettings(storage);

    expect(migrated!.minItemLevel).toBe(MIN_ITEM_LEVEL_RANGE.max);
    expect(
      JSON.parse(storage.getItem(ADVANCED_SETTINGS_STORAGE_KEY)!).minItemLevel,
    ).toBe(MIN_ITEM_LEVEL_RANGE.max);
    expect(storage.getItem(LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1)).toBeNull();
  });
});
