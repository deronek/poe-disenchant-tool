"use client";

import { createColumns } from "@/components/columns";
import { DataTable } from "@/components/data-table";

import {
  type AdvancedSettings,
  DEFAULT_ADVANCED_SETTINGS,
} from "@/components/advanced-settings-panel";
import type { Item } from "@/lib/itemData";
import { useLocalStorage } from "@/lib/use-local-storage";

interface SharedDataViewProps {
  items: Item[];
}

export function SharedDataView({ items }: SharedDataViewProps) {
  const [advancedSettings, setAdvancedSettings] =
    useLocalStorage<AdvancedSettings>(
      DEFAULT_ADVANCED_SETTINGS,
      "poe-udt:trade-settings:v1",
      {
        timeout: 300,
      },
    );

  // Generate columns with current settings
  const columns = createColumns(advancedSettings);

  return (
    <DataTable
      columns={columns}
      data={items}
      advancedSettings={advancedSettings}
      onAdvancedSettingsChange={setAdvancedSettings}
    />
  );
}
