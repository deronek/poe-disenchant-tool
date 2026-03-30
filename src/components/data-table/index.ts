export {
  COLUMN_IDS,
  createColumns,
  renderCompactNumber,
  type ColumnId,
} from "./columns";
export { DataTable } from "./data-table";
export { DataTablePagination } from "./data-table-pagination";
// DataTableStateProvider must be imported directly from ./data-table-state-context
// in server components (e.g. layout.tsx) — importing via this barrel causes React
// to evaluate client modules (useState, etc.) during SSR and breaks the build.
export { useDataTableState } from "./data-table-state-context";
