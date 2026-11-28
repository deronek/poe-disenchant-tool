import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));
vi.mock("next/server", () => ({
  after: (task: Promise<unknown> | (() => unknown)) => {
    if (typeof task === "function") {
      return task();
    }

    return task;
  },
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
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.resetModules();
});

describe("item data wide event logging", () => {
  it("keeps successful item data responses when telemetry emission fails", async () => {
    emitWideEvent.mockRejectedValueOnce(new Error("telemetry down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

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
        ],
        context: {
          source: "poe_ninja",
          types_requested: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          types_completed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          resources_failed: [],
          line_counts_by_resource: { UniqueWeapon: 1 },
          status_codes_by_resource: { UniqueWeapon: 200 },
          item_count: 1,
        },
      }),
      getCurrencyData: vi.fn().mockResolvedValue({
        data: {
          catalyst: { id: "abrasive-catalyst", primaryValue: 2 },
          divineRate: 0.005,
        },
        context: {
          source: "poe_ninja",
          status_code: 200,
          fetch_failed: false,
          has_catalyst: true,
          has_divine_rate: true,
        },
      }),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    await expect(getItems("standard")).resolves.toMatchObject({
      items: [expect.objectContaining({ name: "Known Item" })],
    });
    expect(emitWideEvent).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to emit item_data_fetch telemetry",
      expect.objectContaining({ message: "telemetry down" }),
      expect.objectContaining({
        event_name: "item_data_fetch",
        league: "standard",
        outcome: "success",
      }),
    );
  });

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
        },
      }),
      getCurrencyData: vi.fn().mockResolvedValue({
        data: {
          catalyst: { id: "abrasive-catalyst", primaryValue: 2 },
          divineRate: 0.005,
        },
        context: {
          source: "poe_ninja",
          status_code: 200,
          fetch_failed: false,
          has_catalyst: true,
          has_divine_rate: true,
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
        item_data: expect.objectContaining({
          item_count: 1,
          missing_dust_count: 1,
          missing_dust_examples: ["Missing Dust Item"],
        }),
        prices: expect.objectContaining({
          source: "poe_ninja",
          item_count: 2,
        }),
        currency: expect.objectContaining({
          source: "poe_ninja",
          fetch_failed: false,
        }),
      }),
    );
  });

  it("returns partial item data and emits a degraded event with resource errors", async () => {
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
        ],
        context: {
          source: "poe.ninja",
          types_completed: ["UniqueWeapon", "UniqueAccessory"],
          resources_failed: ["UniqueArmour"],
          errors_by_resource: {
            UniqueArmour: {
              source: "prices",
              league: "standard",
              resource: "UniqueArmour",
              kind: "http",
              status_code: 503,
              message: "armour prices down",
            },
          },
          item_count: 1,
        },
      }),
      getCurrencyData: vi.fn().mockResolvedValue({
        data: {
          catalyst: { id: "abrasive-catalyst", primaryValue: 2 },
          divineRate: 0.005,
        },
        context: {
          source: "poe.ninja",
          fetch_failed: false,
          has_catalyst: true,
          has_divine_rate: true,
        },
      }),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    await expect(getItems("standard")).resolves.toMatchObject({
      items: [expect.objectContaining({ name: "Known Item" })],
    });
    expect(emitWideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "item_data_fetch",
        outcome: "degraded",
        message: "Item data fetch completed with errors",
        prices: expect.objectContaining({
          resources_failed: ["UniqueArmour"],
          errors_by_resource: expect.objectContaining({
            UniqueArmour: expect.objectContaining({ kind: "http" }),
          }),
        }),
      }),
    );
  });

  it("emits one canonical event with price error context and degraded currency context", async () => {
    emitWideEvent.mockRejectedValueOnce(new Error("telemetry down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { ExternalApiError } = await import("@/lib/prices/external-api");

    vi.doMock("@/lib/prices", () => ({
      getPriceData: vi.fn().mockRejectedValue(
        new ExternalApiError({
          source: "prices",
          league: "standard",
          resource: "UniqueWeapon",
          kind: "http",
          message: "prices down",
          status: 503,
          context: {
            prices: {
              source: "poe.ninja",
              types_requested: ["UniqueWeapon"],
              types_completed: [],
              resources_failed: ["UniqueWeapon"],
              line_counts_by_resource: { UniqueWeapon: 0 },
              status_codes_by_resource: { UniqueWeapon: 503 },
              errors_by_resource: {
                UniqueWeapon: {
                  source: "prices",
                  league: "standard",
                  resource: "UniqueWeapon",
                  kind: "http",
                  status_code: 503,
                  message: "prices down",
                },
              },
              item_count: 0,
            },
          },
        }),
      ),
      getCurrencyData: vi.fn().mockResolvedValue({
        data: {
          catalyst: null,
          divineRate: null,
        },
        context: {
          source: "poe_ninja",
          fetch_failed: true,
          has_catalyst: false,
          has_divine_rate: false,
        },
      }),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    await expect(getItems("standard")).rejects.toThrow("prices down");
    expect(emitWideEvent).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to emit item_data_fetch telemetry",
      expect.objectContaining({ message: "telemetry down" }),
      expect.objectContaining({
        event_name: "item_data_fetch",
        league: "standard",
        outcome: "error",
      }),
    );
    expect(emitWideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "item_data_fetch",
        outcome: "error",
        prices: expect.objectContaining({
          source: "poe.ninja",
          resources_failed: ["UniqueWeapon"],
          status_codes_by_resource: { UniqueWeapon: 503 },
          item_count: 0,
        }),
        currency: expect.objectContaining({
          source: "poe_ninja",
          fetch_failed: true,
        }),
        error: expect.objectContaining({
          message: "prices down",
        }),
      }),
    );
  });

  it("emits one canonical event before rethrowing upstream currency errors", async () => {
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
        ],
        context: {
          source: "poe_ninja",
          types_requested: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          types_completed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          resources_failed: [],
          line_counts_by_resource: { UniqueWeapon: 1 },
          status_codes_by_resource: { UniqueWeapon: 200 },
          item_count: 1,
        },
      }),
      getCurrencyData: vi.fn().mockRejectedValue(new Error("currency down")),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    await expect(getItems("standard")).rejects.toThrow("currency down");
    expect(emitWideEvent).toHaveBeenCalledTimes(1);
    expect(emitWideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "item_data_fetch",
        outcome: "error",
        prices: expect.objectContaining({
          source: "poe_ninja",
          item_count: 1,
        }),
        error: expect.objectContaining({
          message: "currency down",
        }),
      }),
    );
  });

  it("emits one canonical aggregate error when both upstream fetches fail", async () => {
    const { ExternalApiError } = await import("@/lib/prices/external-api");

    vi.doMock("@/lib/prices", () => ({
      getPriceData: vi.fn().mockRejectedValue(
        new ExternalApiError({
          source: "prices",
          league: "standard",
          resource: "UniqueWeapon",
          kind: "http",
          message: "prices down",
          status: 503,
          context: {
            prices: {
              source: "poe.ninja",
              types_requested: ["UniqueWeapon"],
              types_completed: [],
              resources_failed: ["UniqueWeapon"],
              line_counts_by_resource: { UniqueWeapon: 0 },
              status_codes_by_resource: { UniqueWeapon: 503 },
              errors_by_resource: {
                UniqueWeapon: {
                  source: "prices",
                  league: "standard",
                  resource: "UniqueWeapon",
                  kind: "http",
                  status_code: 503,
                  message: "prices down",
                },
              },
              item_count: 0,
            },
          },
        }),
      ),
      getCurrencyData: vi.fn().mockRejectedValue(
        new ExternalApiError({
          source: "currency",
          league: "standard",
          resource: "Currency",
          kind: "network",
          message: "currency down",
        }),
      ),
    }));

    const { getItems } = await import("@/lib/item-data/item-data");

    await expect(getItems("standard")).rejects.toThrow(
      "Item data fetch failed",
    );
    expect(emitWideEvent).toHaveBeenCalledTimes(1);
    expect(emitWideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "item_data_fetch",
        outcome: "error",
        error: expect.objectContaining({
          name: "AggregateError",
          message: "Item data fetch failed",
        }),
      }),
    );
  });
});
