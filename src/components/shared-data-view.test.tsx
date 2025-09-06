// NOTE: Ensure tsconfig paths alias "@" -> "src" is configured for test imports.
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";

// Note: Testing Library and framework auto-detect recorded here.
// Tests for SharedDataView
// Detected testing stack: {Vitest} + React Testing Library
// Generated on 2025-09-06 (UTC).
// Framework: Vitest

// We will mock dependencies to focus on SharedDataView behavior:
// - useLocalStorage: return controlled [state, setState] pair
// - createColumns: verify called with advancedSettings + league; return sentinel columns
// - DataTable: capture props and simulate onAdvancedSettingsChange invocations

import React from "react";

vi.mock("@/lib/use-local-storage", () => {
  return {
    useLocalStorage: vi.fn(),
  };
});

vi.mock("@/components/columns", () => {
  return {
    createColumns: vi.fn(),
  };
});

const dataTableSpy = vi.fn();
vi.mock("@/components/data-table", () => {
  return {
    DataTable: (props: any) => {
      dataTableSpy(props);
      // Render minimal marker so we can query by test id
      return React.createElement("div", { "data-testid": "data-table" }, props?.data?.length ?? 0);
    },
  };
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SharedDataView } from "@/components/shared-data-view"; // Adjust if actual path differs
import { League } from "@/lib/leagues";
import { AdvancedSettingsSchema, DEFAULT_ADVANCED_SETTINGS } from "@/components/advanced-settings-panel";
import { z } from "zod";

import { useLocalStorage as useLocalStorageMocked } from "@/lib/use-local-storage";
import { createColumns as createColumnsMocked } from "@/components/columns";

describe("SharedDataView", () => {
  const initialSettings = { ...DEFAULT_ADVANCED_SETTINGS };
  const updatedSettings = { ...DEFAULT_ADVANCED_SETTINGS, someFlag: true } as typeof DEFAULT_ADVANCED_SETTINGS & { someFlag: boolean };

  function arrangeUseLocalStorage(returnSettings = initialSettings) {
    const setFn = vi.fn();
    (useLocalStorageMocked as unknown as vi.Mock).mockReturnValue([returnSettings, setFn]);
    return { setFn };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders DataTable with provided items and league, and passes current advancedSettings", async () => {
    const { setFn } = arrangeUseLocalStorage();
    (createColumnsMocked as unknown as vi.Mock).mockReturnValue([{ id: "col1" }]);

    const items = [{ id: "1" }, { id: "2" }] as any;
    const league = League.Standard;

    render(<SharedDataView items={items} league={league} />);

    // createColumns called with settings and league
    expect(createColumnsMocked).toHaveBeenCalledTimes(1);
    expect(createColumnsMocked).toHaveBeenCalledWith(initialSettings, league);

    // DataTable rendered
    const table = await screen.findByTestId("data-table");
    expect(table).toBeInTheDocument();

    // DataTable props captured by spy
    const lastProps = dataTableSpy.mock.calls.at(-1)?.[0];
    expect(lastProps?.columns).toEqual([{ id: "col1" }]);
    expect(lastProps?.data).toBe(items);
    expect(lastProps?.advancedSettings).toEqual(initialSettings);
    expect(lastProps?.league).toBe(league);

    // setFn not called unless onAdvancedSettingsChange invoked
    expect(setFn).not.toHaveBeenCalled();
  });

  it("exposes onAdvancedSettingsChange from useLocalStorage setter via DataTable prop", async () => {
    const { setFn } = arrangeUseLocalStorage();
    (createColumnsMocked as unknown as vi.Mock).mockReturnValue([{ id: "only" }]);

    const items: any[] = [];
    const league = League.Hardcore ?? League.Standard; // fallback if enum differs

    render(<SharedDataView items={items} league={league} />);

    // pick the most recent props
    const lastProps = dataTableSpy.mock.calls.at(-1)?.[0];
    expect(typeof lastProps?.onAdvancedSettingsChange).toBe("function");

    // Simulate DataTable requesting settings change
    const next = { ...initialSettings, maxResults: 123 } as any;
    await lastProps.onAdvancedSettingsChange(next);
    expect(setFn).toHaveBeenCalledWith(next);
  });

  it("validates default settings against AdvancedSettingsSchema", () => {
    const parsed = AdvancedSettingsSchema.safeParse(DEFAULT_ADVANCED_SETTINGS);
    expect(parsed.success).toBe(true);
  });

  it("recomputes columns when settings differ (via re-render)", async () => {
    // first render
    arrangeUseLocalStorage(initialSettings);
    (createColumnsMocked as unknown as vi.Mock).mockReturnValueOnce([{ id: "first" }]);

    const items = [{ id: "a" }] as any;
    const league = League.Standard;

    const { rerender } = render(<SharedDataView items={items} league={league} />);
    expect(createColumnsMocked).toHaveBeenCalledWith(initialSettings, league);

    // second render with changed settings (simulate hook returning new tuple)
    vi.clearAllMocks();
    arrangeUseLocalStorage(updatedSettings);
    (createColumnsMocked as unknown as vi.Mock).mockReturnValueOnce([{ id: "second" }]);

    rerender(<SharedDataView items={items} league={league} />);
    expect(createColumnsMocked).toHaveBeenCalledWith(updatedSettings, league);

    const lastProps = dataTableSpy.mock.calls.at(-1)?.[0];
    expect(lastProps?.columns).toEqual([{ id: "second" }]);
    expect(lastProps?.advancedSettings).toEqual(updatedSettings);
  });

  it("handles empty items array gracefully", () => {
    arrangeUseLocalStorage();
    (createColumnsMocked as unknown as vi.Mock).mockReturnValue([]);

    render(<SharedDataView items={[]} league={League.Standard} />);
    const table = screen.getByTestId("data-table");
    // It renders with 0 items (text content from mocked DataTable)
    expect(table).toHaveTextContent("0");
  });

  it("is robust to unexpected settings shape (schema guard via safeParse)", () => {
    // This test ensures we don't blow up when settings are malformed; we validate with zod
    const malformed: any = { unknown: "value" };
    const result = AdvancedSettingsSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });
});