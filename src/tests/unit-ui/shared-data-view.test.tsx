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
  it("renders the data table", () => {
    render(
      <SharedDataView
        items={[]}
        league="standard"
        lowStockThreshold={1}
        divinePriceThreshold={null}
      />,
    );

    expect(screen.getByTestId("data-table")).toBeTruthy();
  });
});
