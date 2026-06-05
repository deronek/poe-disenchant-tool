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
          errors_by_resource: {
            UniqueWeapon: {
              source: "prices",
              league: "standard",
              resource: "UniqueWeapon",
              kind: "http",
              status_code: 503,
            },
            UniqueArmour: {
              source: "prices",
              league: "standard",
              resource: "UniqueArmour",
              kind: "http",
              status_code: 503,
            },
            UniqueAccessory: {
              source: "prices",
              league: "standard",
              resource: "UniqueAccessory",
              kind: "http",
              status_code: 503,
            },
          },
          item_count: 0,
          used_build_fallback: false,
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
          status_codes_by_resource: {
            UniqueWeapon: 200,
            UniqueArmour: 200,
            UniqueAccessory: 200,
          },
          errors_by_resource: {
            UniqueWeapon: {
              source: "prices",
              league: "standard",
              resource: "UniqueWeapon",
              kind: "schema",
            },
            UniqueArmour: {
              source: "prices",
              league: "standard",
              resource: "UniqueArmour",
              kind: "schema",
            },
            UniqueAccessory: {
              source: "prices",
              league: "standard",
              resource: "UniqueAccessory",
              kind: "schema",
            },
          },
          item_count: 0,
          used_build_fallback: false,
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
        errors_by_resource: {
          UniqueWeapon: {
            source: "prices",
            league: "standard",
            resource: "UniqueWeapon",
            kind: "http",
            status_code: 503,
          },
          UniqueArmour: {
            source: "prices",
            league: "standard",
            resource: "UniqueArmour",
            kind: "http",
            status_code: 503,
          },
          UniqueAccessory: {
            source: "prices",
            league: "standard",
            resource: "UniqueAccessory",
            kind: "http",
            status_code: 503,
          },
        },
        item_count: 0,
        used_build_fallback: true,
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
        errors_by_resource: {
          UniqueArmour: {
            source: "prices",
            league: "standard",
            resource: "UniqueArmour",
            kind: "http",
            status_code: 503,
          },
        },
        item_count: 2,
        used_build_fallback: false,
      },
    });
  });

  it("returns development price context with an explicit empty status-code map", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");

    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const { getPriceData } = await import("@/lib/prices/prices");

    await expect(getPriceData("standard")).resolves.toMatchObject({
      items: expect.any(Array),
      context: {
        source: "poe.ninja",
        types_requested: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
        types_completed: ["UniqueWeapon", "UniqueArmour", "UniqueAccessory"],
        resources_failed: [],
        line_counts_by_resource: {
          UniqueWeapon: expect.any(Number),
          UniqueArmour: expect.any(Number),
          UniqueAccessory: expect.any(Number),
        },
        status_codes_by_resource: {},
        errors_by_resource: {},
        item_count: expect.any(Number),
        used_build_fallback: false,
      },
    });

    expect(fetch).not.toHaveBeenCalled();
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
    expect(context.fetch_failed).toBe(true);
    expect(context.status_code).toBeUndefined();
  });

  it("classifies malformed currency JSON as schema failure with preserved status", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token <")),
      }),
    );

    const { getCurrencyData } = await import("@/lib/prices/currency");

    const { data, context } = await getCurrencyData("standard");

    expect(data.catalyst).toBeNull();
    expect(data.divineRate).toBeNull();
    expect(context).toMatchObject({
      fetch_failed: true,
      status_code: 200,
      has_catalyst: false,
      has_divine_rate: false,
      error: expect.objectContaining({
        source: "currency",
        kind: "schema",
        status_code: 200,
        message: "Malformed JSON for currency payload for Standard",
      }),
    });
  });

  it("keeps currency success but marks missing divine rate", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
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
    expect(context.fetch_failed).toBe(false);
    expect(context.status_code).toBe(200);
  });
});
