/**
 * Testing Framework: Vitest
 * Testing Library: @testing-library/react (jsdom)
 *
 * If this project uses Jest instead of Vitest, replace vi.* with jest.*
 * and ensure the @testing-library/jest-dom setup is loaded via setupTests.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/* ------------------------------------------------------------------
   Mocks for external UI/deps referenced by the columns module
   These keep tests focused on column logic and DOM structure.
   Use { virtual: true } to avoid depending on tsconfig path aliases.
------------------------------------------------------------------- */

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...rest }: any) => (
    <button data-testid="Button" type="button" {...rest}>
      {children}
    </button>
  ),
}), { virtual: true });

vi.mock("@/components/ui/checkbox", () => ({
  // Toggle to opposite of incoming "checked" to simulate user click
  Checkbox: ({ checked = false, onCheckedChange, ...rest }: any) => (
    <input
      data-testid="Checkbox"
      type="checkbox"
      role="checkbox"
      aria-checked={!!checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...rest}
    />
  ),
}), { virtual: true });

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, ...rest }: any) => (
    <div data-testid="Tooltip" {...rest}>
      {children}
    </div>
  ),
  TooltipTrigger: ({ children, ...rest }: any) => (
    <button data-testid="TooltipTrigger" type="button" {...rest}>
      {children}
    </button>
  ),
  TooltipContent: ({ children, ...rest }: any) => (
    <div data-testid="TooltipContent" {...rest}>
      {children}
    </div>
  ),
}), { virtual: true });

vi.mock("lucide-react", () => ({
  ExternalLink: (props: any) => <svg data-testid="ExternalLinkIcon" {...props} />,
  Info: (props: any) => <svg data-testid="InfoIcon" {...props} />,
}));

vi.mock("./chaos-orb-icon", () => ({
  ChaosOrbIcon: () => <span data-testid="ChaosOrbIcon" />,
}));
vi.mock("./dust-icon", () => ({
  DustIcon: () => <span data-testid="DustIcon" />,
}));
vi.mock("./dust-info", () => ({
  DustInfo: () => <div data-testid="DustInfo">Dust info</div>,
}));
vi.mock("./item-marking-info", () => ({
  ItemMarkingInfo: () => <div data-testid="ItemMarkingInfo">Marking info</div>,
}));
vi.mock("./icon", () => ({
  Icon: ({ src, size, ...rest }: any) => (
    <img alt="" data-testid="Icon" data-src={src} data-size={size} {...rest} />
  ),
}));

// Spy-able trade link helper (virtual to avoid path alias resolution)
vi.mock("@/lib/tradeLink", () => ({
  createTradeLink: vi.fn(() => "https://example.test/trade?q=item"),
}), { virtual: true });

// Provide a stub for League export to satisfy potential runtime import
vi.mock("@/lib/leagues", () => ({ League: {} }), { virtual: true });

// Import after mocks so the module under test receives mocked deps
import { createColumns, COLUMN_IDS } from "./columns";
import { createTradeLink } from "@/lib/tradeLink";

/* ------------------------------------------------------------------ */

const renderCell = (column: any, row: any) => {
  const ui = column.cell!({ row } as any);
  return render(<>{ui as any}</>);
};

const renderHeader = (column: any) => {
  const h = column.header as any;
  if (typeof h === "function") {
    const ui = h({} as any);
    return render(<>{ui}</>);
  }
  if (React.isValidElement(h)) return render(h);
  return render(<span>{String(h)}</span>);
};

const findByAccessor = (columns: any[], key: string) =>
  columns.find((c) => c.accessorKey === key)!;

const findById = (columns: any[], id: string) =>
  columns.find((c) => c.id === id)!;

describe("createColumns", () => {
  const league: any = "Standard";
  const advancedSettings: any = { some: "setting" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines expected columns with ids, sizes, and sorting/hiding behavior", () => {
    const cols = createColumns(advancedSettings, league);

    // ICON column
    const iconCol = findByAccessor(cols, COLUMN_IDS.ICON);
    expect(iconCol).toBeTruthy();
    expect(iconCol.size).toBe(40);
    expect(iconCol.enableSorting).toBe(false);
    expect(iconCol.enableHiding).toBe(false);

    // NAME column
    const nameCol = findByAccessor(cols, COLUMN_IDS.NAME);
    expect(nameCol.header).toBe("Name");
    expect(nameCol.size).toBe(180);

    // CHAOS column
    const chaosCol = findByAccessor(cols, COLUMN_IDS.CHAOS);
    expect(chaosCol.meta?.className).toContain("text-right");
    expect(chaosCol.meta?.className).toContain("tabular-nums");

    // DUST PER CHAOS column
    const dpcCol = findByAccessor(cols, COLUMN_IDS.DUST_PER_CHAOS);
    expect(dpcCol.header).toBeInstanceOf(Function);
    expect(dpcCol.meta?.className).toContain("text-right");
    expect(dpcCol.meta?.className).toContain("after:w-px");

    // TRADE LINK column
    const linkCol = findById(cols, COLUMN_IDS.TRADE_LINK);
    expect(linkCol.header).toBe("Trade Link");
    expect(linkCol.enableSorting).toBe(false);

    // SELECT column
    const selectCol = findById(cols, COLUMN_IDS.SELECT);
    expect(selectCol.enableSorting).toBe(false);
    expect(selectCol.enableHiding).toBe(false);
  });

  it("filters NAME column by name and variant (case-insensitive) and passes for empty query", () => {
    const cols = createColumns(advancedSettings, league);
    const nameCol = findByAccessor(cols, COLUMN_IDS.NAME);
    const row = {
      getValue: (id: string) => (id === COLUMN_IDS.NAME ? "Stygian Vise" : ""),
      original: { variant: "Abyssal" },
    };

    // empty/whitespace
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, "")).toBe(true);
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, "   ")).toBe(true);
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, null)).toBe(true);
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, undefined)).toBe(true);

    // name match
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, "styg")).toBe(true);

    // variant match
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, "ABYSS")).toBe(true);

    // negative
    expect(nameCol.filterFn(row, COLUMN_IDS.NAME, "headhunter")).toBe(false);
  });

  it("filters CHAOS column with min/max boundaries", () => {
    const cols = createColumns(advancedSettings, league);
    const chaosCol = findByAccessor(cols, COLUMN_IDS.CHAOS);
    const makeRow = (val: number) => ({
      getValue: (id: string) => (id === COLUMN_IDS.CHAOS ? val : undefined),
    });

    // no filter
    expect(chaosCol.filterFn(makeRow(12), COLUMN_IDS.CHAOS, undefined)).toBe(true);

    // min only
    expect(chaosCol.filterFn(makeRow(12), COLUMN_IDS.CHAOS, { min: 10 })).toBe(true);
    expect(chaosCol.filterFn(makeRow(9), COLUMN_IDS.CHAOS, { min: 10 })).toBe(false);

    // max only
    expect(chaosCol.filterFn(makeRow(12), COLUMN_IDS.CHAOS, { max: 12 })).toBe(true);
    expect(chaosCol.filterFn(makeRow(13), COLUMN_IDS.CHAOS, { max: 12 })).toBe(false);

    // min and max
    expect(chaosCol.filterFn(makeRow(12), COLUMN_IDS.CHAOS, { min: 10, max: 20 })).toBe(true);
    expect(chaosCol.filterFn(makeRow(9), COLUMN_IDS.CHAOS, { min: 10, max: 20 })).toBe(false);
    expect(chaosCol.filterFn(makeRow(21), COLUMN_IDS.CHAOS, { min: 10, max: 20 })).toBe(false);
  });

  it("renders ICON cell with Icon component and props", () => {
    const cols = createColumns(advancedSettings, league);
    const iconCol = findByAccessor(cols, COLUMN_IDS.ICON);
    const row = {
      getValue: (id: string) => (id === COLUMN_IDS.ICON ? "/path/icon.png" : undefined),
    };
    renderCell(iconCol, row);
    const img = screen.getByTestId("Icon");
    expect(img.getAttribute("data-src")).toBe("/path/icon.png");
    expect(img.getAttribute("data-size")).toBe("36");
  });

  it("renders NAME cell with and without variant, including title attribute", () => {
    const cols = createColumns(advancedSettings, league);
    const nameCol = findByAccessor(cols, COLUMN_IDS.NAME);

    // With variant
    const row1 = {
      getValue: (id: string) => (id === COLUMN_IDS.NAME ? "One With Nothing" : ""),
      original: { variant: "Anomalous" },
    };
    const { rerender } = renderCell(nameCol, row1);
    expect(screen.getByText("One With Nothing")).toBeTruthy();
    expect(screen.getByText("Anomalous")).toBeTruthy();
    // The container div carries title "name — variant"
    expect(screen.getByTitle("One With Nothing — Anomalous")).toBeTruthy();

    // Without variant
    const row2 = {
      getValue: (id: string) => (id === COLUMN_IDS.NAME ? "Headhunter" : ""),
      original: {},
    };
    rerender(<>{(nameCol.cell!({ row: row2 } as any) as any)}</>);
    expect(screen.getByText("Headhunter")).toBeTruthy();
    expect(screen.getByTitle("Headhunter")).toBeTruthy();
  });

  it("renders CHAOS price cell with value and ChaosOrbIcon", () => {
    const cols = createColumns(advancedSettings, league);
    const col = findByAccessor(cols, COLUMN_IDS.CHAOS);
    const row = {
      getValue: (id: string) => (id === COLUMN_IDS.CHAOS ? 42 : undefined),
    };
    renderCell(col, row);
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByTestId("ChaosOrbIcon")).toBeTruthy();
  });

  it("renders CALCULATED_DUST_VALUE cell with DustIcon", () => {
    const cols = createColumns(advancedSettings, league);
    const col = findByAccessor(cols, COLUMN_IDS.CALCULATED_DUST_VALUE);
    const row = {
      getValue: (id: string) =>
        id === COLUMN_IDS.CALCULATED_DUST_VALUE ? 777 : undefined,
    };
    renderCell(col, row);
    expect(screen.getByText("777")).toBeTruthy();
    expect(screen.getByTestId("DustIcon")).toBeTruthy();
  });

  it("renders DUST_PER_CHAOS cell with both Dust and Chaos icons and separator", () => {
    const cols = createColumns(advancedSettings, league);
    const col = findByAccessor(cols, COLUMN_IDS.DUST_PER_CHAOS);
    const row = {
      getValue: (id: string) => (id === COLUMN_IDS.DUST_PER_CHAOS ? 3.14 : undefined),
    };
    renderCell(col, row);
    expect(screen.getByText("3.14")).toBeTruthy();
    expect(screen.getByTestId("DustIcon")).toBeTruthy();
    expect(screen.getByText("/")).toBeTruthy();
    expect(screen.getByTestId("ChaosOrbIcon")).toBeTruthy();
  });

  it("renders TRADE_LINK cell and calls createTradeLink with name, league, and advancedSettings", () => {
    const cols = createColumns(advancedSettings, league);
    const col = findById(cols, COLUMN_IDS.TRADE_LINK);
    const row = {
      getValue: (id: string) => (id === COLUMN_IDS.NAME ? "Abyss Jewel" : undefined),
    };

    renderCell(col, row);

    // Ensure helper was called correctly
    expect(createTradeLink).toHaveBeenCalledTimes(1);
    expect(createTradeLink).toHaveBeenCalledWith("Abyss Jewel", league, advancedSettings);

    // Anchor rendering and attributes
    const link = screen.getByRole("link", {
      name: "Open trade search for Abyss Jewel in new tab",
    });
    expect(link.getAttribute("href")).toBe("https://example.test/trade?q=item");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");

    // Button wrapper present
    expect(screen.getByTestId("Button")).toBeTruthy();
    expect(screen.getByTestId("ExternalLinkIcon")).toBeTruthy();
  });

  it("renders SELECT (Mark) cell and toggles selection via onCheckedChange mapping", () => {
    const cols = createColumns(advancedSettings, league);
    const col = findById(cols, COLUMN_IDS.SELECT);

    const toggleSelected = vi.fn();
    const row = {
      getValue: (id: string) => (id === COLUMN_IDS.NAME ? "Tabula Rasa" : undefined),
      getIsSelected: () => false,
      toggleSelected,
    };

    renderCell(col, row);

    const cb = screen.getByRole("checkbox", {
      name: "Mark Tabula Rasa as completed",
    });
    // Click will call onCheckedChange(!checked) => true => row.toggleSelected(true)
    fireEvent.click(cb);
    expect(toggleSelected).toHaveBeenCalledWith(true);
  });

  it("renders rich headers (Dust Value, Mark) with info icons and popover content", () => {
    const cols = createColumns(advancedSettings, league);

    // Dust Value header
    const dustCol = findByAccessor(cols, COLUMN_IDS.CALCULATED_DUST_VALUE);
    renderHeader(dustCol);
    expect(screen.getByText("Dust Value")).toBeTruthy();
    expect(screen.getByTestId("InfoIcon")).toBeTruthy();
    expect(screen.getByTestId("TooltipContent")).toBeTruthy();
    expect(screen.getByTestId("DustInfo")).toBeTruthy();

    // Mark header
    const markCol = findById(cols, COLUMN_IDS.SELECT);
    renderHeader(markCol);
    expect(screen.getByText("Mark")).toBeTruthy();
    expect(screen.getByTestId("InfoIcon")).toBeTruthy();
    expect(screen.getByTestId("ItemMarkingInfo")).toBeTruthy();
  });

  it("renders simple headers (Price, Dust per Chaos, Trade Link, Name) correctly", () => {
    const cols = createColumns(advancedSettings, league);

    renderHeader(findByAccessor(cols, COLUMN_IDS.CHAOS));
    expect(screen.getByText("Price")).toBeTruthy();

    renderHeader(findByAccessor(cols, COLUMN_IDS.DUST_PER_CHAOS));
    expect(screen.getByText("Dust per Chaos")).toBeTruthy();

    renderHeader(findById(cols, COLUMN_IDS.TRADE_LINK));
    expect(screen.getByText("Trade Link")).toBeTruthy();

    renderHeader(findByAccessor(cols, COLUMN_IDS.NAME));
    expect(screen.getByText("Name")).toBeTruthy();
  });
});