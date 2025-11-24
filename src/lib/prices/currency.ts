import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";

import { getLeagueApiName, League } from "../leagues";
import { isDevelopment } from "../utils-server";
import { USER_AGENT } from "./utils";

// TypeScript interfaces for poe.ninja API response
const CurrencyLineSchema = z.object({
  id: z.string(),
  primaryValue: z.number().nonnegative().nullable().optional(),
});

const CurrencyOverviewResponseSchema = z.object({
  lines: z.optional(z.array(CurrencyLineSchema)),
});

type CurrencyOverviewResponse = z.infer<typeof CurrencyOverviewResponseSchema>;

// Export types for external use
export type CatalystItem = {
  id: string;
  primaryValue: number;
};

// Function to fetch currency data from poe.ninja API
const getCurrencyData = async (
  league: League,
): Promise<CurrencyOverviewResponse> => {
  const leagueApiName = getLeagueApiName(league);
  const url = `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(leagueApiName)}&type=Currency`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return CurrencyOverviewResponseSchema.parse(json);
  } catch (error) {
    console.error(`Failed to fetch currency data for ${league}:`, error);
    return { lines: [] };
  }
};

// Function to filter catalyst items
const getCatalystItems = async (league: League): Promise<CatalystItem[]> => {
  const currencyData = await getCurrencyData(league);

  if (!currencyData.lines) {
    return [];
  }

  return (
    currencyData.lines
      .filter(
        (line) =>
          line.id.toLowerCase().endsWith("-catalyst") &&
          line.id.toLowerCase() !== "tainted-catalyst",
      )
      // Handles both null and undefined cases here
      .filter((line) => line.primaryValue != null)
      .map((line) => ({
        id: line.id,
        primaryValue: line.primaryValue!,
      }))
  );
};

// Function to find cheapest catalyst
const uncached__getCheapestCatalyst = async (
  league: League,
): Promise<CatalystItem | null> => {
  if (isDevelopment) {
    return {
      id: "dev-catalyst",
      primaryValue: 1,
    };
  }
  const catalystItems = await getCatalystItems(league);

  const validItems = catalystItems.filter((i) => i.primaryValue !== 0);
  if (validItems.length === 0) {
    console.warn("No valid catalysts items found for league", league);
    return null;
  }

  const cheapest = validItems.reduce((min, item) =>
    item.primaryValue < min.primaryValue ? item : min,
  );

  console.log(
    `Cheapest catalyst: ${cheapest.id} at ${cheapest.primaryValue} in league ${league}`,
  );
  return cheapest;
};

export const getCheapestCatalyst = async (
  league: League,
): Promise<CatalystItem | null> => {
  return unstable_cache(
    async () => uncached__getCheapestCatalyst(league),
    [league],
    {
      tags: [`cheapest-catalyst-${league}`],
      revalidate: 86_400, // 1 day
    },
  )();
};
