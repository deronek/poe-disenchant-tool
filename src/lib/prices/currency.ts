import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";

import type { ApiResult } from "./external-api";
import { getLeagueApiName, League } from "../leagues";
import { isDevelopment } from "../utils-server";
import {
  createExternalApiError,
  getApiResultStatusCode,
  toExternalApiErrorContext,
} from "./external-api";
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

export type CurrencyFetchContext = {
  source: "poe.ninja";
  status_code?: number;
  fetch_failed: boolean;
  has_catalyst: boolean;
  has_divine_rate: boolean;
  error?: ReturnType<typeof toExternalApiErrorContext>;
};

export type CurrencyDataResult = {
  data: CurrencyData;
  context: CurrencyFetchContext;
};

const createCurrencyFetchError = ({
  league,
  status,
  kind,
  message,
  cause,
}: {
  league: League;
  status?: number;
  kind: "http" | "network" | "schema";
  message: string;
  cause?: unknown;
}) => {
  return createExternalApiError({
    source: "currency",
    league,
    resource: "Currency",
    kind,
    status,
    message,
    cause,
  });
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
        error: createCurrencyFetchError({
          league,
          status: response.status,
          kind: "http",
          message: `Failed to fetch currency data for ${leagueApiName}: ${response.status} ${response.statusText}`,
        }),
      };
    }

    let json: unknown;

    try {
      json = await response.json();
    } catch (error) {
      return {
        ok: false,
        error: createCurrencyFetchError({
          league,
          status: response.status,
          kind: "schema",
          message: `Malformed JSON for currency payload for ${leagueApiName}`,
          cause: error,
        }),
      };
    }

    const parsed = CurrencyOverviewResponseSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        error: createCurrencyFetchError({
          league,
          status: response.status,
          kind: "schema",
          message: `Invalid currency payload for ${leagueApiName}`,
          cause: parsed.error,
        }),
      };
    }

    return {
      ok: true,
      data: parsed.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: createCurrencyFetchError({
        league,
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

  // Get divine rate (null if not available or zero)
  const divineRate = currencyData.core?.rates.divine || null;

  return {
    catalyst,
    divineRate,
  };
};

// Uncached version that does the actual work
const uncached__getCurrencyData = async (
  league: League,
): Promise<CurrencyDataResult> => {
  if (isDevelopment) {
    return {
      data: {
        catalyst: {
          id: "dev-catalyst",
          primaryValue: 1,
        },
        divineRate: 0.005, // 200 chaos per divine
      },
      context: {
        source: "poe.ninja",
        status_code: 200,
        fetch_failed: false,
        has_catalyst: true,
        has_divine_rate: true,
      },
    };
  }

  const rawData = await fetchCurrencyData(league);
  if (!rawData.ok) {
    return {
      data: { catalyst: null, divineRate: null },
      context: {
        source: "poe.ninja",
        status_code: getApiResultStatusCode(rawData),
        fetch_failed: true,
        has_catalyst: false,
        has_divine_rate: false,
        error: toExternalApiErrorContext(rawData.error),
      },
    };
  }

  const data = processCurrencyData(rawData.data);
  return {
    data,
    context: {
      source: "poe.ninja",
      status_code: getApiResultStatusCode(rawData),
      fetch_failed: false,
      has_catalyst: data.catalyst !== null,
      has_divine_rate: data.divineRate !== null,
    },
  };
};

export const getCurrencyData = async (
  league: League,
): Promise<CurrencyDataResult> => {
  return unstable_cache(
    async () => uncached__getCurrencyData(league),
    [league],
    {
      tags: [`currency-data-${league}`],
      revalidate: 86_400, // 1 day
    },
  )();
};
