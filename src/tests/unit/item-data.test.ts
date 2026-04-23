import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

const emitWideEvent = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/axiom/server", () => ({
  emitWideEvent,
  normalizeError: (error: unknown) =>
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) },
}));

vi.mock("@/lib/dust", () => ({
  getDustData: () => [
    {
      name: "Known Item",
      slots: 2,
      goldCost: 100,
      dustValIlvl84: 50,
      dustValIlvl84Q20: 80,
    },
  ],
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.resetModules();
});

describe("item data wide event logging", () => {
  it("emits one canonical event on success with embedded prices and currency context", async () => {
    vi.doMock("@/lib/prices", () => ({
      getPriceData: vi.fn().mockResolvedValue({
        items: [
          {
            type: "UniqueWeapon",
            name: "Known Item",
            chaos: 10,
            divine: 0.05,
            baseType: "Base",
            icon: "https://example.com/item.png",
            listingCount: 5,
            itemType: "Weapon",
          },
          {
            type: "UniqueWeapon",
            name: "Missing Dust Item",
            chaos: 12,
            divine: 0.06,
            baseType: "Base",
            icon: "https://example.com/item-2.png",
            listingCount: 3,
            itemType: "Weapon",
          },
        ],
        context: {
          source: "poe_ninja",
          types_requested: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          types_completed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          resources_failed: [],
          line_counts_by_resource: { UniqueWeapon: 2 },
          status_codes_by_resource: { UniqueWeapon: 200 },
          item_count: 2,
          used_build_fallback: false,
        },
      }),
      getCurrencyData: vi.fn().mockResolvedValue({
        data: {
          catalyst: { id: "abrasive-catalyst", primaryValue: 2 },
          divineRate: 0.005,
          error: null,
        },
        context: {
          source: "poe_ninja",
          status_code: 200,
          has_catalyst: true,
          has_divine_rate: true,
          fallback_activated: false,
        },
      }),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    const result = await getItems("standard");

    expect(result.items).toHaveLength(1);
    expect(emitWideEvent).toHaveBeenCalledTimes(1);
    expect(emitWideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "item_data_fetch",
        outcome: "success",
        item_count: 1,
        missing_dust_count: 1,
        missing_dust_examples: ["Missing Dust Item"],
        prices: expect.objectContaining({
          source: "poe_ninja",
          item_count: 2,
        }),
        currency: expect.objectContaining({
          source: "poe_ninja",
          fallback_activated: false,
        }),
      }),
    );
  });

  it("emits one canonical event before rethrowing upstream price errors", async () => {
    vi.doMock("@/lib/prices", () => ({
      getPriceData: vi.fn().mockRejectedValue(new Error("prices down")),
      getCurrencyData: vi.fn().mockResolvedValue({
        data: {
          catalyst: null,
          divineRate: null,
          error: null,
        },
        context: {
          source: "poe_ninja",
          fallback_activated: true,
          has_catalyst: false,
          has_divine_rate: false,
        },
      }),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    await expect(getItems("standard")).rejects.toThrow("prices down");
    expect(emitWideEvent).toHaveBeenCalledTimes(1);
    expect(emitWideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "item_data_fetch",
        outcome: "error",
        error: expect.objectContaining({
          message: "prices down",
        }),
      }),
    );
  });
});
