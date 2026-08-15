import { z } from "zod";

import type { EfficiencySettings } from "./efficiency-settings";

export const EfficiencyModeSchema = z.enum([
  "per-slot",
  "per-gold",
  "total-cost",
]);

export type EfficiencyMode = z.infer<typeof EfficiencyModeSchema>;

export type EfficiencyComputeInput = {
  dustPerChaosPerSlot: number;
  dustPerGold: number;
  calculatedDustValue: number;
  acquisitionChaosCost: number;
  goldCost: number;
};

export type EfficiencyResult = {
  value: number;
  effectiveChaosCost: number | null; // only not null for mode == 'total-cost'
};

/**
 * Shared labels, descriptions and compute logic for efficiency modes.
 */
export const EFFICIENCY_MODES: Record<
  EfficiencyMode,
  {
    label: string;
    columnLabel: string;
    description: string;
    compute: (
      item: EfficiencyComputeInput,
      settings: EfficiencySettings,
    ) => EfficiencyResult;
  }
> = {
  "per-slot": {
    label: "Dust / Chaos / Slot",
    columnLabel: "Slot",
    description: "Factors in the item's inventory size.",
    compute: (item) => ({
      value: item.dustPerChaosPerSlot,
      effectiveChaosCost: null,
    }),
  },

  "per-gold": {
    label: "Dust / Gold",
    columnLabel: "Gold",
    description: "Compares Dust Value with the estimated Gold Fee.",
    compute: (item) => ({
      value: item.dustPerGold,
      effectiveChaosCost: null,
    }),
  },

  "total-cost": {
    label: "Dust / Total Cost",
    columnLabel: "Total Cost",
    description: "Adds your Gold valuation to the item cost.",
    compute: (item, settings) => {
      const effectiveChaosCost = calculateEffectiveChaosCost(
        item.acquisitionChaosCost,
        item.goldCost,
        settings.goldValueChaosPer10k,
      );

      return {
        value: calculateDustPerCost(
          item.calculatedDustValue,
          effectiveChaosCost,
        ),
        effectiveChaosCost,
      };
    },
  },
};

/**
 * Calculates an item's efficiency using the configured mode.
 *
 * @param item - The item and cost values used for the calculation
 * @param settings - The efficiency mode and calculation settings
 * @returns The calculated efficiency result
 */
export function getEfficiencyResult(
  item: EfficiencyComputeInput,
  settings: EfficiencySettings,
): EfficiencyResult {
  return EFFICIENCY_MODES[settings.mode].compute(item, settings);
}

/**
 * Converts a gold cost to its equivalent chaos cost.
 *
 * @param goldCost - The gold cost to convert
 * @param goldValueChaosPer10k - The chaos value of 10,000 gold
 * @returns The equivalent chaos cost, or `0` when either input is invalid or negative
 */
export function calculateGoldChaosCost(
  goldCost: number,
  goldValueChaosPer10k: number,
): number {
  if (!Number.isFinite(goldCost) || goldCost < 0) return 0;

  if (!Number.isFinite(goldValueChaosPer10k) || goldValueChaosPer10k < 0) {
    return 0;
  }

  return goldCost * (goldValueChaosPer10k / 10_000);
}

/**
 * Calculates the effective chaos cost by combining acquisition cost with the chaos equivalent of the gold cost.
 *
 * @param acquisitionChaosCost - The acquisition cost in chaos.
 * @param goldCost - The cost in gold.
 * @param goldValueChaosPer10k - The chaos value of 10,000 gold.
 * @returns The combined effective cost in chaos.
 */
export function calculateEffectiveChaosCost(
  acquisitionChaosCost: number,
  goldCost: number,
  goldValueChaosPer10k: number,
): number {
  return (
    acquisitionChaosCost +
    calculateGoldChaosCost(goldCost, goldValueChaosPer10k)
  );
}

/**
 * Calculates the rounded dust value per gold.
 *
 * @param dustValue - The item's dust value
 * @param goldCost - The item's gold cost
 * @returns The rounded dust value per gold, or `0` when the gold cost is zero or less
 */
export function calculateDustPerGold(
  dustValue: number,
  goldCost: number,
): number {
  return goldCost > 0 ? Math.round(dustValue / goldCost) : 0;
}

/**
 * Calculates the rounded dust value per unit of cost.
 *
 * @param dustValue - The dust value to divide
 * @param cost - The cost used as the divisor
 * @returns The rounded dust value per cost, or `0` when the cost is zero or negative
 */
export function calculateDustPerCost(dustValue: number, cost: number): number {
  return cost > 0 ? Math.round(dustValue / cost) : 0;
}
