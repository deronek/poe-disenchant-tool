"use client";

import { useAdvancedSettings } from "@/components/advanced-settings-context";
import { useLeagueSession } from "@/components/league-session-context";
import { createTradeLink } from "@/lib/trade-link";

export function useTradeLink(name: string): string {
  const { settings } = useAdvancedSettings();
  const { league } = useLeagueSession();
  return createTradeLink(name, league, settings);
}
