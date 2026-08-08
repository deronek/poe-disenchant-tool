"use client";

import type { Item } from "@/lib/item-data";
import * as React from "react";

import { AdvancedSettingsProvider } from "@/components/advanced-settings-context";
import { createColumns, DataTable } from "@/components/data-table";
import { HydrationMarker } from "@/components/hydration-marker";
import { LeagueSessionProvider } from "@/components/league-session-context";
import { League } from "@/lib/leagues";

interface SharedDataViewProps {
  items: Item[];
  league: League;
  lowStockThreshold: number;
  divinePriceThreshold: number | null;
}

export function SharedDataView({
  items,
  league,
  lowStockThreshold,
  divinePriceThreshold,
}: SharedDataViewProps) {
  const columns = React.useMemo(
    () => createColumns(divinePriceThreshold),
    [divinePriceThreshold],
  );

  return (
    <LeagueSessionProvider
      league={league}
      lowStockThreshold={lowStockThreshold}
    >
      <AdvancedSettingsProvider>
        <DataTable columns={columns} data={items} />
      </AdvancedSettingsProvider>
      <HydrationMarker />
    </LeagueSessionProvider>
  );
}
