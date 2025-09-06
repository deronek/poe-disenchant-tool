import React from "react";
import { renderHook, act } from "@testing-library/react";
// If project uses Vitest, swap jest -> vi
const useFakeTimers = () => jest.useFakeTimers();
const runAllTimers = async () => { jest.runOnlyPendingTimers(); await Promise.resolve(); };
const advanceTimersBy = async (ms: number) => { jest.advanceTimersByTime(ms); await Promise.resolve(); };

import { z } from "zod";
import { useLocalStorage } from "./use-local-storage"; // adjust if path differs

// Helper to spy on console without polluting test output
const spyConsole = () => {
  const origError = console.error;
  const origWarn = console.warn;
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  return {
    errorSpy,
    warnSpy,
    restore: () => {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      console.error = origError;
      console.warn = origWarn;
    },
  };
};

// Helper to spy on localStorage methods
const spyLocalStorage = () => {
  // Some environments require spying on the prototype
  const proto = Object.getPrototypeOf(window.localStorage);
  const getItemSpy = jest.spyOn(proto, "getItem");
  const setItemSpy = jest.spyOn(proto, "setItem");
  return { getItemSpy, setItemSpy, restore: () => { getItemSpy.mockRestore(); setItemSpy.mockRestore(); } };
};

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("throws when key is an empty string", () => {
    const render = () => renderHook(() => {
      // @ts-expect-error testing runtime error on empty key
      return useLocalStorage("x", "");
    });
    expect(render).toThrowError(/key must be a non-empty string/i);
  });

  it("initializes from a plain initial value and writes immediately", () => {
    const { setItemSpy, restore } = spyLocalStorage();
    const { result } = renderHook(() => useLocalStorage<number>(5, "num"));
    expect(result.current[0]).toBe(5);
    // Immediate write (no debounce)
    expect(setItemSpy).toHaveBeenCalledWith("num", JSON.stringify(5));
    restore();
  });

  it("initializes from an initializer function", () => {
    const init = jest.fn(() => ({ a: 1 }));
    const { result } = renderHook(() => useLocalStorage<{ a: number }>(init, "obj"));
    expect(init).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it("reads existing value from localStorage on mount (no schema)", async () => {
    localStorage.setItem("k", JSON.stringify({ ok: true }));
    const { result } = renderHook(() => useLocalStorage<{ ok: boolean }>({ ok: false }, "k"));
    // effect sets the value on mount
    await act(async () => {});
    expect(result.current[0]).toEqual({ ok: true });
  });

  it("validates and loads using a Zod schema (valid data)", async () => {
    const schema = z.object({ ok: z.boolean() });
    localStorage.setItem("sk", JSON.stringify({ ok: true }));
    const { result } = renderHook(() =>
      useLocalStorage<{ ok: boolean }>({ ok: false }, "sk", { schema }),
    );
    await act(async () => {});
    expect(result.current[0]).toEqual({ ok: true });
  });

  it("rejects invalid JSON in storage and keeps initial value, logging error", async () => {
    const c = spyConsole();
    localStorage.setItem("bad", "{not-json");
    const { result } = renderHook(() => useLocalStorage<number>(123, "bad"));
    await act(async () => {});
    expect(result.current[0]).toBe(123);
    expect(c.errorSpy).toHaveBeenCalledWith(expect.stringMatching(/Error reading localStorage key "bad"/), expect.any(SyntaxError));
    c.restore();
  });

  it("rejects schema-invalid data and keeps initial value, logging warning", async () => {
    const c = spyConsole();
    const schema = z.object({ a: z.number() });
    localStorage.setItem("sch", JSON.stringify({ a: "nope" }));
    const { result } = renderHook(() =>
      useLocalStorage<{ a: number }>({ a: 0 }, "sch", { schema }),
    );
    await act(async () => {});
    expect(result.current[0]).toEqual({ a: 0 });
    expect(c.warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid data for localStorage key "sch"/),
      expect.any(Array)
    );
    c.restore();
  });

  it("debounces writes when debounceDelay > 0 and flushes on unmount", async () => {
    useFakeTimers();
    const { setItemSpy, restore } = spyLocalStorage();

    const { result, unmount } = renderHook(() =>
      useLocalStorage<number>(0, "debounced", { debounceDelay: 200 }),
    );

    // Setting value should not immediately write due to debounce
    act(() => result.current[1](1));
    expect(setItemSpy).toHaveBeenCalledTimes(1); // initial write for initial state
    // Debounced write pending
    await act(async () => { /* no-op */ });
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    // Advance less than delay -> still no write
    await act(async () => { await advanceTimersBy(150); });
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    // Advance beyond delay -> write occurs
    await act(async () => { await advanceTimersBy(100); });
    expect(setItemSpy).toHaveBeenCalledWith("debounced", JSON.stringify(1));
    expect(setItemSpy).toHaveBeenCalledTimes(2);

    // Set another value and unmount before debounce elapses -> cleanup flush writes immediately
    act(() => result.current[1](2));
    // not written yet
    expect(setItemSpy).toHaveBeenCalledTimes(2);
    unmount(); // cleanup should clear timeout and write final valueRef
    expect(setItemSpy).toHaveBeenCalledWith("debounced", JSON.stringify(2));

    restore();
  });

  it("flushes pending debounced write when document becomes hidden (visibilitychange)", async () => {
    useFakeTimers();
    const { setItemSpy, restore } = spyLocalStorage();

    const { result } = renderHook(() =>
      useLocalStorage<number>(10, "vis", { debounceDelay: 500 }),
    );

    act(() => result.current[1](42));

    // Simulate visibility change to hidden
    const descriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Should flush immediately regardless of remaining debounce time
    expect(setItemSpy).toHaveBeenCalledWith("vis", JSON.stringify(42));

    // Restore visibilityState property
    if (descriptor) Object.defineProperty(document, "visibilityState", descriptor);
    restore();
  });

  it("writes to previous key on key change (cleanup) and loads value from new key", async () => {
    const { setItemSpy, restore } = spyLocalStorage();

    localStorage.setItem("newKey", JSON.stringify("from-new"));
    const { result, rerender } = renderHook(
      ({ k }: { k: string }) => useLocalStorage<string>("init", k),
      { initialProps: { k: "oldKey" } },
    );

    // Change state under old key
    act(() => result.current[1]("under-old"));
    await act(async () => {});

    // Switch key -> should flush "under-old" to "oldKey" during effect cleanup, then load from new key
    rerender({ k: "newKey" });
    await act(async () => {});
    // Verify cleanup write targeted oldKey
    expect(setItemSpy).toHaveBeenCalledWith("oldKey", JSON.stringify("under-old"));
    // Value should come from new key
    expect(result.current[0]).toBe("from-new");

    restore();
  });
});