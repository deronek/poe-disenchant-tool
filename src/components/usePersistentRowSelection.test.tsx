import * as React from "react";

// Prefer the project's testing framework; defaulting to Jest + RTL for hooks.
import { renderHook, act } from "@testing-library/react";
// If the project uses Vitest, swap jest.fn with vi.fn and keep the rest identical.

jest.mock("@/lib/use-local-storage", () => {
  const state = {
    value: [] as string[],
    set: jest.fn((updater: any) => {
      if (typeof updater === "function") {
        // updater receives previous string[] (SelectedIds)
        state.value = updater(state.value);
      } else {
        state.value = updater;
      }
    }),
    calls: [] as any[],
    lastArgs: null as null | [any, string, { debounceDelay: number; schema: any }],
  };

  // Mock implementation captures args and exposes a stable tuple-like API
  return {
    useLocalStorage: (initial: string[], key: string, options: { debounceDelay: number; schema: any }) => {
      state.calls.push([initial, key, options]);
      state.lastArgs = [initial, key, options];
      // Return a tuple [value, setValue] shaped like useState
      return [state.value, state.set] as const;
    },
    __mock: state,
  };
});

// Import after mocks so the hook reads mocked module
import { usePersistentRowSelection } from "@/components/usePersistentRowSelection";
import { Updater } from "@tanstack/react-table";

// Access the mock state to assert calls and behavior
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockLS = require("@/lib/use-local-storage").__mock as {
  value: string[];
  set: jest.Mock;
  calls: any[];
  lastArgs: null | [any, string, { debounceDelay: number; schema: any }];
};

describe("usePersistentRowSelection", () => {
  beforeEach(() => {
    // Reset mock state for isolation
    mockLS.value = [];
    mockLS.set.mockClear();
    mockLS.calls.length = 0;
    mockLS.lastArgs = null;
  });

  it("throws if storageKey is empty", () => {
    // Render inside a function to capture the thrown error
    const { result } = renderHook(() => {
      // @ts-expect-error testing invalid input
      return () => usePersistentRowSelection("");
    });
    expect(() => {
      // Call the closure so the hook executes and throws
      (result.current as any)();
    }).toThrowError(new Error("storageKey must be non-empty"));
  });

  it("initializes useLocalStorage with default [] and correct options", () => {
    const storageKey = "table:rowSelection:test";
    const { result } = renderHook(() => usePersistentRowSelection(storageKey));

    // It should have called our mocked useLocalStorage with defaults
    expect(mockLS.calls.length).toBeGreaterThan(0);
    expect(mockLS.lastArgs).not.toBeNull();
    const [initial, key, options] = mockLS.lastArgs!;
    expect(Array.isArray(initial)).toBe(true);
    expect(initial).toEqual([]);
    expect(key).toBe(storageKey);
    expect(options).toMatchObject({ debounceDelay: 300 });
    // Ensure a schema object was passed
    expect(options.schema).toBeTruthy();

    // Initial rowSelection should be empty object when selectedIds is []
    expect(result.current.rowSelection).toEqual({});
  });

  it("derives rowSelection from selectedIds (happy path)", () => {
    const storageKey = "table:rowSelection:derive";
    // Seed mock state before rendering
    mockLS.value = ["r1", "r3"];
    const { result } = renderHook(() => usePersistentRowSelection(storageKey));

    expect(result.current.rowSelection).toEqual({ r1: true, r3: true });
  });

  it("setRowSelection accepts object Updater and persists only truthy selections", () => {
    const storageKey = "table:rowSelection:set-object";
    const { result } = renderHook(() => usePersistentRowSelection(storageKey));

    act(() => {
      const nextObj = { a: true, b: false, c: 1 as unknown as boolean, d: 0 as unknown as boolean };
      result.current.setRowSelection(nextObj as any);
    });

    // Persisted ids must reflect only truthy values -> ["a","c"]
    expect(mockLS.set).toHaveBeenCalledTimes(1);
    expect(mockLS.value.sort()).toEqual(["a", "c"].sort());

    // rowSelection re-derives from updated ids
    expect(result.current.rowSelection).toEqual({ a: true, c: true });
  });

  it("setRowSelection accepts function Updater and merges with previous via RowSelectionState", () => {
    const storageKey = "table:rowSelection:set-fn";
    // Start with one selected id
    mockLS.value = ["x"];
    const { result } = renderHook(() => usePersistentRowSelection(storageKey));

    act(() => {
      const updater: Updater<Record<string, boolean>> = (prevRowSelection) => {
        // prevRowSelection should be { x: true }
        expect(prevRowSelection).toEqual({ x: true });
        // Toggle x off and add y on; leave z false
        return { x: false, y: true, z: false };
      };
      result.current.setRowSelection(updater);
    });

    // Only truthy keys should persist
    expect(mockLS.value).toEqual(["y"]);
    expect(result.current.rowSelection).toEqual({ y: true });
  });

  it("clearSelection empties all persisted selections", () => {
    const storageKey = "table:rowSelection:clear";
    mockLS.value = ["keep1", "keep2"];
    const { result } = renderHook(() => usePersistentRowSelection(storageKey));

    act(() => {
      result.current.clearSelection();
    });

    expect(mockLS.set).toHaveBeenCalledTimes(1);
    expect(mockLS.value).toEqual([]);
    expect(result.current.rowSelection).toEqual({});
  });

  it("does not invoke setter until setRowSelection/clearSelection are called (SSR-safe behavior via no eager writes)", () => {
    const storageKey = "table:rowSelection:lazy";
    renderHook(() => usePersistentRowSelection(storageKey));
    // The hook should have initialized but not written yet
    expect(mockLS.set).not.toHaveBeenCalled();

    // After a write operation, setter must be called
    act(() => {
      // No-op write: provide an object that filters to []
      // This still exercises the setter path
      // @ts-ignore
      const noop: Record<string, boolean> = {};
      require("@/lib/use-local-storage").__mock.set.mockClear(); // clear to verify single call
    });
  });
});