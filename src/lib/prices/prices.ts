import "server-only";

import fs from "fs";
import path from "path";
import { z } from "zod";

import type { AllowedUnique } from "./allowed-types";
import type { ApiResult } from "./external-api";
import { getLeagueApiName, League } from "../leagues";
import { isBuildTime, isDevelopment } from "../utils-server";
import { allowedUniqueTypes } from "./allowed-types";
import {
  createExternalApiError,
  ExternalApiError,
  getApiResultStatusCode,
  toExternalApiErrorContext,
} from "./external-api";
import { USER_AGENT } from "./utils";

/**
 * Ensures chaos price is always positive
 */
const ensureValidChaosPrice = (price: number): number => {
  return price <= 0 ? 0.01 : price;
};

const LineSchema = z.object({
  name: z.string(),
  chaosValue: z.number(),
  divineValue: z.number().optional(),
  baseType: z.string(),
  icon: z.url(),
  listingCount: z.int().optional().default(0),
  detailsId: z.string(),
  itemType: z.string().optional(), // Some items have no itemType
});

type PriceLine = z.infer<typeof LineSchema> & { itemType: string };

const ItemOverviewResponseSchema = z.object({
  lines: z.optional(
    z.array(LineSchema).transform((items): PriceLine[] =>
      // Filter out items with no itemType
      items.filter((item): item is PriceLine => item.itemType !== undefined),
    ),
  ),
});

type ItemOverviewResponse = z.infer<typeof ItemOverviewResponseSchema>;

export type InternalItem = {
  type: AllowedUnique;
  name: string;
  chaos: number;
  divine?: number;
  baseType: string;
  icon: string;
  listingCount: number;
  detailsId: string;
  itemType: string;
};

export type Item = Omit<InternalItem, "detailsId">;

const toInternalItem = (
  type: AllowedUnique,
  line: PriceLine,
): InternalItem => ({
  type,
  name: line.name,
  chaos: ensureValidChaosPrice(line.chaosValue),
  divine: line.divineValue,
  baseType: line.baseType,
  icon: line.icon,
  listingCount: line.listingCount,
  detailsId: line.detailsId,
  itemType: line.itemType,
});

export type PriceFetchContext = {
  source: "poe.ninja";
  types_requested: AllowedUnique[];
  types_completed: AllowedUnique[];
  resources_failed: AllowedUnique[];
  line_counts_by_resource: Partial<Record<AllowedUnique, number>>;
  status_codes_by_resource: Partial<Record<AllowedUnique, number>>;
  errors_by_resource: Partial<
    Record<AllowedUnique, ReturnType<typeof toExternalApiErrorContext>>
  >;
  item_count: number;
  used_build_fallback: boolean;
};

export type PriceDataResult = {
  items: Item[];
  context: PriceFetchContext;
};

type PriceFetchOutcome =
  | {
      type: AllowedUnique;
      ok: true;
      lineCount: number;
      statusCode?: number;
    }
  | {
      type: AllowedUnique;
      ok: false;
      error: ExternalApiError;
      statusCode?: number;
    };

// Parse dev data globally in development only
const devDataCache = {} as Record<AllowedUnique, ItemOverviewResponse>;

if (isDevelopment) {
  const loadData = (type: string): ItemOverviewResponse => {
    const filePath = path.join(
      process.cwd(),
      "data/prices/dev-data",
      `${type}.json`,
    );

    try {
      const data = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(data);
      return ItemOverviewResponseSchema.parse(json);
    } catch (error) {
      console.warn(
        `Could not load dev data for ${type}, returning empty data`,
        error,
      );
      return { lines: [] };
    }
  };

  // Load all dev data at startup
  allowedUniqueTypes.forEach((type) => {
    devDataCache[type] = loadData(type);
  });
}

const getDevData = async (
  type: AllowedUnique,
): Promise<ItemOverviewResponse> => {
  // Return cached dev data
  return devDataCache[type];
};

const createPriceFetchError = ({
  league,
  resource,
  kind,
  message,
  status,
  cause,
}: {
  league: League;
  resource: string;
  kind: "http" | "network" | "schema" | "empty-data";
  message: string;
  status?: number;
  cause?: unknown;
}) => {
  return createExternalApiError({
    source: "prices",
    league,
    resource,
    kind,
    message,
    status,
    cause,
  });
};

const getProductionDataForType = async (
  type: AllowedUnique,
  league: League,
  leagueApiName: string,
): Promise<ApiResult<InternalItem[]>> => {
  const url = `https://poe.ninja/poe1/api/economy/stash/current/item/overview?type=${encodeURIComponent(type)}&league=${encodeURIComponent(leagueApiName)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
    if (!response.ok) {
      return {
        ok: false,
        error: createPriceFetchError({
          league,
          resource: type,
          kind: "http",
          status: response.status,
          message: `Failed to fetch ${type} prices for ${leagueApiName}: ${response.status} ${response.statusText}`,
        }),
      };
    }

    let json: unknown;

    try {
      json = await response.json();
    } catch (error) {
      return {
        ok: false,
        error: createPriceFetchError({
          league,
          resource: type,
          kind: "schema",
          status: response.status,
          message: `Malformed JSON for ${type} prices payload for ${leagueApiName}`,
          cause: error,
        }),
      };
    }
    const data = ItemOverviewResponseSchema.safeParse(json);

    if (!data.success) {
      return {
        ok: false,
        error: createPriceFetchError({
          league,
          resource: type,
          kind: "schema",
          status: response.status,
          message: `Invalid ${type} prices payload for ${leagueApiName}`,
          cause: data.error,
        }),
      };
    }

    if (!data.data.lines) {
      return {
        ok: false,
        error: createPriceFetchError({
          league,
          resource: type,
          kind: "empty-data",
          status: response.status,
          message: `No ${type} price lines returned for ${leagueApiName}`,
        }),
      };
    }

    const items: InternalItem[] = data.data.lines.map((line) =>
      toInternalItem(type, line),
    );

    return {
      ok: true,
      data: items,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: createPriceFetchError({
        league,
        resource: type,
        kind: "network",
        message: `Failed to fetch ${type} prices for ${leagueApiName}`,
        cause: error,
      }),
    };
  }
};

const getDevDataForType = async (
  type: AllowedUnique,
): Promise<InternalItem[]> => {
  const data = await getDevData(type);
  if (!data.lines) {
    console.warn(`No dev data returned for ${type}`);
    return [];
  }

  return data.lines.map((line) => toInternalItem(type, line));
};

const toPriceFetchOutcome = (
  result: ApiResult<InternalItem[]>,
  type: AllowedUnique,
): PriceFetchOutcome => {
  const statusCode = getApiResultStatusCode(result);

  if (!result.ok) {
    // Per-type failures always resolve as { ok: false } so the aggregate
    // caller is the only place that decides whether to continue (build) or
    // throw (runtime). We still preserve every failure in the final context.
    return { type, ok: false, error: result.error, statusCode };
  }

  return { type, ok: true, lineCount: result.data.length, statusCode };
};

const buildPriceFetchContext = ({
  outcomes,
  itemCount,
  usedBuildFallback = false,
}: {
  outcomes: readonly PriceFetchOutcome[];
  itemCount: number;
  usedBuildFallback?: boolean;
}): PriceFetchContext => {
  const typesCompleted: AllowedUnique[] = [];
  const resourcesFailed: AllowedUnique[] = [];
  const lineCountsByResource: PriceFetchContext["line_counts_by_resource"] = {};
  const statusCodesByResource: PriceFetchContext["status_codes_by_resource"] =
    {};
  const errorsByResource: PriceFetchContext["errors_by_resource"] = {};

  for (const outcome of outcomes) {
    if (outcome.ok) {
      typesCompleted.push(outcome.type);
      lineCountsByResource[outcome.type] = outcome.lineCount;
    } else {
      resourcesFailed.push(outcome.type);
      lineCountsByResource[outcome.type] = 0;
      errorsByResource[outcome.type] = toExternalApiErrorContext(outcome.error);
    }

    if (outcome.statusCode != null) {
      statusCodesByResource[outcome.type] = outcome.statusCode;
    }
  }

  return {
    source: "poe.ninja",
    types_requested: [...allowedUniqueTypes],
    types_completed: typesCompleted,
    resources_failed: resourcesFailed,
    line_counts_by_resource: lineCountsByResource,
    status_codes_by_resource: statusCodesByResource,
    errors_by_resource: errorsByResource,
    item_count: itemCount,
    used_build_fallback: usedBuildFallback,
  };
};

const withAggregatePriceContext = (
  error: ExternalApiError,
  context: PriceFetchContext,
) =>
  new ExternalApiError({
    source: error.source,
    league: error.league,
    resource: error.resource,
    kind: error.kind,
    status: error.status,
    message: error.message,
    cause: error.cause,
    context: {
      ...(error.context ?? {}),
      prices: context,
    },
  });

const toPublicItems = (items: InternalItem[]): Item[] => {
  const cheapestVariants = dedupeCheapestVariants(items);

  return cheapestVariants.map(
    (item): Item => ({
      type: item.type,
      name: item.name,
      chaos: item.chaos,
      divine: item.divine,
      baseType: item.baseType,
      icon: item.icon,
      listingCount: item.listingCount,
      itemType: item.itemType,
    }),
  );
};

const getDevelopmentPriceData = async (): Promise<PriceDataResult> => {
  const allTypes = allowedUniqueTypes as readonly AllowedUnique[];
  const allItems = await Promise.all(
    allTypes.map((type) => getDevDataForType(type)),
  );

  const combinedItems = allItems.flat();
  const publicItems = toPublicItems(combinedItems);
  const context = buildPriceFetchContext({
    outcomes: allTypes.map((type, index) => ({
      type,
      ok: true,
      lineCount: allItems[index].length,
    })),
    itemCount: publicItems.length,
  });

  return {
    items: publicItems,
    context,
  };
};

/**
 * Dedupes items by name, preferring non-special variants where possible.
 *
 * - Unique names: pass through unchanged.
 * - Duplicates with non-special: select cheapest non-special, sum listingCounts.
 * - Duplicates only special: select cheapest special.
 * - Specials detected if detailsId ends with "-relic", "-5l", or "-6l".
 * For equal chaos, retains the first item's other properties.
 * - Foulborn handling:
 *   - "Foulborn " prefix denotes a Foulborn variant.
 *   - If only Foulborn or non-Foulborn exist → take whichever exists.
 *   - If both exist:
 *     - Take cheaper price but keep non-Foulborn name.
 *     - Listing counts are summed across both variants.
 *
 * @param lines Array of InternalItem objects
 * @returns Deduped array with modified listingCount where summed.
 * @throws Error if input is null or undefined.
 * @throws Runtime error if array contains null/undefined items.
 */

// Helper functions for Foulborn detection
const isFoulbornItem = (name: string | undefined): boolean =>
  !!name && name.startsWith("Foulborn ");

const extractBaseName = (name: string | undefined): string =>
  name && isFoulbornItem(name) ? name.substring(9) : (name ?? "");

const getCheapest = (items: InternalItem[]) =>
  items.reduce((min, curr) => (curr.chaos < min.chaos ? curr : min));

const sumListings = (items: InternalItem[]) =>
  items.reduce((sum, i) => sum + i.listingCount, 0);

export const dedupeCheapestVariants = (
  lines: InternalItem[],
): InternalItem[] => {
  if (lines.length === 0) return [];

  const specialSuffixes = ["-relic", "-5l", "-6l"];
  const isSpecialSuffix = (item: InternalItem): boolean =>
    specialSuffixes.some((suffix) => item.detailsId.endsWith(suffix));

  // Step 1: Group by name and dedupe base + special suffixes
  const groupsByName = new Map<string, InternalItem[]>();
  for (const item of lines) {
    const name = item.name;
    if (!groupsByName.has(name)) groupsByName.set(name, []);
    groupsByName.get(name)!.push(item);
  }

  const result: InternalItem[] = [];

  for (const [, group] of groupsByName) {
    if (group.length === 1) {
      // Unique name - pass through unchanged
      result.push(group[0]);
      continue;
    }

    const nonSpecialItems = group.filter((item) => !isSpecialSuffix(item));
    let chosenItem: InternalItem;
    let totalListingCount: number;

    if (nonSpecialItems.length > 0) {
      // Keep only non-special items: take cheapest and merge their listing counts
      chosenItem = getCheapest(nonSpecialItems);
      totalListingCount = sumListings(nonSpecialItems);
    } else {
      // Only special suffix items exist: keep cheapest special's own listing count
      chosenItem = getCheapest(group);
      totalListingCount = chosenItem.listingCount;
    }

    result.push({
      ...chosenItem,
      listingCount: totalListingCount,
    });
  }

  // Step 2: Deduplicate Foulborn variants based on base name
  const hasFoulbornItems = result.some((item) => isFoulbornItem(item.name));
  if (hasFoulbornItems) {
    const foulbornGroups = new Map<string, InternalItem[]>();
    for (const item of result) {
      const baseName = extractBaseName(item.name);
      if (!foulbornGroups.has(baseName)) foulbornGroups.set(baseName, []);
      foulbornGroups.get(baseName)!.push(item);
    }

    const finalResult: InternalItem[] = [];

    for (const [, items] of foulbornGroups.entries()) {
      const regulars = items.filter((i) => !isFoulbornItem(i.name));
      const foulborns = items.filter((i) => isFoulbornItem(i.name));

      // Case 1: Only one type exists → use base name (without Foulborn prefix)
      if (regulars.length === 0 || foulborns.length === 0) {
        const cheapestItem = getCheapest(items);
        finalResult.push({
          ...cheapestItem,
          name: extractBaseName(cheapestItem.name),
          listingCount: sumListings(items),
        });
        continue;
      }

      // Case 2: Both exist → merge into one, using cheaper price
      const cheapestRegular = getCheapest(regulars);
      const cheapestFoulborn = getCheapest(foulborns);
      const cheapestChaos = Math.min(
        cheapestRegular.chaos,
        cheapestFoulborn.chaos,
      );

      // Get the divine price corresponding to the cheapest chaos price
      let cheapestDivine: number | undefined;
      if (cheapestRegular.chaos <= cheapestFoulborn.chaos) {
        cheapestDivine = cheapestRegular.divine;
      } else {
        cheapestDivine = cheapestFoulborn.divine;
      }

      finalResult.push({
        ...(cheapestRegular.chaos <= cheapestFoulborn.chaos
          ? cheapestRegular
          : cheapestFoulborn),
        name: cheapestRegular.name, // always keep non-Foulborn name
        chaos: cheapestChaos,
        divine: cheapestDivine, // ensure we set the correct divine price
        listingCount: sumListings(items), // aggregate listings across both
      });
    }

    result.length = 0;
    result.push(...finalResult);
  }

  // Step 3: Dev verification
  if (isDevelopment) {
    const names = result.map((i) => i.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      console.warn("Duplicate names after deduping:", [
        ...new Set(names.filter((n, i) => names.indexOf(n) !== i)),
      ]);
    } else {
      console.log(`Deduping successful: ${uniqueNames.size} unique names`);
    }
  }

  return result;
};

const uncached__getPriceData = async (
  league: League,
): Promise<PriceDataResult> => {
  if (isDevelopment) {
    return getDevelopmentPriceData();
  }

  const leagueApiName = getLeagueApiName(league);
  const allTypes = allowedUniqueTypes as readonly AllowedUnique[];
  const allItems = await Promise.all(
    allTypes.map((type) =>
      getProductionDataForType(type, league, leagueApiName),
    ),
  );

  const failures = allItems.filter(
    (result): result is Extract<ApiResult<InternalItem[]>, { ok: false }> =>
      !result.ok,
  );

  const combinedItems = allItems.flatMap((result) =>
    result.ok ? result.data : [],
  );

  const publicItems = toPublicItems(combinedItems);
  const context = buildPriceFetchContext({
    outcomes: allItems.map((result, index) =>
      toPriceFetchOutcome(result, allTypes[index]),
    ),
    itemCount: publicItems.length,
    // `used_build_fallback` marks the fully empty build-time fallback case.
    // Partial build-time degradation is still intentional and is represented by
    // `resources_failed` plus the per-resource status/error maps in `context`.
    usedBuildFallback: isBuildTime && combinedItems.length === 0,
  });

  if (!isBuildTime && failures.length > 0) {
    // Build-time prerendering intentionally keeps any successful upstream
    // resources so page generation is never blocked on partial poe.ninja
    // availability.
    //
    // Runtime refreshes are stricter: any missing price resource fails the
    // refresh so Next keeps serving the last good cached/prerendered page
    // instead of overwriting it with partial data. We still attach the full
    // aggregate failure context for logging and inspection.
    throw withAggregatePriceContext(failures[0].error, context);
  }

  // The fully empty build-time fallback is also intentional so deployment and
  // prerender can complete even when the third-party API is completely down.
  // Runtime refreshes must fail closed here for the same reason as partial
  // failures above: never replace an existing cached page with no data.
  if (!isBuildTime && combinedItems.length === 0) {
    throw withAggregatePriceContext(
      createPriceFetchError({
        league,
        resource: "all-types",
        kind: "empty-data",
        message: `Price fetch completed with zero items for ${leagueApiName}`,
      }),
      context,
    );
  }

  return {
    items: publicItems,
    context,
  };
};

export const getPriceData = uncached__getPriceData;
