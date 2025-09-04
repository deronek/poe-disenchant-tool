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
  if (!key) {
    throw new Error("useLocalStorage: key must be a non-empty string");
  }
  const { debounceDelay } = options;

  const [value, setValue] = React.useState<T>(() =>
    typeof initialState === "function"
      ? (initialState as () => T)()
      : initialState,
  );
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

  const clearDebounce = React.useCallback(() => {
    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  // On mount and when key changes, read from localStorage
  React.useEffect(() => {
    const storedValue = readFromStorage();
    if (storedValue === undefined) return;
    setValue(storedValue);

    // Update valueRef here so cleanup flushes the freshly loaded value
    // even if we unmount before the next render cycle
    valueRef.current = storedValue;

    // On unmount, write the final value to localStorage
    return () => {
      // Cancel any existing debounce/flush
      clearDebounce();
      writeToStorage(valueRef.current);
    };
  }, [readFromStorage, writeToStorage, clearDebounce]);

  // On value change, write to localStorage (debounced if debounceDelay > 0)
  React.useEffect(() => {
    if (debounceDelay) {
      clearDebounce();
      debounceRef.current = setTimeout(() => {
        writeToStorage(valueRef.current);
      }, debounceDelay);
    } else {
      writeToStorage(value);
    }

    return () => {
      clearDebounce();
    };
  }, [value, debounceDelay, writeToStorage, clearDebounce]);

  // On every visibilityState === hidden, flush defensively
  // to avoid dropped writes
  // Not using pagehide, unload or beforeunload since their firing is non-deterministic
  // visibilitychange is supported in every modern browser
  React.useEffect(() => {
    const handleFlush = () => {
      if (document.visibilityState !== "hidden") return;
      clearDebounce();
      writeToStorage(valueRef.current);
    };

    document.addEventListener("visibilitychange", handleFlush);

    return () => {
      document.removeEventListener("visibilitychange", handleFlush);
    };
  }, [writeToStorage, clearDebounce]);

  return [value, setValue];
}
