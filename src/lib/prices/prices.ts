import "server-only";

import fs from "fs";
import path from "path";
import { z } from "zod";

import type { AllowedUnique } from "./allowed-types";
import { getLeagueApiName, League } from "../leagues";
import { isDevelopment } from "../utils-server";
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

const createPriceLinesSchema = (parseErrors: z.ZodError[]) =>
  z.array(
    LineSchema.nullable().catch((context) => {
      if (parseErrors.length < 10) {
        parseErrors.push(
          new z.ZodError(
            context.issues.map((issue) => ({
              ...issue,
              path: issue.path ?? [],
              message: issue.message ?? "Invalid input",
            })),
          ),
        );
      }
      return null;
    }),
  );

const ItemOverviewResponseSchema = z.object({
  lines: z.optional(z.array(z.unknown())),
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
  invalid_line_counts_by_resource: Partial<Record<AllowedUnique, number>>;
  missing_item_type_counts_by_resource: Partial<Record<AllowedUnique, number>>;
  status_codes_by_resource: Partial<Record<AllowedUnique, number>>;
  errors_by_resource: Partial<
    Record<AllowedUnique, ReturnType<typeof toExternalApiErrorContext>>
  >;
  item_count: number;
};

export type PriceDataResult = {
  items: Item[];
  context: PriceFetchContext;
};

type PriceTypeData = {
  items: InternalItem[];
  invalidLineCount: number;
  missingItemTypeCount: number;
  parseError?: ExternalApiError;
};

type PriceTypeResult =
  | { ok: true; data: PriceTypeData; statusCode: number }
  | { ok: false; error: ExternalApiError; data?: PriceTypeData };

type PriceFetchOutcome =
  | {
      type: AllowedUnique;
      ok: true;
      lineCount: number;
      invalidLineCount: number;
      missingItemTypeCount: number;
      parseError?: ExternalApiError;
      statusCode?: number;
    }
  | {
      type: AllowedUnique;
      ok: false;
      error: ExternalApiError;
      invalidLineCount: number;
      missingItemTypeCount: number;
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

const parsePriceLines = ({
  type,
  league,
  lines,
  status,
}: {
  type: AllowedUnique;
  league: League;
  lines: unknown[];
  status?: number;
}): PriceTypeData => {
  const parseErrors: z.ZodError[] = [];
  let invalidLineCount = 0;
  const parsedLines = createPriceLinesSchema(parseErrors).parse(lines);

  const items: InternalItem[] = [];
  let missingItemTypeCount = 0;

  for (const line of parsedLines) {
    if (line === null) {
      invalidLineCount += 1;
      continue;
    }

    if (line.itemType === undefined) {
      missingItemTypeCount += 1;
      continue;
    }

    items.push(toInternalItem(type, { ...line, itemType: line.itemType }));
  }

  const parseError =
    invalidLineCount > 0
      ? createPriceFetchError({
          league,
          resource: type,
          kind: "schema",
          status,
          message: `Skipped ${invalidLineCount} invalid ${type} price lines for ${getLeagueApiName(league)}`,
          cause:
            parseErrors.length === 1
              ? parseErrors[0]
              : new AggregateError(parseErrors, `Invalid ${type} price lines`),
        })
      : undefined;

  return { items, invalidLineCount, missingItemTypeCount, parseError };
};

const getProductionDataForType = async (
  type: AllowedUnique,
  league: League,
  leagueApiName: string,
): Promise<PriceTypeResult> => {
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

    const parsedData = parsePriceLines({
      type,
      league,
      lines: data.data.lines,
      status: response.status,
    });

    if (parsedData.items.length === 0 && parsedData.parseError) {
      return { ok: false, error: parsedData.parseError, data: parsedData };
    }

    return {
      ok: true,
      data: parsedData,
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
  league: League,
): Promise<PriceTypeData> => {
  const data = await getDevData(type);
  if (!data.lines) {
    console.warn(`No dev data returned for ${type}`);
    return { items: [], invalidLineCount: 0, missingItemTypeCount: 0 };
  }

  return parsePriceLines({ type, league, lines: data.lines });
};

const toPriceFetchOutcome = (
  result: PriceTypeResult,
  type: AllowedUnique,
): PriceFetchOutcome => {
  const statusCode = getApiResultStatusCode(result);

  if (!result.ok) {
    return {
      type,
      ok: false,
      error: result.error,
      invalidLineCount: result.data?.invalidLineCount ?? 0,
      missingItemTypeCount: result.data?.missingItemTypeCount ?? 0,
      statusCode,
    };
  }

  return {
    type,
    ok: true,
    lineCount: result.data.items.length,
    invalidLineCount: result.data.invalidLineCount,
    missingItemTypeCount: result.data.missingItemTypeCount,
    parseError: result.data.parseError,
    statusCode,
  };
};

const buildPriceFetchContext = ({
  outcomes,
  itemCount,
}: {
  outcomes: readonly PriceFetchOutcome[];
  itemCount: number;
}): PriceFetchContext => {
  const typesCompleted: AllowedUnique[] = [];
  const resourcesFailed: AllowedUnique[] = [];
  const lineCountsByResource: PriceFetchContext["line_counts_by_resource"] = {};
  const invalidLineCountsByResource: PriceFetchContext["invalid_line_counts_by_resource"] =
    {};
  const missingItemTypeCountsByResource: PriceFetchContext["missing_item_type_counts_by_resource"] =
    {};
  const statusCodesByResource: PriceFetchContext["status_codes_by_resource"] =
    {};
  const errorsByResource: PriceFetchContext["errors_by_resource"] = {};

  for (const outcome of outcomes) {
    if (outcome.ok) {
      typesCompleted.push(outcome.type);
      lineCountsByResource[outcome.type] = outcome.lineCount;
      if (outcome.parseError) {
        errorsByResource[outcome.type] = toExternalApiErrorContext(
          outcome.parseError,
        );
      }
    } else {
      resourcesFailed.push(outcome.type);
      lineCountsByResource[outcome.type] = 0;
      errorsByResource[outcome.type] = toExternalApiErrorContext(outcome.error);
    }

    if (outcome.invalidLineCount > 0) {
      invalidLineCountsByResource[outcome.type] = outcome.invalidLineCount;
    }
    if (outcome.missingItemTypeCount > 0) {
      missingItemTypeCountsByResource[outcome.type] =
        outcome.missingItemTypeCount;
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
    invalid_line_counts_by_resource: invalidLineCountsByResource,
    missing_item_type_counts_by_resource: missingItemTypeCountsByResource,
    status_codes_by_resource: statusCodesByResource,
    errors_by_resource: errorsByResource,
    item_count: itemCount,
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

const getDevelopmentPriceData = async (
  league: League,
): Promise<PriceDataResult> => {
  const allTypes = allowedUniqueTypes as readonly AllowedUnique[];
  const allItems = await Promise.all(
    allTypes.map((type) => getDevDataForType(type, league)),
  );

  const combinedItems = allItems.flatMap((result) => result.items);
  const publicItems = toPublicItems(combinedItems);
  const context = buildPriceFetchContext({
    outcomes: allTypes.map((type, index) => ({
      type,
      ok: true,
      lineCount: allItems[index].items.length,
      invalidLineCount: allItems[index].invalidLineCount,
      missingItemTypeCount: allItems[index].missingItemTypeCount,
      parseError: allItems[index].parseError,
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
    return getDevelopmentPriceData(league);
  }

  const leagueApiName = getLeagueApiName(league);
  const allTypes = allowedUniqueTypes as readonly AllowedUnique[];
  const allItems = await Promise.all(
    allTypes.map((type) =>
      getProductionDataForType(type, league, leagueApiName),
    ),
  );

  const failures = allItems.filter(
    (result): result is Extract<PriceTypeResult, { ok: false }> => !result.ok,
  );

  const combinedItems = allItems.flatMap((result) =>
    result.ok ? result.data.items : [],
  );

  const publicItems = toPublicItems(combinedItems);
  const context = buildPriceFetchContext({
    outcomes: allItems.map((result, index) =>
      toPriceFetchOutcome(result, allTypes[index]),
    ),
    itemCount: publicItems.length,
  });

  if (publicItems.length === 0) {
    const error =
      failures[0]?.error ??
      createPriceFetchError({
        league,
        resource: "all-types",
        kind: "empty-data",
        message: `Price fetch completed with zero items for ${leagueApiName}`,
      });
    throw withAggregatePriceContext(error, context);
  }

  return {
    items: publicItems,
    context,
  };
};

export const getPriceData = uncached__getPriceData;
