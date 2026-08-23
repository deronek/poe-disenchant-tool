import type { Atom } from "@tanstack/react-store";
import type { RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";

import { useLeagueSession } from "@/components/league-session-context";
import { usePersistedAtom } from "@/lib/use-persisted-atom";

function idsToRowSelection(ids: readonly string[]): RowSelectionState {
  return ids.reduce<RowSelectionState>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}

function rowSelectionToIds(selection: RowSelectionState): string[] {
  return Object.entries(selection)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

const SelectedIdsSchema = z.array(z.string());

/**
 * Persists the rowSelection atom to localStorage under the active league's
 * storage key, hydrating it once after mount. Hosts usePersistedAtom in this
 * leaf component (rendering nothing) because the persist subscription
 * re-renders its host on every atom change - hosted in DataTable itself, each
 * selection toggle would re-render the whole table.
 */
export function SelectionPersistence({
  rowSelection,
}: {
  rowSelection: Atom<RowSelectionState>;
}) {
  const { league } = useLeagueSession();

  // One-shot hydration is safe across league switches: the league content
  // tree remounts on every change (<LeagueContentServer key={league} /> in
  // app/[league]/page.tsx), so this host always hydrates the current key.
  usePersistedAtom(rowSelection, {
    storageKey: `poe-udt:selected:${league}:v2`,
    initialState: [],
    schema: SelectedIdsSchema,
    debounceDelay: 300,
    toStored: rowSelectionToIds,
    applyStored: (_prev, ids) => idsToRowSelection(ids),
  });
  return null;
}
