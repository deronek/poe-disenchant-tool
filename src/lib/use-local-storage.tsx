// https://gist.github.com/lukemcdonald/021d5584c058dfd570d59586daaefe59

import React from "react";

/**
 * localStorage works just like useState, except it backs up to (and restores from) localStorage.
 *
 * @param initialState The initial value to use
 * @param key The local storage key to use
 * @param options Optional. Currently allows a timeout (in milliseconds) to debouce the setting localStorage if needed.
 * @returns The current value of the local storage item state, and a function to set it
 */
export function useLocalStorage<T>(
  initialState: T,
  key: string,
  options: {
    timeout?: number;
  } = {
    timeout: 0,
  },
): [T, (value: T | ((val: T) => T)) => void] {
  const { timeout } = options;

  const [value, setValue] = React.useState<T>(initialState);

  const throttle = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount, read from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
    }
  }, [key]);

  // Helper to write immediately
  const flush = React.useCallback(
    (val: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(val));
      } catch (err) {
        console.error(`Error writing localStorage key "${key}":`, err);
      }
    },
    [key],
  );

  // On value change, write to localStorage (debounced if timeout > 0)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (timeout) {
      if (throttle.current) clearTimeout(throttle.current);
      throttle.current = setTimeout(() => flush(value), timeout);
    } else {
      flush(value);
    }

    return () => {
      if (throttle.current) clearTimeout(throttle.current);
    };
  }, [key, timeout, value, flush]);

  // Flush defensively on every visibilityState === hidden
  // to avoid dropped writes
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFlush = () => {
      if (document.visibilityState !== "hidden") return;
      if (throttle.current) {
        clearTimeout(throttle.current);
        throttle.current = null;
      }
      flush(value);
    };

    document.addEventListener("visibilitychange", handleFlush);

    return () => {
      document.removeEventListener("visibilitychange", handleFlush);
    };
  }, [flush, value]);

  return [value, setValue];
}
