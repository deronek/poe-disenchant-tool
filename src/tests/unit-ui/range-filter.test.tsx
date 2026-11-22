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
import { RANGE_FILTER_FIELD_CONFIGS } from "@/components/filters/range-filter-fields";

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

function renderRangeFilter(
  range: { min?: number; max?: number },
  field: keyof typeof RANGE_FILTER_FIELD_CONFIGS = "price",
) {
  const config = RANGE_FILTER_FIELD_CONFIGS[field];
  const columnFilters = new Store<ColumnFiltersState>([
    { id: config.columnId, value: range },
  ]);
  const setFilterValue = vi.fn();

  const table = {
    atoms: { columnFilters },
    getColumn: () => ({ setFilterValue }),
  } as unknown as AppTable;

  render(
    <RangeFilter
      table={table}
      columnId={config.columnId}
      min={config.bounds.min}
      max={config.bounds.max}
      step={config.step}
      precision={config.precision}
      title={config.title}
    />,
  );

  return { setFilterValue };
}

function pointAtSlider(name: string, clientX: number) {
  const thumb = screen.getByRole("slider", { name });
  const slider = thumb.closest('[data-slot="slider"]')!;
  vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
    left: 0,
    width: 100,
  } as DOMRect);
  slider.setPointerCapture = vi.fn();

  fireEvent(slider, new MouseEvent("pointerdown", { bubbles: true, clientX }));
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

  it("maps a fractional maximum onto the slider scale", () => {
    renderRangeFilter({ max: 0.5 });
    const thumb = screen.getByRole("slider", {
      name: "Upper bound price filter",
    });

    expect(thumb.getAttribute("aria-valuenow")).toBe("8.49");
    expect(thumb.getAttribute("aria-valuetext")).toBe("0.5");
  });
});

describe("RangeFilter pointer handling", () => {
  afterEach(cleanup);

  it.each([
    {
      bound: "Lower",
      clientX: 3.5,
      value: 0.05,
      expected: { min: 0.05, max: undefined },
    },
    {
      bound: "Lower",
      clientX: 8.5,
      value: 0.5,
      expected: { min: 0.5, max: undefined },
    },
    {
      bound: "Upper",
      clientX: 3.5,
      value: 0.05,
      expected: { min: undefined, max: 0.05 },
    },
    {
      bound: "Upper",
      clientX: 8.5,
      value: 0.5,
      expected: { min: undefined, max: 0.5 },
    },
  ])("commits $value for the $bound bound", ({ bound, clientX, expected }) => {
    const { setFilterValue } = renderRangeFilter({});

    pointAtSlider(`${bound} bound price filter`, clientX);

    expect(setFilterValue).toHaveBeenLastCalledWith(expected);
  });

  it("commits an integer maximum between tenth-position steps", () => {
    const { setFilterValue } = renderRangeFilter({ max: 200 });

    pointAtSlider("Upper bound price filter", 82.85);

    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 153 });
  });
});

describe("RangeFilter whole-number keyboard handling", () => {
  afterEach(cleanup);

  it.each([
    {
      field: "dust" as const,
      range: { min: 2_000 },
      label: "Lower bound dust value filter",
      expected: { min: 2_163 },
    },
    {
      field: "gold" as const,
      range: { min: 1_500 },
      label: "Lower bound gold fee filter",
      expected: { min: 1_561 },
    },
    {
      field: "dust" as const,
      range: { max: 5_000_000 },
      label: "Upper bound dust value filter",
      expected: { max: 4_952_000 },
    },
    {
      field: "gold" as const,
      range: { max: 80_000 },
      label: "Upper bound gold fee filter",
      expected: { max: 79_500 },
    },
  ])(
    "uses the pointer scale for $label",
    ({ field, range, label, expected }) => {
      const { setFilterValue } = renderRangeFilter(range, field);

      fireEvent.keyDown(screen.getByRole("slider", { name: label }), {
        key: label.startsWith("Lower") ? "ArrowRight" : "ArrowLeft",
      });

      expect(setFilterValue).toHaveBeenCalledTimes(1);
      expect(setFilterValue).toHaveBeenLastCalledWith(expected);
    },
  );
});

describe("RangeFilter persisted ranges", () => {
  afterEach(cleanup);

  it("clamps a whole-number upper slider to its effective maximum", () => {
    renderRangeFilter({ max: 0 }, "dust");
    const thumb = screen.getByRole("slider", {
      name: "Upper bound dust value filter",
    });

    expect(thumb.getAttribute("aria-valuenow")).toBe("2000");
    expect(thumb.getAttribute("aria-valuetext")).toBe("0");
  });

  it("keeps the unlimited upper bound at the top when the lower bound is maximal", () => {
    renderRangeFilter({ min: 500 });
    const thumb = screen.getByRole("slider", {
      name: "Upper bound price filter",
    });

    expect(thumb.getAttribute("aria-valuenow")).toBe("100");
    expect(thumb.getAttribute("aria-valuetext")).toBe("No limit");
  });

  it("keeps a persisted zero maximum when clearing the lower bound", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.5, max: 0 });

    fireEvent.click(
      screen.getByRole("button", { name: "Clear lower bound price filter" }),
    );

    expect(setFilterValue).toHaveBeenCalledTimes(1);
    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 0 });
  });
});
