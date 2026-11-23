import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getItemsMock } = vi.hoisted(() => ({ getItemsMock: vi.fn() }));

vi.mock("@/lib/utils-server", () => ({
  get isBuildTime() {
    return process.env.NEXT_PHASE === "phase-production-build";
  },
}));
vi.mock("@/lib/item-data", () => ({ getItems: getItemsMock }));
vi.mock("@/components/last-updated", () => ({
  default: () => <div data-testid="last-updated" />,
}));
vi.mock("@/components/currency-data-status", () => ({
  CurrencyDataStatus: () => null,
}));
vi.mock("@/components/shared-data-view", () => ({
  SharedDataView: () => <div data-testid="item-table" />,
}));

const loadLeagueContentServer = async () =>
  (await import("@/app/[league]/league-content-server")).default;

const createExternalApiError = async (source: "prices" | "currency") => {
  const { ExternalApiError } = await import("@/lib/prices/external-api");
  return new ExternalApiError({
    source,
    league: "standard",
    resource: source === "prices" ? "all-types" : "Currency",
    kind: "network",
    message: `${source} unavailable`,
  });
};

describe("LeagueContentServer emergency prerender", () => {
  beforeEach(() => {
    vi.resetModules();
    getItemsMock.mockReset();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders the outage page for an allowed build-time price failure", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("ALLOW_UNAVAILABLE_PRERENDER", "1");
    getItemsMock.mockRejectedValue(await createExternalApiError("prices"));
    const LeagueContentServer = await loadLeagueContentServer();

    const { container } = render(
      await LeagueContentServer({ league: "standard" }),
    );

    expect(screen.getByText("Price data unavailable")).toBeTruthy();
    expect(screen.queryByTestId("item-table")).toBeNull();
    expect(screen.queryByTestId("last-updated")).toBeNull();
    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).toBeNull();
  });

  it("fails a normal build when prices are unavailable", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const error = await createExternalApiError("prices");
    getItemsMock.mockRejectedValue(error);
    const LeagueContentServer = await loadLeagueContentServer();

    await expect(LeagueContentServer({ league: "standard" })).rejects.toBe(
      error,
    );
  });

  it("rethrows price failures during runtime even with the override", async () => {
    vi.stubEnv("ALLOW_UNAVAILABLE_PRERENDER", "1");
    const error = await createExternalApiError("prices");
    getItemsMock.mockRejectedValue(error);
    const LeagueContentServer = await loadLeagueContentServer();

    await expect(LeagueContentServer({ league: "standard" })).rejects.toBe(
      error,
    );
  });

  it.each(["currency", "unexpected"] as const)(
    "does not hide %s failures behind the emergency page",
    async (failure) => {
      vi.stubEnv("NEXT_PHASE", "phase-production-build");
      vi.stubEnv("ALLOW_UNAVAILABLE_PRERENDER", "1");
      const error =
        failure === "currency"
          ? await createExternalApiError("currency")
          : new Error("unexpected build failure");
      getItemsMock.mockRejectedValue(error);
      const LeagueContentServer = await loadLeagueContentServer();

      await expect(LeagueContentServer({ league: "standard" })).rejects.toBe(
        error,
      );
    },
  );

  it("renders item data normally when the fetch succeeds", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("ALLOW_UNAVAILABLE_PRERENDER", "1");
    getItemsMock.mockResolvedValue({
      items: [],
      lastUpdated: 0,
      lowStockThreshold: 1,
      divinePriceThreshold: 200,
      dataStatus: {
        currency: {
          usedDefaultCatalystPrice: false,
          usedDefaultDivineRate: false,
        },
      },
    });
    const LeagueContentServer = await loadLeagueContentServer();

    render(await LeagueContentServer({ league: "standard" }));

    expect(screen.getByTestId("item-table")).toBeTruthy();
    expect(screen.getByTestId("last-updated")).toBeTruthy();
    expect(screen.queryByText("Price data unavailable")).toBeNull();
  });
});
