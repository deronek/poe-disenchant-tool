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
import { TabbedFilter } from "@/components/filters/tabbed-filter";
import { Slider } from "@/components/ui/slider";

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

afterEach(cleanup);

function createFilterTable(filters: ColumnFiltersState) {
  const columnFilters = new Store<ColumnFiltersState>(filters);
  const setFilterValue = vi.fn();

  const table = {
    atoms: { columnFilters },
    getColumn: () => ({ setFilterValue }),
  } as unknown as AppTable;

  return { table, setFilterValue };
}

function renderRangeFilter(
  range: { min?: number; max?: number },
  field: keyof typeof RANGE_FILTER_FIELD_CONFIGS = "price",
) {
  const config = RANGE_FILTER_FIELD_CONFIGS[field];
  const { table, setFilterValue } = createFilterTable([
    { id: config.columnId, value: range },
  ]);

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

describe("RangeFilter keyboard handling", () => {
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

  it("keeps the upper bound at or above the lower bound after rounding", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.24, max: 0.3 });

    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Upper bound price filter" }),
      { key: "ArrowLeft" },
    );

    expect(setFilterValue).toHaveBeenLastCalledWith({ min: 0.24, max: 0.24 });
  });

  it("keeps the lower bound at or below the upper bound after rounding", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.2, max: 0.26 });

    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Lower bound price filter" }),
      { key: "ArrowRight" },
    );

    expect(setFilterValue).toHaveBeenLastCalledWith({ min: 0.26, max: 0.26 });
  });

  it("increments the upper bound toward the max", () => {
    const { setFilterValue } = renderRangeFilter({ max: 5 });

    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Upper bound price filter" }),
      { key: "ArrowRight" },
    );

    expect(setFilterValue).toHaveBeenCalledTimes(1);
    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 6 });
  });

  it.each([
    { key: "PageUp", shiftKey: false, start: 2, expected: 12 },
    { key: "PageDown", shiftKey: false, start: 1, expected: 0.01 },
    { key: "ArrowUp", shiftKey: true, start: 0.03, expected: 0.1 },
    { key: "ArrowDown", shiftKey: true, start: 0.09, expected: 0.01 },
  ])(
    "applies $key (shift: $shiftKey) from $start",
    ({ key, shiftKey, start, expected }) => {
      const { setFilterValue } = renderRangeFilter({ max: start });

      fireEvent.keyDown(
        screen.getByRole("slider", { name: "Upper bound price filter" }),
        { key, shiftKey },
      );

      expect(setFilterValue).toHaveBeenCalledExactlyOnceWith({ max: expected });
    },
  );

  it("clears the maximum with End while preserving the fractional minimum", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.04, max: 0.5 });

    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Upper bound price filter" }),
      { key: "End" },
    );

    expect(setFilterValue).toHaveBeenCalledExactlyOnceWith({ min: 0.04 });
  });

  it("sets the minimum to the active fractional maximum with End", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.04, max: 0.25 });

    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Lower bound price filter" }),
      { key: "End" },
    );

    expect(setFilterValue).toHaveBeenCalledExactlyOnceWith({
      min: 0.25,
      max: 0.25,
    });
  });

  it("lets the user increase a persisted zero maximum to the price floor", () => {
    const { setFilterValue } = renderRangeFilter({ max: 0 });
    const upperThumb = screen.getByRole("slider", {
      name: "Upper bound price filter",
    });

    expect(upperThumb.getAttribute("aria-valuenow")).toBe("0");
    fireEvent.keyDown(upperThumb, { key: "ArrowUp" });

    expect(setFilterValue).toHaveBeenCalledExactlyOnceWith({ max: 0.01 });
  });

  it("maps a fractional maximum onto the slider scale", () => {
    renderRangeFilter({ max: 0.5 });
    const thumb = screen.getByRole("slider", {
      name: "Upper bound price filter",
    });

    expect(thumb.getAttribute("aria-valuenow")).toBe("8.49");
    expect(thumb.getAttribute("aria-valuetext")).toBe("0.5");
  });

  it("commits an integer maximum between tenth-position steps", () => {
    const { setFilterValue } = renderRangeFilter({ max: 200 });
    const thumb = screen.getByRole("slider", {
      name: "Upper bound price filter",
    });
    const slider = thumb.closest('[data-slot="slider"]')!;
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 100,
    } as DOMRect);
    slider.setPointerCapture = vi.fn();

    fireEvent(
      slider,
      new MouseEvent("pointerdown", { bubbles: true, clientX: 82.85 }),
    );

    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 153 });
  });
});

describe("RangeFilter whole-number keyboard handling", () => {
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

describe("RangeFilter lower bound reset", () => {
  it("keeps a persisted zero maximum when clearing the lower bound", () => {
    const { setFilterValue } = renderRangeFilter({ min: 0.5, max: 0 });

    fireEvent.click(
      screen.getByRole("button", { name: "Clear lower bound price filter" }),
    );

    expect(setFilterValue).toHaveBeenCalledTimes(1);
    expect(setFilterValue).toHaveBeenLastCalledWith({ max: 0 });
  });
});

describe("TabbedFilter price controls", () => {
  it("announces unset bounds and starts the minimum at hundredth-chaos steps", () => {
    const { table, setFilterValue } = createFilterTable([]);
    render(<TabbedFilter table={table} />);
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));

    const lowerThumb = screen.getByRole("slider", {
      name: "Lower bound price filter",
    });
    const upperThumb = screen.getByRole("slider", {
      name: "Upper bound price filter",
    });
    expect(lowerThumb.getAttribute("aria-valuetext")).toBe("No limit");
    expect(upperThumb.getAttribute("aria-valuetext")).toBe("No limit");

    fireEvent.keyDown(lowerThumb, { key: "ArrowRight" });

    expect(setFilterValue).toHaveBeenCalledExactlyOnceWith({ min: 0.02 });
  });
});

describe("Slider accessibility", () => {
  it("makes the referenced label and description available on the slider thumb", () => {
    render(
      <>
        <span id="slider-label">Budget</span>
        <span id="slider-description">Choose a maximum price.</span>
        <Slider
          defaultValue={[25]}
          aria-labelledby="slider-label"
          aria-describedby="slider-description"
        />
      </>,
    );

    expect(
      screen.getByRole("slider", {
        name: "Budget",
        description: "Choose a maximum price.",
      }),
    ).toBeDefined();
  });
});
