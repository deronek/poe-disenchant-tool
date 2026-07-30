"use client";

import type { League } from "@/lib/leagues";
import * as React from "react";

interface LeagueSessionContextValue {
  league: League;
  lowStockThreshold: number;
}

const LeagueSessionContext =
  React.createContext<LeagueSessionContextValue | null>(null);

interface LeagueSessionProviderProps {
  league: League;
  lowStockThreshold: number;
  children: React.ReactNode;
}

export function LeagueSessionProvider({
  league,
  lowStockThreshold,
  children,
}: LeagueSessionProviderProps) {
  // Stable value: league/threshold only change across page navigation, so the
  // context value is referentially stable for the lifetime of a league page.
  const value = React.useMemo(
    () => ({ league, lowStockThreshold }),
    [league, lowStockThreshold],
  );

  return (
    <LeagueSessionContext.Provider value={value}>
      {children}
    </LeagueSessionContext.Provider>
  );
}

export function useLeagueSession(): LeagueSessionContextValue {
  const ctx = React.useContext(LeagueSessionContext);
  if (!ctx) {
    throw new Error(
      "useLeagueSession must be used within a LeagueSessionProvider",
    );
  }
  return ctx;
}
