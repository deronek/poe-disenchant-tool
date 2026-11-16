import type { AppTable } from "@/lib/table-features";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Store } from "@tanstack/react-store";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { RangeFilter } from "@/components/filters/range-filter";
import { COLUMN_IDS } from "@/lib/column-ids";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function renderRangeFilter(range: { min?: number; max?: number }) {
  const columnFilters = new Store<ColumnFiltersState>([
    { id: COLUMN_IDS.CHAOS, value: range },
  ]);
  const setFilterValue = vi.fn();

  const table = {
    atoms: { columnFilters },
    getColumn: () => ({ setFilterValue }),
  } as unknown as AppTable;

  render(
    <RangeFilter
      table={table}
      columnId={COLUMN_IDS.CHAOS}
      min={0.01}
      max={500}
      step={1}
      precision={2}
      title="Price"
    />,
  );

  return { setFilterValue };
}

describe("RangeFilter keyboard handling", () => {
  afterEach(cleanup);

  it.each([
    { start: 1, expected: 0.9 },
    { start: 0.1, expected: 0.09 },
  ])(
    "decrements the lower bound from $start to $expected",
    ({ start, expected }) => {
      const { setFilterValue } = renderRangeFilter({ min: start });

      fireEvent.keyDown(
        screen.getByRole("slider", { name: "Lower bound price filter" }),
        { key: "ArrowLeft" },
      );

      expect(setFilterValue).toHaveBeenCalledTimes(1);
      expect(setFilterValue).toHaveBeenLastCalledWith({ min: expected });
    },
  );

  it("increments the upper bound toward the max", () => {
    const { setFilterValue } = renderRangeFilter({ max: 5 });

    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Upper bound price filter" }),
      { key: "ArrowRight" },
    );

    expect(setFilterValue).toHaveBeenCalledTimes(1);
    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 6 });
  });
});

describe("RangeFilter lower bound reset", () => {
  afterEach(cleanup);

  it("keeps a persisted zero maximum when clearing the lower bound", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.5, max: 0 });

    fireEvent.click(
      screen.getByRole("button", { name: "Clear lower bound price filter" }),
    );

    expect(setFilterValue).toHaveBeenCalledTimes(1);
    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 0 });
  });
});
