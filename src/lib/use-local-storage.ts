// Based on https://gist.github.com/lukemcdonald/021d5584c058dfd570d59586daaefe59

import React from "react";
import type { ZodType, ZodTypeDef } from "zod";

/**
 * localStorage works just like useState, except it backs up to (and restores from) localStorage.
 * Stored value cannot be undefined per JSON spec, however it can be null.
 *
 * @param initialState The initial value to use
 * @param key The local storage key to use
 * @param options Optional. Allows a debounceDelay (in milliseconds) to debounce the setting localStorage, and an optional schema (ZodType<T>) for validation.
 * @returns The current value of the local storage item state, and a function to set it
 */
export function useLocalStorage<T>(
  initialState: T | (() => T),
  key: string,
  options: {
    debounceDelay?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema can be whatever as long as it parses into T
    schema?: ZodType<T, ZodTypeDef, any>;
  } = {},
): [T, React.Dispatch<React.SetStateAction<T>>] {
  if (!key) {
    throw new Error("useLocalStorage: key must be a non-empty string");
  }
  const { debounceDelay, schema } = options;

  const [value, setValue] = React.useState<T>(() =>
    typeof initialState === "function"
      ? (initialState as () => T)()
      : initialState,
  );
  const valueRef = React.useRef<T>(value);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const schemaRef = React.useRef<typeof schema>(schema);
  const lastWrittenRef = React.useRef<string | null>(null);

  const readFromStorage = React.useCallback((): T | undefined => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (schemaRef.current) {
          const res = schemaRef.current.safeParse(parsed);
          if (res.success) return res.data;
          console.warn(
            `Invalid data for localStorage key "${key}"`,
            res.error.issues,
          );
          return undefined;
        }
        return parsed;
      }
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
    }
  }, [key]);

  const writeToStorage = React.useCallback(
    (val: T) => {
      try {
        const json = JSON.stringify(val);
        if (lastWrittenRef.current === json) return;
        window.localStorage.setItem(key, json);
        lastWrittenRef.current = json;
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

  // Update refs before other useEffect hooks
  React.useEffect(() => {
    valueRef.current = value;
    schemaRef.current = schema;
  }, [value, schema]);

  // Clean-up last written value on key change
  React.useEffect(() => {
    lastWrittenRef.current = null;
  }, [key]);

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
        writeToStorage(value);
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
