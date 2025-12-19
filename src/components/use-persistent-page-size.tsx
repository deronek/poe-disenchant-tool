import { z } from "zod";

import { useLocalStorage } from "@/lib/use-local-storage";

const PageSizeSchema = z.number().int().positive();

type PersistedPageSize = z.infer<typeof PageSizeSchema>;

/**
 * Persist TanStack Table page size to localStorage.
 * - Stores only pageSize (not pageIndex).
 * - League-independent (global setting).
 * - SSR safe: no localStorage access until mounted.
 */
export function usePersistentPageSize(storageKey: string) {
  if (!storageKey) {
    throw new Error("storageKey must be non-empty");
  }

  const [persistedPageSize, setPersistedPageSize] =
    useLocalStorage<PersistedPageSize>(10, storageKey, {
      debounceDelay: 300,
      schema: PageSizeSchema,
    });

  return {
    pageSize: persistedPageSize,
    setPageSize: setPersistedPageSize,
  } as const;
}
