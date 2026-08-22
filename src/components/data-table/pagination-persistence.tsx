import type { Atom } from "@tanstack/react-store";
import type { PaginationState } from "@tanstack/react-table";
import { z } from "zod";

import { usePersistedAtom } from "@/lib/use-persisted-atom";

export const DEFAULT_PAGE_SIZE = 10;

const PageSizeSchema = z.number().int().positive();

/**
 * Persists the page size of the external pagination atom (a global,
 * league-independent setting). Hosts usePersistedAtom in this leaf component
 * (rendering nothing) because the persist subscription re-renders its host
 * on every atom change.
 */
export function PaginationPersistence({
  pagination,
}: {
  pagination: Atom<PaginationState>;
}) {
  usePersistedAtom(pagination, {
    storageKey: "poe-udt:page-size:v1",
    initialState: DEFAULT_PAGE_SIZE,
    schema: PageSizeSchema,
    debounceDelay: 300,
    toStored: ({ pageSize }) => pageSize,
    applyStored: (prev, pageSize) => ({ ...prev, pageSize }),
  });
  return null;
}
