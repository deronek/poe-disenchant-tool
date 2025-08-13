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

  // On value change, write to localStorage (debounced if timeout > 0)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (timeout) {
        if (throttle.current) clearTimeout(throttle.current);
        throttle.current = setTimeout(() => {
          window.localStorage.setItem(key, JSON.stringify(value));
        }, timeout);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (err) {
      console.error(`Error writing localStorage key "${key}":`, err);
    }

    return () => {
      if (throttle.current) clearTimeout(throttle.current);
    };
  }, [key, timeout, value]);

  return [value, setValue];
}
