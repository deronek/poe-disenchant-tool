import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

// prices/currency read NODE_ENV and NEXT_PHASE at import time via utils-server,
// so each test needs a fresh module graph after stubbing env vars.

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("external API error handling", () => {
  it("throws structured prices error for non-200 responses", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    const { getPriceData } = await import("@/lib/prices/prices");

    await expect(getPriceData("standard")).rejects.toMatchObject({
      name: "ExternalApiError",
      source: "prices",
      kind: "http",
      status: 503,
      context: {
        prices: {
          source: "poe.ninja",
          types_requested: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          types_completed: [],
          resources_failed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          line_counts_by_resource: {
            UniqueWeapon: 0,
            UniqueArmour: 0,
            UniqueAccessory: 0,
          },
          status_codes_by_resource: {
            UniqueWeapon: 503,
            UniqueArmour: 503,
            UniqueAccessory: 503,
          },
          item_count: 0,
          used_build_fallback: false,
          error: {
            source: "prices",
            league: "standard",
            resource: "UniqueWeapon",
            kind: "http",
            status_code: 503,
          },
        },
      },
    });
  });

  it("throws structured prices error for schema failures with preserved context", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ lines: [{ bad: "payload" }] }),
      }),
    );

    const { getPriceData } = await import("@/lib/prices/prices");

    await expect(getPriceData("standard")).rejects.toMatchObject({
      name: "ExternalApiError",
      source: "prices",
      kind: "schema",
      context: {
        prices: {
          source: "poe.ninja",
          types_requested: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          types_completed: [],
          resources_failed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
          line_counts_by_resource: {
            UniqueWeapon: 0,
            UniqueArmour: 0,
            UniqueAccessory: 0,
          },
          status_codes_by_resource: {},
          item_count: 0,
          used_build_fallback: false,
          error: {
            source: "prices",
            league: "standard",
            resource: "UniqueWeapon",
            kind: "schema",
          },
        },
      },
    });
  });

  it("returns empty build-time data with enriched failure context when upstream fails", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    const { getPriceData } = await import("@/lib/prices/prices");

    await expect(getPriceData("standard")).resolves.toMatchObject({
      items: [],
      context: {
        source: "poe.ninja",
        types_completed: [],
        resources_failed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
        line_counts_by_resource: {
          UniqueWeapon: 0,
          UniqueArmour: 0,
          UniqueAccessory: 0,
        },
        status_codes_by_resource: {
          UniqueWeapon: 503,
          UniqueArmour: 503,
          UniqueAccessory: 503,
        },
        item_count: 0,
        used_build_fallback: true,
        error: {
          source: "prices",
          league: "standard",
          resource: "UniqueWeapon",
          kind: "http",
          status_code: 503,
        },
      },
    });
  });

  it("returns partial build-time data with preserved aggregate failure context", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          lines: [
            {
              name: "Item One",
              chaosValue: 10,
              divineValue: 0.05,
              baseType: "Base",
              icon: "https://example.com/item.png",
              listingCount: 5,
              detailsId: "item-one",
              itemType: "Weapon",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          lines: [
            {
              name: "Item Two",
              chaosValue: 15,
              divineValue: 0.075,
              baseType: "Base",
              icon: "https://example.com/item-2.png",
              listingCount: 7,
              detailsId: "item-two",
              itemType: "Accessory",
            },
          ],
        }),
      });

    vi.stubGlobal("fetch", fetch);

    const { getPriceData } = await import("@/lib/prices/prices");

    await expect(getPriceData("standard")).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ name: "Item One" }),
        expect.objectContaining({ name: "Item Two" }),
      ]),
      context: {
        source: "poe.ninja",
        types_completed: ["UniqueWeapon", "UniqueAccessory"],
        resources_failed: ["UniqueArmour"],
        line_counts_by_resource: {
          UniqueWeapon: 1,
          UniqueArmour: 0,
          UniqueAccessory: 1,
        },
        status_codes_by_resource: {
          UniqueWeapon: 200,
          UniqueArmour: 503,
          UniqueAccessory: 200,
        },
        item_count: 2,
        used_build_fallback: false,
        error: {
          source: "prices",
          league: "standard",
          resource: "UniqueArmour",
          kind: "http",
          status_code: 503,
        },
      },
    });
  });

  it("returns degraded currency status with fallback defaults", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const { getCurrencyData } = await import("@/lib/prices/currency");

    const { data, context } = await getCurrencyData("standard");

    expect(data.catalyst).toBeNull();
    expect(data.divineRate).toBeNull();
    expect(context.fallback_activated).toBe(true);
  });

  it("keeps currency success but marks missing divine rate", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          lines: [{ id: "abrasive-catalyst", primaryValue: 2 }],
          core: { rates: {} },
        }),
      }),
    );

    const { getCurrencyData } = await import("@/lib/prices/currency");

    const { data, context } = await getCurrencyData("standard");

    expect(data.catalyst).toEqual({ id: "abrasive-catalyst", primaryValue: 2 });
    expect(data.divineRate).toBeNull();
    expect(context.fallback_activated).toBe(false);
  });
});
