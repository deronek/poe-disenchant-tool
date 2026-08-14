"use client";

import type { Item } from "@/lib/item-data";
import type { League } from "@/lib/leagues";
import type { ViewItem } from "@/lib/view-item";
import * as React from "react";

import { AdvancedSettingsProvider } from "@/components/advanced-settings-context";
import { createColumns, DataTable } from "@/components/data-table";
import {
  EfficiencySettingsProvider,
  useEfficiencySettings,
} from "@/components/efficiency";
import { HydrationMarker } from "@/components/hydration-marker";
import { LeagueSessionProvider } from "@/components/league-session-context";
import { getEfficiencyResult } from "@/lib/efficiency";

interface SharedDataViewProps {
  items: Item[];
  league: League;
  lowStockThreshold: number;
  divinePriceThreshold: number | null;
}

function EfficiencyDataView({
  items,
  divinePriceThreshold,
}: Pick<SharedDataViewProps, "items" | "divinePriceThreshold">) {
  const { settings } = useEfficiencySettings();

  const columns = React.useMemo(
    () => createColumns(divinePriceThreshold),
    [divinePriceThreshold],
  );

  const viewItems = React.useMemo<ViewItem[]>(
    () =>
      items.map((item) => {
        const result = getEfficiencyResult(item, settings);

        return {
          ...item,
          efficiency: result.value,
          effectiveChaosCost: result.effectiveChaosCost,
        };
      }),
    [items, settings],
  );

  return <DataTable columns={columns} data={viewItems} />;
}

export function SharedDataView({
  items,
  league,
  lowStockThreshold,
  divinePriceThreshold,
}: SharedDataViewProps) {
  return (
    <LeagueSessionProvider
      league={league}
      lowStockThreshold={lowStockThreshold}
    >
      <AdvancedSettingsProvider>
        <EfficiencySettingsProvider>
          <EfficiencyDataView
            items={items}
            divinePriceThreshold={divinePriceThreshold}
          />
        </EfficiencySettingsProvider>
      </AdvancedSettingsProvider>

      <HydrationMarker />
    </LeagueSessionProvider>
  );
}
