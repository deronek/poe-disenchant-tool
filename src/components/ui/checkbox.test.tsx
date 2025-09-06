
/**
 * Test suite for Checkbox UI component.
 *
 * Framework & libraries:
 * - React Testing Library (preferred): @testing-library/react, @testing-library/user-event
 * - Assertions: jest-dom or vitest-dom (expect(...).toBeInTheDocument etc.)
 *
 * These tests validate:
 * - Rendering with default props and custom className merging (cn)
 * - Controlled and uncontrolled checked state interactions
 * - aria-invalid styling hook
 * - disabled state behavior
 * - focus-visible ring behavior on keyboard interaction
 * - indicator visibility and icon rendering when checked
 * - forwarding props/events (onCheckedChange) from Radix Root
 *
 * If your project uses a custom render helper, replace direct render import with that helper.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// If your project exports Checkbox from "@/components/ui/checkbox", prefer that alias.
// Fallback to relative import if alias isn't configured.
// Adjust the path below if your alias differs.
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  test("renders with base styles and data-slot attributes", () => {
    render(<Checkbox data-testid="cb" />);
    const cb = screen.getByTestId("cb");
    expect(cb).toBeInTheDocument();
    // Root element should have data-slot and baseline classes applied
    expect(cb).toHaveAttribute("data-slot", "checkbox");
    expect(cb).toHaveClass("peer");
    expect(cb).toHaveClass("border");
    expect(cb).toHaveClass("rounded-[4px]");
    // Indicator should be present inside
    const indicator = cb.querySelector('[data-slot="checkbox-indicator"]');
    expect(indicator).toBeInTheDocument();
    // Check icon rendered
    const checkIcon = cb.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  test("merges custom className via cn()", () => {
    render(<Checkbox data-testid="cb" className="extra-class" />);
    const cb = screen.getByTestId("cb");
    expect(cb).toHaveClass("extra-class");
  });

  test("uncontrolled checkbox toggles checked state via click", async () => {
    const user = userEvent.setup();
    render(<Checkbox data-testid="cb" defaultChecked={false} />);
    const cb = screen.getByTestId("cb");

    // Radix Root has data-state attribute that reflects state
    expect(cb).toHaveAttribute("data-state", "unchecked");

    await user.click(cb);
    expect(cb).toHaveAttribute("data-state", "checked");

    await user.click(cb);
    expect(cb).toHaveAttribute("data-state", "unchecked");
  });

  test("controlled checkbox respects checked prop and calls onCheckedChange", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    function Controlled() {
      const [val, setVal] = React.useState(false);
      return (
        <>
          <Checkbox data-testid="cb" checked={val} onCheckedChange={(v) => { handler(v); setVal(Boolean(v)); }} />
          <button onClick={() => setVal(true)}>setTrue</button>
          <button onClick={() => setVal(false)}>setFalse</button>
        </>
      );
    }
    render(<Controlled />);

    const cb = screen.getByTestId("cb");
    expect(cb).toHaveAttribute("data-state", "unchecked");

    await user.click(cb);
    expect(handler).toHaveBeenCalledTimes(1);
    // After state update, should be checked
    expect(cb).toHaveAttribute("data-state", "checked");

    // Programmatic state changes should reflect too
    await user.click(screen.getByText("setFalse"));
    expect(cb).toHaveAttribute("data-state", "unchecked");

    await user.click(screen.getByText("setTrue"));
    expect(cb).toHaveAttribute("data-state", "checked");
  });

  test("tri-state (indeterminate) is supported via Radix CheckedState", () => {
    // Radix supports 'indeterminate' state via 'checked="indeterminate"'
    render(<Checkbox data-testid="cb" checked="indeterminate" />);
    const cb = screen.getByTestId("cb");
    expect(cb).toHaveAttribute("data-state", "indeterminate");
  });

  test("disabled state prevents interaction", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox data-testid="cb" disabled onCheckedChange={onChange} />);
    const cb = screen.getByTestId("cb");
    expect(cb).toBeDisabled();

    await user.click(cb);
    // Radix still reflects disabled via attribute; state should not change nor trigger handler
    expect(onChange).not.toHaveBeenCalled();
  });

  test("focus-visible ring appears on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>before</button>
        <Checkbox data-testid="cb" />
        <button>after</button>
      </>
    );
    // Tab to the checkbox
    await user.tab();
    await user.tab();
    const cb = screen.getByTestId("cb");
    expect(cb).toHaveFocus();
    // We can't easily compute styles here without getComputedStyle,
    // but we can assert relevant classes exist that drive the ring behavior.
    expect(cb.className).toMatch(/focus-visible:ring-\[3px\]/);
  });

  test("aria-invalid adds destructive ring and border classes via data attributes", () => {
    render(<Checkbox data-testid="cb" aria-invalid="true" />);
    const cb = screen.getByTestId("cb");
    // We assert presence of classes that are conditionally applied in the Tailwind utility string
    expect(cb.className).toMatch(/aria-invalid:ring-destructive\/(20|40)/);
    expect(cb.className).toMatch(/aria-invalid:border-destructive/);
  });

  test("checked state applies primary bg/text classes", async () => {
    const user = userEvent.setup();
    render(<Checkbox data-testid="cb" />);
    const cb = screen.getByTestId("cb");

    await user.click(cb);
    // When checked, the root should have data-state="checked" and classes for bg/text-primary
    expect(cb).toHaveAttribute("data-state", "checked");
    expect(cb.className).toMatch(/data-\[state=checked\]:bg-primary/);
    expect(cb.className).toMatch(/data-\[state=checked\]:text-primary-foreground/);
  });

  test("forwards arbitrary props (e.g., id, name) to the underlying element", () => {
    render(<Checkbox data-testid="cb" id="agree" name="agree" value="yes" />);
    const cb = screen.getByTestId("cb");
    expect(cb).toHaveAttribute("id", "agree");
    expect(cb).toHaveAttribute("name", "agree");
    expect(cb).toHaveAttribute("value", "yes");
  });
});