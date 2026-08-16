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

export type TotalCostDetails = {
  goldChaosCost: number;
  effectiveChaosCost: number;
};

export type EfficiencyResult = {
  value: number;
  /** Only present when settings.mode == 'total-cost'. */
  totalCostDetails: TotalCostDetails | null;
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
      totalCostDetails: null,
    }),
  },

  "per-gold": {
    label: "Dust / Gold",
    columnLabel: "Gold",
    description: "Compares Dust Value with the estimated Gold Fee.",
    compute: (item) => ({
      value: item.dustPerGold,
      totalCostDetails: null,
    }),
  },

  "total-cost": {
    label: "Dust / Total Cost",
    columnLabel: "Total Cost",
    description: "Adds your Gold valuation to the item cost.",
    compute: (item, settings) => {
      const goldChaosCost = calculateGoldChaosCost(
        item.goldCost,
        settings.goldValueChaosPer10k,
      );
      const effectiveChaosCost = item.acquisitionChaosCost + goldChaosCost;

      return {
        value: calculateDustPerCost(
          item.calculatedDustValue,
          effectiveChaosCost,
        ),
        totalCostDetails: { goldChaosCost, effectiveChaosCost },
      };
    },
  },
};

export function getEfficiencyResult(
  item: EfficiencyComputeInput,
  settings: EfficiencySettings,
): EfficiencyResult {
  return EFFICIENCY_MODES[settings.mode].compute(item, settings);
}

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

export function calculateDustPerGold(
  dustValue: number,
  goldCost: number,
): number {
  return goldCost > 0 ? Math.round(dustValue / goldCost) : 0;
}

export function calculateDustPerCost(dustValue: number, cost: number): number {
  return cost > 0 ? Math.round(dustValue / cost) : 0;
}
