import type { LogRecord } from "@/lib/axiom/server";
import { unstable_cache } from "next/cache";
import { after } from "next/server";

import { emitWideEvent, normalizeError } from "@/lib/axiom/server";
import { Item as DustItem, getDustData } from "@/lib/dust";
import { League } from "@/lib/leagues";
import {
  AllowedUnique,
  getCurrencyData,
  getPriceData,
  Item as PriceItem,
} from "@/lib/prices";
import { ExternalApiError } from "@/lib/prices/external-api";
import { ITEMS_TO_IGNORE, ITEMS_TO_IGNORE_QUALITY } from "./ignore-list";

export type Item = {
  name: string;
  id: number;
  uniqueId: string;
  chaos: number;
  divine?: number;
  listingCount: number;
  variant?: string;
  calculatedDustValue: number;
  dustPerChaos: number;
  slots: number;
  dustPerChaosPerSlot: number;
  goldCost: number;
  type: AllowedUnique;
  icon: string;
  shouldCatalyst: boolean;
  qualityType: "q0" | "q20";
};

export type ItemDataStatus = {
  currency: {
    usedDefaultCatalystPrice: boolean;
  };
};

type PriceDataResult = Awaited<ReturnType<typeof getPriceData>>;

type CurrencyDataResult = Awaited<ReturnType<typeof getCurrencyData>>;

type ItemDataResult = {
  items: Item[];
  lastUpdated: number;
  lowStockThreshold: number;
  divinePriceThreshold: number | null;
  dataStatus: ItemDataStatus;
};

type ItemDataFetchContext = {
  prices: PriceDataResult["context"] | Record<string, never>;
  currency: CurrencyDataResult["context"] | Record<string, never>;
};

type ItemDataBuildStats = {
  itemCount: number;
  missingDustCount: number;
  missingDustExamples: string[];
  ignoredItemCount: number;
  lowStockThreshold: number;
  divinePriceThreshold: number | null;
  usedDefaultCatalystPrice: boolean;
};

type ItemDataBuildResult = {
  data: ItemDataResult;
  stats: ItemDataBuildStats;
};

const emptyFetchContext: Record<string, never> = {};

const createUniqueId = (name: string, variant?: string) =>
  `${name}${variant ? `-${variant}` : ""}`;

const getRejectedFetchContext = <TContext extends object>(
  error: unknown,
  target: "prices" | "currency",
): TContext | Record<string, never> => {
  if (!(error instanceof ExternalApiError)) {
    return emptyFetchContext;
  }

  const context = error.context?.[target];
  if (context != null && typeof context === "object") {
    return context as TContext;
  }

  return emptyFetchContext;
};

const createItemDataFetchContext = (
  priceResult: PromiseSettledResult<PriceDataResult>,
  currencyResult: PromiseSettledResult<CurrencyDataResult>,
): ItemDataFetchContext => ({
  prices:
    priceResult.status === "fulfilled"
      ? priceResult.value.context
      : getRejectedFetchContext<PriceDataResult["context"]>(
          priceResult.reason,
          "prices",
        ),
  currency:
    currencyResult.status === "fulfilled"
      ? currencyResult.value.context
      : getRejectedFetchContext<CurrencyDataResult["context"]>(
          currencyResult.reason,
          "currency",
        ),
});

const createItemDataFetchError = (
  priceResult: PromiseSettledResult<PriceDataResult>,
  currencyResult: PromiseSettledResult<CurrencyDataResult>,
): unknown => {
  const errors = [
    ...(priceResult.status === "rejected" ? [priceResult.reason] : []),
    ...(currencyResult.status === "rejected" ? [currencyResult.reason] : []),
  ];

  if (errors.length === 0) {
    throw new Error("Item data fetch error requires at least one rejection");
  }

  return errors.length === 1
    ? errors[0]
    : new AggregateError(errors, "Item data fetch failed");
};

const buildItemDataResult = (
  priceData: PriceDataResult["items"],
  currencyData: CurrencyDataResult["data"],
): ItemDataBuildResult => {
  const dustData = getDustData();
  const dustMap = new Map(dustData.map((d) => [d.name, d]));
  const missingDustExamples: string[] = [];
  let missingDustCount = 0;
  let ignoredItemCount = 0;

  // Fallback to 1c when catalyst data is unavailable.
  const catalystPrice = currencyData.catalyst
    ? currencyData.catalyst.primaryValue
    : 1;

  // Threshold is 1 divine worth of chaos (divineRate is divines per 1 chaos).
  const divinePriceThreshold = currencyData.divineRate
    ? Math.round(1 / currencyData.divineRate)
    : null;

  const merged: Item[] = [];
  let id = 0;

  for (const priceItem of priceData) {
    if (ITEMS_TO_IGNORE.includes(priceItem.name)) {
      ignoredItemCount += 1;
      continue;
    }

    const dustItem = dustMap.get(priceItem.name);
    if (dustItem === undefined) {
      missingDustCount += 1;
      if (missingDustExamples.length < 10) {
        missingDustExamples.push(priceItem.name);
      }
      continue;
    }

    const {
      dustValue: calculatedDustValue,
      dustPerChaos,
      catalyst: shouldCatalyst,
      qualityType,
    } = calculateDustEfficiency(priceItem, dustItem, catalystPrice);

    merged.push({
      id: id++,
      uniqueId: createUniqueId(priceItem.name, priceItem.baseType),
      name: priceItem.name,
      chaos: priceItem.chaos,
      divine: priceItem.divine,
      listingCount: priceItem.listingCount,
      variant: priceItem.baseType,
      calculatedDustValue,
      dustPerChaos: Math.round(dustPerChaos),
      slots: dustItem.slots,
      dustPerChaosPerSlot: Math.round(dustPerChaos / dustItem.slots),
      goldCost: dustItem.goldCost,
      type: priceItem.type,
      icon: priceItem.icon,
      shouldCatalyst,
      qualityType,
    });
  }

  const lowStockThreshold = calculateLowStockThreshold(merged);
  const usedDefaultCatalystPrice = currencyData.catalyst === null;
  const lastUpdated = Date.now();

  return {
    data: {
      items: merged,
      lastUpdated,
      lowStockThreshold,
      divinePriceThreshold,
      dataStatus: {
        currency: {
          usedDefaultCatalystPrice,
        },
      } satisfies ItemDataStatus,
    },
    stats: {
      itemCount: merged.length,
      missingDustCount,
      missingDustExamples,
      ignoredItemCount,
      lowStockThreshold,
      divinePriceThreshold,
      usedDefaultCatalystPrice,
    },
  };
};

const emitItemDataFetchEventSafely = async ({
  league,
  durationMs,
  fetchContext,
  stats,
  error,
}: {
  league: League;
  durationMs: number;
  fetchContext: ItemDataFetchContext;
  stats?: ItemDataBuildStats;
  error?: unknown;
}): Promise<void> => {
  const outcome = error === undefined ? "success" : "error";
  const event: LogRecord = {
    event_name: "item_data_fetch",
    message:
      outcome === "success"
        ? "Item data fetch completed"
        : "Item data fetch failed",
    operation: "getItems",
    league,
    outcome,
    duration_ms: durationMs,
    prices: fetchContext.prices,
    currency: fetchContext.currency,
  };

  if (stats !== undefined) {
    event.item_count = stats.itemCount;
    event.missing_dust_count = stats.missingDustCount;
    event.missing_dust_examples = stats.missingDustExamples;
    event.ignored_item_count = stats.ignoredItemCount;
    event.low_stock_threshold = stats.lowStockThreshold;
    event.divine_price_threshold = stats.divinePriceThreshold;
    event.currency_fallback_used = stats.usedDefaultCatalystPrice;
  } else {
    event.error = normalizeError(error);
  }

  try {
    await emitWideEvent(event);
  } catch (telemetryError) {
    console.error("Failed to emit item_data_fetch telemetry", telemetryError, {
      event_name: "item_data_fetch",
      league,
      outcome,
    });
  }
};

const scheduleItemDataFetchEvent = (payload: {
  league: League;
  durationMs: number;
  fetchContext: ItemDataFetchContext;
  stats?: ItemDataBuildStats;
  error?: unknown;
}) => {
  // `getItems()` only runs from the main league-route RSC path. Using
  // `after()` keeps telemetry off the render/prerender path while still using
  // Next/Vercel waitUntil semantics, so the background flush can finish before
  // the invocation fully closes.
  after(() => emitItemDataFetchEventSafely(payload));
};

const uncached__getItems = async (league: League): Promise<ItemDataResult> => {
  const startedAt = Date.now();
  const [priceResult, currencyResult] = await Promise.allSettled([
    getPriceData(league),
    getCurrencyData(league),
  ]);
  const fetchContext = createItemDataFetchContext(priceResult, currencyResult);

  try {
    if (
      priceResult.status !== "fulfilled" ||
      currencyResult.status !== "fulfilled"
    ) {
      throw createItemDataFetchError(priceResult, currencyResult);
    }

    const result = buildItemDataResult(
      priceResult.value.items,
      currencyResult.value.data,
    );

    scheduleItemDataFetchEvent({
      league,
      durationMs: Date.now() - startedAt,
      fetchContext,
      stats: result.stats,
    });

    return result.data;
  } catch (error) {
    scheduleItemDataFetchEvent({
      league,
      durationMs: Date.now() - startedAt,
      fetchContext,
      error,
    });

    throw error;
  }
};

function isQuiver(item: PriceItem) {
  return item.itemType === "Quiver";
}

function isItemInQualityIgnoreList(item: PriceItem) {
  return ITEMS_TO_IGNORE_QUALITY.includes(item.name);
}

function isNonQualityItem(item: PriceItem) {
  return isQuiver(item) || isItemInQualityIgnoreList(item);
}

function calculateDustEfficiency(
  priceItem: PriceItem,
  dustItem: DustItem,
  catalystPrice: number,
): {
  dustValue: number;
  dustPerChaos: number;
  catalyst: boolean;
  qualityType: "q0" | "q20";
} {
  if (isNonQualityItem(priceItem)) {
    // Items that cannot have quality (quivers and specific items)
    return {
      dustValue: dustItem.dustValIlvl84,
      dustPerChaos: dustItem.dustValIlvl84 / priceItem.chaos,
      catalyst: false,
      qualityType: "q0",
    };
  }

  if (priceItem.type !== "UniqueAccessory") {
    // Weapon or Armor, always cheap to quality up
    return {
      dustValue: dustItem.dustValIlvl84Q20,
      dustPerChaos: dustItem.dustValIlvl84Q20 / priceItem.chaos,
      catalyst: false,
      qualityType: "q20",
    };
  }

  const costToAddQuality = catalystPrice * 20; // 20 catalysts
  const defaultDustPerChaos = dustItem.dustValIlvl84 / priceItem.chaos;
  const catalystedDustPerChaos =
    dustItem.dustValIlvl84Q20 / (priceItem.chaos + costToAddQuality);

  if (catalystedDustPerChaos > defaultDustPerChaos) {
    // Quality up is worth it
    return {
      dustValue: dustItem.dustValIlvl84Q20,
      dustPerChaos: catalystedDustPerChaos,
      catalyst: true,
      qualityType: "q20",
    };
  }

  // Quality up is not worth it
  return {
    dustValue: dustItem.dustValIlvl84,
    dustPerChaos: defaultDustPerChaos,
    catalyst: false,
    qualityType: "q0",
  };
}

/**
 * Calculates the low stock threshold as the 10th percentile of listing counts across items.
 * This value helps identify items with potentially low market availability.
 * Falls back to 1 for empty or invalid inputs to ensure a usable threshold.
 * @param merged - Array of merged item data containing listing counts.
 * @returns The calculated low stock threshold (minimum 1).
 */
function calculateLowStockThreshold(items: Item[]) {
  if (!Array.isArray(items) || items.length === 0) {
    return 1;
  }

  const listingCounts = items
    .map((item) => item.listingCount)
    .sort((a, b) => a - b);

  const PERCENTILE = 0.1;
  const index = Math.floor(PERCENTILE * (listingCounts.length - 1));
  const candidate = listingCounts[index];
  return Math.max(1, candidate ?? 1);
}

export const getItems = async (league: League) => {
  return unstable_cache(async () => uncached__getItems(league), [league], {
    tags: [`items-${league}`],
    revalidate: 1800, // 30 minutes
  })();
};
