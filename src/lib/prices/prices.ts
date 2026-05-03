import "server-only";

import fs from "fs";
import path from "path";
import { z } from "zod";

import type { AllowedUnique } from "./allowed-types";
import { getLeagueApiName, League } from "../leagues";
import { isBuildTime, isDevelopment } from "../utils-server";
import { allowedUniqueTypes } from "./allowed-types";
import { ExternalApiError, toExternalApiErrorContext } from "./external-api";
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
  listingCount: z.int(),
  detailsId: z.string(),
  itemType: z.string(),
});

const ItemOverviewResponseSchema = z.object({
  lines: z.optional(z.array(LineSchema)),
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
  error?: ReturnType<typeof toExternalApiErrorContext>;
};

export type PriceDataResult = {
  items: Item[];
  context: PriceFetchContext;
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
  return new ExternalApiError({
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
): Promise<
  | { ok: true; items: InternalItem[]; statusCode?: number }
  | {
      ok: false;
      items: [];
      error: ExternalApiError;
      statusCode?: number;
    }
> => {
  const url = `https://poe.ninja/poe1/api/economy/stash/current/item/overview?type=${encodeURIComponent(type)}&league=${encodeURIComponent(leagueApiName)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
    if (!response.ok) {
      throw createPriceFetchError({
        league,
        resource: type,
        kind: "http",
        status: response.status,
        message: `Failed to fetch ${type} prices for ${leagueApiName}: ${response.status} ${response.statusText}`,
      });
    }

    const json = await response.json();
    const data = ItemOverviewResponseSchema.safeParse(json);

    if (!data.success) {
      throw createPriceFetchError({
        league,
        resource: type,
        kind: "schema",
        message: `Invalid ${type} prices payload for ${leagueApiName}`,
        cause: data.error,
      });
    }

    if (!data.data.lines) {
      throw createPriceFetchError({
        league,
        resource: type,
        kind: "empty-data",
        message: `No ${type} price lines returned for ${leagueApiName}`,
      });
    }

    const items: InternalItem[] = data.data.lines.map((line) => ({
      type,
      name: line.name,
      chaos: ensureValidChaosPrice(line.chaosValue),
      divine: line.divineValue,
      baseType: line.baseType,
      icon: line.icon,
      listingCount: line.listingCount,
      detailsId: line.detailsId,
      itemType: line.itemType,
    }));

    return { ok: true, items, statusCode: response.status };
  } catch (error) {
    const wrappedError =
      error instanceof ExternalApiError
        ? error
        : createPriceFetchError({
            league,
            resource: type,
            kind: "network",
            message: `Failed to fetch ${type} prices for ${leagueApiName}`,
            cause: error,
          });

    if (isBuildTime) {
      return {
        ok: false,
        items: [],
        error: wrappedError,
        statusCode: wrappedError.status,
      };
    }

    throw wrappedError;
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

  return data.lines.map((line) => ({
    type,
    name: line.name,
    chaos: ensureValidChaosPrice(line.chaosValue),
    divine: line.divineValue,
    baseType: line.baseType,
    icon: line.icon,
    listingCount: line.listingCount,
    detailsId: line.detailsId,
    itemType: line.itemType,
  }));
};

const createEmptyPriceContext = (): PriceFetchContext => ({
  source: "poe.ninja",
  types_requested: [...allowedUniqueTypes],
  types_completed: [],
  resources_failed: [],
  line_counts_by_resource: {},
  status_codes_by_resource: {},
  errors_by_resource: {},
  item_count: 0,
  used_build_fallback: false,
});

const recordSuccessfulTypeFetch = (
  context: PriceFetchContext,
  type: AllowedUnique,
  items: InternalItem[],
  statusCode?: number,
) => {
  context.types_completed.push(type);
  context.line_counts_by_resource[type] = items.length;
  if (statusCode != null) {
    context.status_codes_by_resource[type] = statusCode;
  }
};

const recordFailedTypeFetch = (
  context: PriceFetchContext,
  type: AllowedUnique,
  error: ExternalApiError,
  statusCode?: number,
) => {
  context.resources_failed.push(type);
  context.line_counts_by_resource[type] = 0;
  const errorContext = toExternalApiErrorContext(error);
  context.errors_by_resource[type] = errorContext;
  context.error ??= errorContext;
  if (statusCode != null) {
    context.status_codes_by_resource[type] = statusCode;
  }
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
  const context = createEmptyPriceContext();
  const allItems = await Promise.all(
    allTypes.map((type) => getDevDataForType(type)),
  );

  allTypes.forEach((type, index) => {
    context.types_completed.push(type);
    context.line_counts_by_resource[type] = allItems[index].length;
  });

  const combinedItems = allItems.flat();
  context.item_count = combinedItems.length;

  return {
    items: toPublicItems(combinedItems),
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
  const context = createEmptyPriceContext();

  try {
    const allItems = await Promise.allSettled(
      allTypes.map((type) =>
        getProductionDataForType(type, league, leagueApiName),
      ),
    );

    allItems.forEach((result, index) => {
      const type = allTypes[index];
      if (result.status === "rejected") {
        if (result.reason instanceof ExternalApiError) {
          recordFailedTypeFetch(
            context,
            type,
            result.reason,
            result.reason.status,
          );
        }
        return;
      }

      // Build-time fallback path only - production errors are handled by throwing, instead
      if (!result.value.ok) {
        recordFailedTypeFetch(
          context,
          type,
          result.value.error,
          result.value.statusCode,
        );
        return;
      }

      recordSuccessfulTypeFetch(
        context,
        type,
        result.value.items,
        result.value.statusCode,
      );
    });

    const firstRuntimeFailure = allItems.find(
      (entry): entry is PromiseRejectedResult => entry.status === "rejected",
    );
    if (firstRuntimeFailure?.reason instanceof ExternalApiError) {
      context.used_build_fallback = false;
      throw withAggregatePriceContext(firstRuntimeFailure.reason, context);
    }

    const combinedItems = allItems.flatMap((entry) =>
      entry.status === "fulfilled" && entry.value.ok ? entry.value.items : [],
    );
    context.item_count = combinedItems.length;

    // Build-time fallback keeps deployment unblocked when the external API is
    // not ready yet, but runtime refreshes must never replace cached data with
    // an empty or otherwise invalid dataset.
    if (!isBuildTime && combinedItems.length === 0) {
      throw createPriceFetchError({
        league,
        resource: "all-types",
        kind: "empty-data",
        message: `Price fetch completed with zero items for ${leagueApiName}`,
      });
    }

    context.used_build_fallback = isBuildTime && combinedItems.length === 0;

    return {
      items: toPublicItems(combinedItems),
      context,
    };
  } catch (error) {
    if (error instanceof ExternalApiError) {
      context.error = toExternalApiErrorContext(error);
      const resource = allowedUniqueTypes.includes(
        error.resource as AllowedUnique,
      )
        ? (error.resource as AllowedUnique)
        : undefined;

      if (resource) {
        if (!context.resources_failed.includes(resource)) {
          context.resources_failed.push(resource);
        }
        if (error.status != null) {
          context.status_codes_by_resource[resource] = error.status;
        }
      }
      throw withAggregatePriceContext(error, context);
    }
    throw error;
  }
};

export const getPriceData = uncached__getPriceData;
