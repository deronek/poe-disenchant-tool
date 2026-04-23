import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("external API error handling", () => {
  it("throws structured prices error for non-200 responses", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-server");

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
    });
  });

  it("returns build-time empty prices data when upstream fails", async () => {
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
        used_build_fallback: true,
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
    expect(data.error).toMatchObject({
      name: "ExternalApiError",
      source: "currency",
      kind: "network",
    });
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
    expect(data.error).toBeNull();
    expect(context.fallback_activated).toBe(false);
  });
});
