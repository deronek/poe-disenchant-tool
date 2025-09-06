/**
 * Unit tests for MobileCard (src/components/mobile-card.tsx).
 * Detected test framework: Unknown
 * Testing library: @testing-library/react + @testing-library/jest-dom
 *
 * Notes:
 * - We mock lightweight UI primitives and trade link creation to focus on component behavior.
 * - Tests cover rendering, a11y labels, selection behavior (including 'indeterminate'), trade link,
 *   and memoization comparator behavior across rerenders.
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Cross-framework mocking helper (Vitest or Jest)
const mocker: any = (globalThis as any).vi ?? (globalThis as any).jest;

// Mock UI primitives to avoid external behavior complexity
if (mocker?.mock) {
  // Button: pass-through when asChild, otherwise a plain button
  mocker.mock("@/components/ui/button", () => {
    const React = require("react");
    return {
      Button: ({ asChild, children, ...props }: any) =>
        asChild ? React.createElement(React.Fragment, null, children)
                : React.createElement("button", props, children),
    };
  });

  // Checkbox: modeled as a native checkbox plus a helper button to trigger 'indeterminate'
  mocker.mock("@/components/ui/checkbox", () => {
    const React = require("react");
    return {
      Checkbox: ({ checked, onCheckedChange, ["aria-label"]: ariaLabel, ...rest }: any) =>
        React.createElement(
          "div",
          { ...rest },
          React.createElement("input", {
            type: "checkbox",
            "aria-label": ariaLabel,
            "data-testid": "selection-checkbox",
            checked: !!checked,
            onChange: (e: any) => onCheckedChange?.(e.target.checked),
          }),
          React.createElement(
            "button",
            { "data-testid": "indeterminate", onClick: () => onCheckedChange?.("indeterminate" as any) },
            "indeterminate"
          ),
        ),
    };
  });

  // Popover: render children plainly so content is always in the DOM
  mocker.mock("@/components/ui/popover", () => {
    const React = require("react");
    return {
      Popover: ({ children }: any) => React.createElement("div", { "data-testid": "popover" }, children),
      PopoverTrigger: ({ asChild, children }: any) =>
        asChild ? React.createElement(React.Fragment, null, children)
                : React.createElement("button", null, children),
      PopoverContent: ({ children }: any) => React.createElement("div", { "data-testid": "popover-content" }, children),
    };
  });

  // Map column IDs to simple string constants to match our Row stub's getValue
  try {
    // Prefer resolving relative to the component file
    // (test lives in src/components/__tests__, component is ../mobile-card.tsx, columns is ../columns.ts)
    // require.resolve will fail if path is different; we fallback to raw "./columns".
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const columnsPath = require.resolve("../columns");
    mocker.mock(columnsPath, () => ({
      COLUMN_IDS: { NAME: "name", ICON: "icon", CHAOS: "chaos", DUST_PER_CHAOS: "dustPerChaos" },
    }));
  } catch {
    mocker.mock("./columns", () => ({
      COLUMN_IDS: { NAME: "name", ICON: "icon", CHAOS: "chaos", DUST_PER_CHAOS: "dustPerChaos" },
    }));
  }

  // Stable trade link for assertions + call count visibility for memoization tests
  mocker.mock("@/lib/tradeLink", () => ({
    createTradeLink: mocker.fn(() => "https://example.com/trade?mock=1"),
  }));
}

// Import after mocks so component uses mocked modules
import { MobileCard } from "../mobile-card";

// Access mocked trade link for call count assertions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tradeLinkMod = require("@/lib/tradeLink");

type RowStub = {
  id: string;
  original: {
    variant?: string | null;
    calculatedDustValue: number;
  } & Record<string, any>;
  getValue: (key: string) => any;
  toggleSelected: (v: boolean) => void;
};

// Helper to build a Row-like stub the component expects
function makeRowStub(opts: {
  id: string;
  name: string;
  variant?: string | null;
  icon?: string;
  chaos: number;
  dustPerChaos: number;
  calculatedDustValue: number;
  onToggle?: (v: boolean) => void;
}): RowStub {
  const values: Record<string, any> = {
    name: opts.name,
    icon: opts.icon ?? "/img.png",
    chaos: opts.chaos,
    dustPerChaos: opts.dustPerChaos,
  };
  const toggle = opts.onToggle ?? (mocker?.fn ? mocker.fn() : (() => {}));
  return {
    id: opts.id,
    original: {
      variant: opts.variant ?? null,
      calculatedDustValue: opts.calculatedDustValue,
    },
    getValue: (key: string) => values[key],
    toggleSelected: toggle,
  };
}

describe("MobileCard", () => {
  const league: any = "standard";
  const baseAdvanced = { a: 1, b: 2 };

  beforeEach(() => {
    if (mocker?.clearAllMocks) mocker.clearAllMocks();
    else if (mocker?.resetAllMocks) mocker.resetAllMocks();
  });

  test("renders core fields: name, optional variant, price, dust metrics, and trade link", async () => {
    const row = makeRowStub({
      id: "row-1",
      name: "Awesome Item",
      variant: "Perfect Variant",
      chaos: 123,
      dustPerChaos: 4.56,
      calculatedDustValue: 789,
    });

    const { container } = render(
      <MobileCard row={row as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />
    );

    // Header
    const heading = screen.getByRole("heading", { level: 3, name: "Awesome Item" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText("Perfect Variant")).toBeInTheDocument();

    // Price
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();

    // Dust Value
    const dustValueLabel = screen.getByText("Dust Value");
    expect(dustValueLabel).toBeInTheDocument();
    expect(screen.getByText("789")).toBeInTheDocument();

    // Dust per Chaos (primary metric)
    expect(screen.getByText("Dust per Chaos")).toBeInTheDocument();
    expect(screen.getByText("4.56")).toBeInTheDocument();

    // Trade link anchor and attributes
    const linkByAria = screen.getByRole("link", {
      name: "Open trade search for Awesome Item in new tab",
    });
    expect(linkByAria).toHaveAttribute("href", "https://example.com/trade?mock=1");
    expect(linkByAria).toHaveAttribute("target", "_blank");
    expect(linkByAria).toHaveAttribute("rel", "noreferrer");

    // Container selected state classes (isSelected=false -> 'bg-card')
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("bg-card");
    expect(root).not.toHaveClass("bg-muted/60");
  });

  test("does not render variant line when variant is absent", async () => {
    const row = makeRowStub({
      id: "row-2",
      name: "No Variant Item",
      variant: null,
      chaos: 1,
      dustPerChaos: 2,
      calculatedDustValue: 3,
    });

    render(<MobileCard row={row as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />);
    expect(screen.queryByText("Perfect Variant")).not.toBeInTheDocument();
  });

  test("selection: clicking checkbox calls row.toggleSelected(true); 'indeterminate' yields false", async () => {
    const onToggle = mocker?.fn ? mocker.fn() : (() => {});
    const row = makeRowStub({
      id: "row-3",
      name: "Toggle Item",
      chaos: 11,
      dustPerChaos: 22,
      calculatedDustValue: 33,
      onToggle,
    });

    render(<MobileCard row={row as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />);

    // Click checkbox => true
    await userEvent.click(screen.getByTestId("selection-checkbox"));
    expect(onToggle).toHaveBeenCalledWith(true);

    // Trigger 'indeterminate' path -> SelectionCheckbox converts to false
    await userEvent.click(screen.getByTestId("indeterminate"));
    expect(onToggle).toHaveBeenLastCalledWith(false);
  });

  test("a11y: info buttons have descriptive aria-labels", async () => {
    const row = makeRowStub({
      id: "row-4",
      name: "Readable Item",
      chaos: 5,
      dustPerChaos: 6,
      calculatedDustValue: 7,
      variant: "V",
    });

    render(<MobileCard row={row as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />);

    // Marking info
    expect(
      screen.getByRole("button", { name: "Learn more about marking Readable Item" })
    ).toBeInTheDocument();

    // Dust info
    expect(
      screen.getByRole("button", { name: "Learn more about dust value calculation" })
    ).toBeInTheDocument();

    // Popover content containers exist (mock renders content directly)
    const popovers = screen.getAllByTestId("popover-content");
    expect(popovers.length).toBeGreaterThanOrEqual(1);
  });

  test("selected state toggles container classes", async () => {
    const row = makeRowStub({
      id: "row-5",
      name: "Classy Item",
      chaos: 10,
      dustPerChaos: 20,
      calculatedDustValue: 30,
    });

    const { container, rerender } = render(
      <MobileCard row={row as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("bg-card");
    expect(root).not.toHaveClass("bg-muted/60");

    rerender(<MobileCard row={row as any} isSelected={true} advancedSettings={baseAdvanced} league={league} />);
    expect(root).toHaveClass("bg-muted/60");
    expect(root).not.toHaveClass("bg-card");
  });

  test("memoization: no rerender when row.id, isSelected, and advancedSettings (by JSON.stringify) are unchanged", async () => {
    const row1 = makeRowStub({
      id: "stable-1",
      name: "Stable Item",
      chaos: 100,
      dustPerChaos: 1.23,
      calculatedDustValue: 456,
    });

    const { rerender } = render(
      <MobileCard row={row1 as any} isSelected={false} advancedSettings={{ a: 1, b: 2 }} league={league} />
    );
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(1);

    // New row object, same id and same advancedSettings (same insertion order)
    const row1Clone = makeRowStub({
      id: "stable-1",
      name: "Stable Item UPDATED NAME WON'T MATTER",
      chaos: 999, // would change if rerendered
      dustPerChaos: 9.99,
      calculatedDustValue: 9999,
    });

    rerender(<MobileCard row={row1Clone as any} isSelected={false} advancedSettings={{ a: 1, b: 2 }} league={league} />);
    // Should not rerender due to comparator => no new trade link calls
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(1);
  });

  test("memoization: rerenders when isSelected changes", async () => {
    const row = makeRowStub({
      id: "sel-1",
      name: "Sel Item",
      chaos: 1,
      dustPerChaos: 2,
      calculatedDustValue: 3,
    });

    const { rerender } = render(
      <MobileCard row={row as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />
    );
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(1);

    rerender(<MobileCard row={row as any} isSelected={true} advancedSettings={baseAdvanced} league={league} />);
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(2);
  });

  test("memoization: rerenders when JSON string of advancedSettings changes (same keys different order)", async () => {
    const row = makeRowStub({
      id: "adv-1",
      name: "Adv Item",
      chaos: 5,
      dustPerChaos: 6,
      calculatedDustValue: 7,
    });

    const { rerender } = render(
      <MobileCard row={row as any} isSelected={false} advancedSettings={{ a: 1, b: 2 }} league={league} />
    );
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(1);

    // Same keys different insertion order -> JSON.stringify differs
    rerender(<MobileCard row={row as any} isSelected={false} advancedSettings={{ b: 2, a: 1 }} league={league} />);
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(2);
  });

  test("memoization: rerenders when row.id changes", async () => {
    const rowA = makeRowStub({
      id: "id-A",
      name: "Row A",
      chaos: 10,
      dustPerChaos: 10,
      calculatedDustValue: 10,
    });
    const rowB = makeRowStub({
      id: "id-B",
      name: "Row B",
      chaos: 20,
      dustPerChaos: 20,
      calculatedDustValue: 20,
    });

    const { rerender } = render(
      <MobileCard row={rowA as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />
    );
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(1);

    rerender(<MobileCard row={rowB as any} isSelected={false} advancedSettings={baseAdvanced} league={league} />);
    expect(tradeLinkMod.createTradeLink).toHaveBeenCalledTimes(2);
  });
});