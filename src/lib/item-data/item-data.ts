import type { LogRecord } from "@/lib/axiom/server";
import { unstable_cache } from "next/cache";

import { emitWideEvent, normalizeError } from "@/lib/axiom/server";
import { Item as DustItem, getDustData } from "@/lib/dust";
import { League } from "@/lib/leagues";
import {
  AllowedUnique,
  CurrencyData,
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

const createUniqueId = (name: string, variant?: string) =>
  `${name}${variant ? `-${variant}` : ""}`;

const attachExternalApiContext = (
  event: LogRecord,
  error: ExternalApiError,
  target: "price_fetch" | "currency_fetch",
) => {
  const apiContext = error.context?.[target];
  if (apiContext != null && typeof apiContext === "object") {
    event[target] = apiContext as LogRecord;
  }
};

const attachAggregateExternalApiContexts = (
  event: LogRecord,
  error: AggregateError,
) => {
  for (const entry of error.errors) {
    if (!(entry instanceof ExternalApiError)) {
      continue;
    }

    if (entry.source === "prices") {
      attachExternalApiContext(event, entry, "price_fetch");
    }

    if (entry.source === "currency") {
      attachExternalApiContext(event, entry, "currency_fetch");
    }
  }
};

const attachFetchFailureContext = (event: LogRecord, error: unknown) => {
  if (error instanceof ExternalApiError) {
    attachExternalApiContext(event, error, "price_fetch");
    attachExternalApiContext(event, error, "currency_fetch");
    return;
  }

  if (error instanceof AggregateError) {
    attachAggregateExternalApiContexts(event, error);
  }
};

const uncached__getItems = async (league: League) => {
  const startedAt = Date.now();
  const event: LogRecord = {
    event_name: "item_data_fetch",
    message: "Item data fetch completed",
    operation: "getItems",
    league,
    outcome: "success",
    prices: {},
    currency: {},
  };

  const dustData = getDustData();
  const dustMap = new Map(dustData.map((d) => [d.name, d]));
  const missingDustExamples: string[] = [];
  let missingDustCount = 0;
  let ignoredItemCount = 0;

  try {
    const [priceResult, currencyResult] = await Promise.allSettled([
      getPriceData(league),
      getCurrencyData(league),
    ]);

    let priceData: PriceItem[] | null = null;
    let currencyData: CurrencyData | null = null;
    const fetchErrors: unknown[] = [];

    if (priceResult.status === "fulfilled") {
      event.prices = priceResult.value.context;
      priceData = priceResult.value.items;
    } else {
      fetchErrors.push(priceResult.reason);
    }

    if (currencyResult.status === "fulfilled") {
      event.currency = currencyResult.value.context;
      currencyData = currencyResult.value.data;
    } else {
      fetchErrors.push(currencyResult.reason);
    }

    if (fetchErrors.length > 0) {
      const fetchError =
        fetchErrors.length === 1
          ? fetchErrors[0]
          : new AggregateError(fetchErrors, "Item data fetch failed");
      attachFetchFailureContext(event, fetchError);
      throw fetchError;
    }

    if (priceData === null || currencyData === null) {
      throw new Error("Missing data from at least one source");
    }

    // Fallback to 1c if no data
    const catalystPrice = currencyData.catalyst
      ? currencyData.catalyst.primaryValue
      : 1;

    // Threshold is 1 divine worth of chaos (divineRate is divines per 1 chaos)
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
        shouldCatalyst: shouldCatalyst,
        qualityType,
      });
    }

    // Calculate p10 of listingCounts
    const lowStockThreshold = calculateLowStockThreshold(merged);
    event.item_count = merged.length;
    event.missing_dust_count = missingDustCount;
    event.missing_dust_examples = missingDustExamples;
    event.ignored_item_count = ignoredItemCount;
    event.low_stock_threshold = lowStockThreshold;
    event.divine_price_threshold = divinePriceThreshold;
    event.currency_fallback_used = currencyData.catalyst === null;

    return {
      items: merged,
      lastUpdated: Date.now(),
      lowStockThreshold,
      divinePriceThreshold,
      dataStatus: {
        currency: {
          usedDefaultCatalystPrice: currencyData.catalyst === null,
        },
      } satisfies ItemDataStatus,
    };
  } catch (error) {
    event.outcome = "error";
    event.message = "Item data fetch failed";
    event.error = normalizeError(error);
    throw error;
  } finally {
    event.duration_ms = Date.now() - startedAt;
    await emitWideEvent(event);
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
  } else {
    // Quality up is not worth it
    return {
      dustValue: dustItem.dustValIlvl84,
      dustPerChaos: defaultDustPerChaos,
      catalyst: false,
      qualityType: "q0",
    };
  }
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
