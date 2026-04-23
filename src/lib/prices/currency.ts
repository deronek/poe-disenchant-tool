import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";

import type { ApiResult } from "./external-api";
import { getLeagueApiName, League } from "../leagues";
import { isDevelopment } from "../utils-server";
import { ExternalApiError, logExternalApiError } from "./external-api";
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
  error: ExternalApiError | null;
};

// Fetch currency data from poe.ninja API
const fetchCurrencyData = async (
  league: League,
): Promise<ApiResult<CurrencyOverviewResponse>> => {
  const leagueApiName = getLeagueApiName(league);
  const url = `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(leagueApiName)}&type=Currency`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: new ExternalApiError({
          source: "currency",
          league,
          resource: "Currency",
          kind: "http",
          status: response.status,
          message: `Failed to fetch currency data for ${leagueApiName}: ${response.status} ${response.statusText}`,
        }),
      };
    }

    const json = await response.json();
    const parsed = CurrencyOverviewResponseSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        error: new ExternalApiError({
          source: "currency",
          league,
          resource: "Currency",
          kind: "schema",
          message: `Invalid currency payload for ${leagueApiName}`,
          cause: parsed.error,
        }),
      };
    }

    return { ok: true, data: parsed.data };
  } catch (error) {
    return {
      ok: false,
      error: new ExternalApiError({
        source: "currency",
        league,
        resource: "Currency",
        kind: "network",
        message: `Failed to fetch currency data for ${leagueApiName}`,
        cause: error,
      }),
    };
  }
};

// Process raw currency data into useful format
const processCurrencyData = (
  currencyData: CurrencyOverviewResponse,
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

  const divineRate = currencyData.core?.rates.divine || null;

  return {
    catalyst,
    divineRate,
    error: null,
  };
};

const createFallbackCurrencyData = (
  error: ExternalApiError | null,
): CurrencyData => ({
  catalyst: null,
  divineRate: null,
  error,
});

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
      error: null,
    };
  }

  const rawData = await fetchCurrencyData(league);
  if (!rawData.ok) {
    logExternalApiError(rawData.error, "Currency fallback activated");
    return createFallbackCurrencyData(rawData.error);
  }

  return processCurrencyData(rawData.data);
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
