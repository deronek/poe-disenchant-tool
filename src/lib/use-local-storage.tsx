// Based on https://gist.github.com/lukemcdonald/021d5584c058dfd570d59586daaefe59

import React from "react";

/**
 * localStorage works just like useState, except it backs up to (and restores from) localStorage.
 *
 * @param initialState The initial value to use
 * @param key The local storage key to use
 * @param options Optional. Currently allows a debounceDelay (in milliseconds) to debounce the setting localStorage if needed.
 * @returns The current value of the local storage item state, and a function to set it
 */
export function useLocalStorage<T>(
  initialState: T | (() => T),
  key: string,
  options: {
    debounceDelay?: number;
  } = {},
): [T, (value: T | ((val: T) => T)) => void] {
  const { debounceDelay } = options;

  const initialValue = (
    typeof initialState === "function"
      ? (initialState as () => T)()
      : initialState
  ) as T;

  const [value, setValue] = React.useState<T>(() => initialValue);
  const valueRef = React.useRef<T>(value);
  React.useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const readFromStorage = React.useCallback((): T | undefined => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item);
        return parsed;
      }
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
    }
  }, [key]);

  const writeToStorage = React.useCallback(
    (val: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(val));
      } catch (err) {
        console.error(`Error writing localStorage key "${key}":`, err);
      }
    },
    [key],
  );

  // On mount, read from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const value = readFromStorage();
    if (value === undefined) return;
    setValue(value);

    // Update the value ref asynchronously to avoid a race condition
    // in case we unmount immediately after (e.g. Strict Mode)
    valueRef.current = value;

    // On unmount, write the final value to localStorage
    return () => {
      // Cancel any existing debounce/flush
      if (debounceRef.current) clearTimeout(debounceRef.current);

      writeToStorage(valueRef.current);
    };
  }, [readFromStorage, writeToStorage]);

  // On value change, write to localStorage (debounced if debounceDelay > 0)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (debounceDelay) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        writeToStorage(valueRef.current);
      }, debounceDelay);
    } else {
      writeToStorage(value);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, writeToStorage, debounceDelay]);

  // On every visibilityState === hidden, flush defensively
  // to avoid dropped writes
  // Not using pagehide, unload or beforeunload since their firing is non-deterministic
  // visibilitychange is supported in every modern browser
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFlush = () => {
      if (document.visibilityState !== "hidden") return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      writeToStorage(valueRef.current);
    };

    document.addEventListener("visibilitychange", handleFlush);

    return () => {
      document.removeEventListener("visibilitychange", handleFlush);
    };
  }, [writeToStorage]);

  return [value, setValue];
}
