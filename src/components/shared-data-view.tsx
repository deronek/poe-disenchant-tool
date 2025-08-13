"use client";

import { createColumns } from "@/components/columns";
import { DataTable } from "@/components/data-table";

import { type AdvancedSettings } from "@/components/advanced-settings-panel";
import type { Item } from "@/lib/itemData";
import { useState } from "react";

interface SharedDataViewProps {
  items: Item[];
}

export function SharedDataView({ items }: SharedDataViewProps) {
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    minItemLevel: 78,
    includeCorrupted: true,
  });

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
