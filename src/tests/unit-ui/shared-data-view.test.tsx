import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SharedDataView } from "@/components/shared-data-view";

vi.mock("@/components/data-table", () => ({
  createColumns: () => [],
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock("@/lib/use-local-storage", () => ({
  useLocalStorage: (value: unknown) => [value, vi.fn()],
}));

describe("SharedDataView", () => {
  it("renders a degraded currency notice when fallback values are active", () => {
    render(
      <SharedDataView
        items={[]}
        league="standard"
        lowStockThreshold={1}
        divinePriceThreshold={null}
        dataStatus={{
          currency: {
            usedDefaultCatalystPrice: true,
            error: "Failed to fetch currency data for Standard",
          },
        }}
      />,
    );

    expect(screen.getByText("Currency data is degraded")).toBeTruthy();
    expect(screen.getByText(/default 1c fallback price/i)).toBeTruthy();
    expect(
      screen.getByText(/divine price display is unavailable/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/create an issue on the app's github/i),
    ).toBeTruthy();
  });
});
