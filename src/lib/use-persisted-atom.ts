import type { Atom } from "@tanstack/react-store";
import type { ZodType } from "zod";
import * as React from "react";

import { useLocalStorage } from "@/lib/use-local-storage";

export interface UsePersistedAtomOptions<T, TStored> {
  /**
   * Must stay constant for the lifetime of the mounted host. Hydration is
   * one-shot per mount: if the key changes afterwards, the new key's stored
   * value is never applied and the next atom change overwrites it with data
   * carried over from the previous key. Hosts keyed by dynamic values (e.g.
   * league) must remount when the value changes.
   */
  storageKey: string;
  /** Seed snapshot before storage reads land; must be a plain value. */
  initialState: TStored;
  schema: ZodType<TStored>;
  debounceDelay?: number;
  /** Atom value -> stored value (the inverse of applyStored). */
  toStored: (value: T) => TStored;
  /**
   * Computes the next atom value from the current value and a stored
   * snapshot. Runs exactly once after mount; receives `prev` so persisted
   * values can be merged around unrelated live state (e.g. persisted range
   * filters vs the live name filter).
   */
  applyStored: (prev: T, stored: TStored) => T;
}

/**
 * Restores an atom's value from a localStorage key once after mount, then
 * persists every subsequent atom change back to it (debounced by
 * `useLocalStorage`).
 *
 * The persist path goes through React state, so every atom change re-renders
 * the host component. Host this hook in a leaf component that renders
 * nothing (e.g. SelectionPersistence) when the atom changes frequently.
 */
export function usePersistedAtom<T, TStored>(
  atom: Atom<T>,
  {
    storageKey,
    initialState,
    schema,
    debounceDelay,
    toStored,
    applyStored,
  }: UsePersistedAtomOptions<T, TStored>,
): void {
  const [stored, setStored] = useLocalStorage<TStored>(
    initialState,
    storageKey,
    {
      debounceDelay,
      schema,
    },
  );

  const hydratedRef = React.useRef(false);
  const initialStateRef = React.useRef(initialState);
  React.useEffect(() => {
    if (hydratedRef.current) return;
    // While `stored` still is the seeded value, nothing has arrived from
    // storage; applying the seed here would spend the one shot before real
    // data can land. Parsed values are fresh references, primitives compare
    // by value, so Object.is opens exactly when data replaces the seed.
    if (Object.is(stored, initialStateRef.current)) return;
    // Defer the write to a macrotask so it lands after the initial render
    // cycle: the storage read happens asynchronously in an effect
    // (useLocalStorage restores post-mount), and applying restored state in
    // that same effect pass would re-render the table with restored values on
    // the client while the server HTML was rendered without them, causing
    // hydration warnings. The deferral also guarantees the one-shot applies
    // the latest stored value, after any re-renders the read triggered.
    const timeout = window.setTimeout(() => {
      if (hydratedRef.current) return;
      hydratedRef.current = true;
      atom.set((prev) => applyStored(prev, stored));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [atom, stored, applyStored]);

  React.useEffect(() => {
    const subscription = atom.subscribe((value) => setStored(toStored(value)));
    return () => subscription.unsubscribe();
  }, [atom, toStored, setStored]);
}
