/* Library & framework note:
 * Tests use React Testing Library with expect matchers (jest-dom or @testing-library/jest-dom) under a jsdom environment.
 * If the project uses Vitest, ensure setupFiles include '@testing-library/jest-dom'.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest"; // Fallback to Vitest; if Jest is used, replace imports via test runner config.
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import component and exports
import {
  AdvancedSettingsPanel,
  AdvancedSettingsSchema,
  DEFAULT_ADVANCED_SETTINGS,
  type AdvancedSettings,
} from "./advanced-settings-panel";

// Mock shadcn/ui and icon components if not renderable or to avoid unrelated complexity
vi.mock("@/components/ui/popover", () => {
  const React = require("react");
  return {
    Popover: ({ open, onOpenChange, children }: any) => <div data-testid="popover" data-open={open}>{children}</div>,
    PopoverTrigger: ({ asChild, children }: any) => <div onClick={() => { /* noop in mock */ }}>{children}</div>,
    PopoverContent: ({ children }: any) => <div role="dialog">{children}</div>,
  };
});
vi.mock("@/components/ui/button", () => {
  const React = require("react");
  return { Button: ({ children, onClick, className, ...rest }: any) => <button className={className} onClick={onClick} {...rest}>{children}</button> };
});
vi.mock("@/components/ui/slider", () => {
  const React = require("react");
  // Simple input range to simulate Slider behavior
  return { Slider: ({ id, min, max, step, value, onValueChange, ...rest }: any) => (
    <input
      aria-label="Minimum item level"
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value?.[0] ?? 0}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      {...rest}
    />
  ) };
});
vi.mock("@/components/ui/checkbox", () => {
  const React = require("react");
  return { Checkbox: ({ id, checked, onCheckedChange, ...rest }: any) => (
    <input
      aria-label="Include corrupted items"
      id={id}
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...rest}
    />
  ) };
});
vi.mock("@/components/ui/label", () => ({ Label: ({ children, ...rest }: any) => <label {...rest}>{children}</label> }));
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children, ...rest }: any) => <span {...rest}>{children}</span> }));
vi.mock("./ui/separator", () => ({ Separator: () => <hr /> }));
vi.mock("lucide-react", () => {
  const React = require("react");
  const Icon = ({ label }: any) => <span aria-label={label || "icon"} />;
  return { Settings: Icon, ChevronDown: Icon, Zap: Icon, Tally1: (p:any)=> <span aria-label="tally-1" />, Tally2: (p:any)=> <span aria-label="tally-2" />, Tally3: (p:any)=> <span aria-label="tally-3" />, Tally4: (p:any)=> <span aria-label="tally-4" /> };
});

// For cn utility that affects className, we rely on actual implementation; if absent, mock:
try { require("@/lib/utils"); } catch {
  vi.mock("@/lib/utils", () => ({ cn: (...classes: string[]) => classes.filter(Boolean).join(" ") }));
}

describe("AdvancedSettingsSchema", () => {
  it("applies defaults and is strict", () => {
    const parsed = AdvancedSettingsSchema.parse({});
    expect(parsed.minItemLevel).toBeGreaterThanOrEqual(65);
    expect(parsed.minItemLevel).toBeLessThanOrEqual(84);
    expect(typeof parsed.includeCorrupted).toBe("boolean");

    // Strict: unknown keys should fail
    expect(() => AdvancedSettingsSchema.parse({ foo: "bar" } as any)).toThrow();
  });

  it("enforces bounds for minItemLevel", () => {
    expect(() => AdvancedSettingsSchema.parse({ minItemLevel: 64 })).toThrow();
    expect(() => AdvancedSettingsSchema.parse({ minItemLevel: 85 })).toThrow();
    // Edge valid values
    expect(AdvancedSettingsSchema.parse({ minItemLevel: 65, includeCorrupted: true }).minItemLevel).toBe(65);
    expect(AdvancedSettingsSchema.parse({ minItemLevel: 84, includeCorrupted: false }).minItemLevel).toBe(84);
  });
});

describe("DEFAULT_ADVANCED_SETTINGS", () => {
  it("matches schema defaults", () => {
    expect(DEFAULT_ADVANCED_SETTINGS).toEqual(AdvancedSettingsSchema.parse({}));
  });
});

describe("AdvancedSettingsPanel UI behavior", () => {
  const base: AdvancedSettings = { minItemLevel: 78, includeCorrupted: true };
  let onSettingsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSettingsChange = vi.fn();
  });

  function renderPanel(custom?: Partial<AdvancedSettings>) {
    return render(
      <AdvancedSettingsPanel settings={{ ...base, ...custom }} onSettingsChange={onSettingsChange} />
    );
  }

  it("renders popover trigger button labeled 'Trade' and toggles content", async () => {
    const user = userEvent.setup();
    renderPanel();
    const trigger = screen.getByRole("button", { name: /trade/i });
    expect(trigger).toBeInTheDocument();

    // Open popover
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via 'Close' button
    await user.click(screen.getByRole("button", { name: /close/i }));
    // In real component, dialog is conditionally rendered; since we mock PopoverContent always mounts,
    // this check ensures Close button exists. If actual unmount is implemented, consider querying accordingly.
  });

  it("applies className to trigger via cn", () => {
    render(
      <AdvancedSettingsPanel settings={base} onSettingsChange={onSettingsChange} className="extra-class" />
    );
    const trigger = screen.getByRole("button", { name: /trade/i });
    expect(trigger.className).toMatch(/extra-class/);
  });

  it("slider enforces bounds and calls onSettingsChange with new value", async () => {
    const user = userEvent.setup();
    renderPanel({ minItemLevel: 70 });

    // Open
    await user.click(screen.getByRole("button", { name: /trade/i }));

    const slider = screen.getByRole("slider", { name: /minimum item level/i });
    expect(slider).toHaveAttribute("min", "65");
    expect(slider).toHaveAttribute("max", "84");
    expect(slider).toHaveAttribute("step", "1");
    expect((slider as HTMLInputElement).value).toBe("70");

    // Change to a valid mid value
    await user.clear(slider);
    await user.type(slider, "80");
    // For range inputs, fireEvent.change may be more reliable than typing
    fireEvent.change(slider, { target: { value: "80" } });
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ minItemLevel: 80 }));

    // Change below min -> component clamps when computing dust but still sends raw 65..84; use min bound
    fireEvent.change(slider, { target: { value: "60" } });
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ minItemLevel: 60 })); // The handler passes selected value; schema clamps elsewhere
  });

  it("checkbox toggles includeCorrupted and normalizes to boolean", async () => {
    const user = userEvent.setup();
    renderPanel({ includeCorrupted: false });

    // Open
    await user.click(screen.getByRole("button", { name: /trade/i }));

    const checkbox = screen.getByRole("checkbox", { name: /include corrupted items/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onSettingsChange).toHaveBeenLastCalledWith(expect.objectContaining({ includeCorrupted: true }));

    await user.click(checkbox);
    expect(onSettingsChange).toHaveBeenLastCalledWith(expect.objectContaining({ includeCorrupted: false }));
  });

  it("reset button restores defaults", async () => {
    const user = userEvent.setup();
    renderPanel({ minItemLevel: 84, includeCorrupted: false });

    await user.click(screen.getByRole("button", { name: /trade/i }));

    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(onSettingsChange).toHaveBeenCalledWith(DEFAULT_ADVANCED_SETTINGS);
  });

  it("renders appropriate tally icon based on minItemLevel thresholds", async () => {
    const user = userEvent.setup();

    // < 70 => Tally1
    const { rerender } = render(
      <AdvancedSettingsPanel settings={{ ...base, minItemLevel: 69 }} onSettingsChange={onSettingsChange} />
    );
    await user.click(screen.getByRole("button", { name: /trade/i }));
    expect(screen.getByLabelText("tally-1")).toBeInTheDocument();

    // < 75 => Tally2
    rerender(<AdvancedSettingsPanel settings={{ ...base, minItemLevel: 70 }} onSettingsChange={onSettingsChange} />);
    expect(screen.getByLabelText("tally-2")).toBeInTheDocument();

    // < 80 => Tally3
    rerender(<AdvancedSettingsPanel settings={{ ...base, minItemLevel: 79 }} onSettingsChange={onSettingsChange} />);
    expect(screen.getByLabelText("tally-3")).toBeInTheDocument();

    // else => Tally4
    rerender(<AdvancedSettingsPanel settings={{ ...base, minItemLevel: 80 }} onSettingsChange={onSettingsChange} />);
    expect(screen.getByLabelText("tally-4")).toBeInTheDocument();
  });

  it("shows dust value loss computed from clamped range [65,84]", async () => {
    const user = userEvent.setup();

    // min -> 65 => (84 - 65) * 5 = 95%
    renderPanel({ minItemLevel: 0 }); // will clamp internally for display computation
    await user.click(screen.getByRole("button", { name: /trade/i }));
    expect(screen.getByText(/up to 95%/i)).toBeInTheDocument();

    // mid -> 80 => (84 - 80)*5 = 20%
    const { rerender } = render(
      <AdvancedSettingsPanel settings={{ ...base, minItemLevel: 80 }} onSettingsChange={onSettingsChange} />
    );
    expect(screen.getByText(/up to 20%/i)).toBeInTheDocument();

    // max -> 84 => 0% -> "no"
    rerender(<AdvancedSettingsPanel settings={{ ...base, minItemLevel: 84 }} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText(/^no $/i)).toBeInTheDocument();
  });
});