import type { ReadonlyAtom } from "@tanstack/react-store";
import type { RowSelectionState } from "@tanstack/react-table";
import { useSelector } from "@tanstack/react-store";

/**
 * Minimal row surface this hook needs: the row id and its table's
 * rowSelection atom.
 */
interface RowSelectionRow {
  id: string;
  table: { atoms: { rowSelection: ReadonlyAtom<RowSelectionState> } };
}

/**
 * Reactively reads whether a row is selected. The component only re-renders
 * when this row's selection changes.
 */
export function useRowSelected(row: RowSelectionRow): boolean {
  return useSelector(row.table.atoms.rowSelection, (s) => !!s[row.id]);
}
