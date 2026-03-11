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

const CurrencyCoreRatesSchema = z.object({
  divine: z.number().nonnegative().optional(),
});

const CurrencyCoreSchema = z.object({
  rates: CurrencyCoreRatesSchema,
});

const CurrencyOverviewResponseSchema = z.object({
  lines: z.optional(z.array(CurrencyLineSchema)),
  core: z.optional(CurrencyCoreSchema),
});

export type CurrencyOverviewResponse = z.infer<
  typeof CurrencyOverviewResponseSchema
>;

// Export types for external use
export type CatalystItem = {
  id: string;
  primaryValue: number;
};

export type CurrencyData = {
  catalyst: CatalystItem | null;
  divineRate: number | null;
};

// Fetch currency data from poe.ninja API
const fetchCurrencyData = async (
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
    return {};
  }
};

// Process raw currency data into useful format
const processCurrencyData = (
  currencyData: CurrencyOverviewResponse,
  league: League,
): CurrencyData => {
  // Get cheapest catalyst
  let catalyst: CatalystItem | null = null;
  if (currencyData.lines) {
    const catalystItems = currencyData.lines
      .filter(
        (line) =>
          line.id.toLowerCase().endsWith("-catalyst") &&
          line.id.toLowerCase() !== "tainted-catalyst",
      )
      .filter((line) => line.primaryValue != null)
      .map((line) => ({
        id: line.id,
        primaryValue: line.primaryValue!,
      }));

    const validItems = catalystItems.filter((i) => i.primaryValue !== 0);
    if (validItems.length > 0) {
      catalyst = validItems.reduce((min, item) =>
        item.primaryValue < min.primaryValue ? item : min,
      );
    }
  }

  if (catalyst === null) {
    console.warn("No valid catalysts items found for league", league);
  }

  // Get divine rate (null if not available or zero)
  const divineRate = currencyData.core?.rates.divine || null;
  if (divineRate === null) {
    console.warn("No divine rate found for league", league);
  }

  console.log(
    `Currency data for ${league}: cheapest catalyst: ${catalyst?.id} at ${catalyst?.primaryValue}, divine rate: ${divineRate}`,
  );

  return {
    catalyst,
    divineRate,
  };
};

// Uncached version that does the actual work
const uncached__getCurrencyData = async (
  league: League,
): Promise<CurrencyData> => {
  if (isDevelopment) {
    return {
      catalyst: {
        id: "dev-catalyst",
        primaryValue: 1,
      },
      divineRate: 0.005, // 200 chaos per divine
    };
  }

  const rawData = await fetchCurrencyData(league);
  return processCurrencyData(rawData, league);
};

export const getCurrencyData = async (
  league: League,
): Promise<CurrencyData> => {
  return unstable_cache(
    async () => uncached__getCurrencyData(league),
    [league],
    {
      tags: [`currency-data-${league}`],
      revalidate: 86_400, // 1 day
    },
  )();
};
