import type { EfficiencyComputeInput } from "@/lib/efficiency/efficiency";
import type { EfficiencySettings } from "@/lib/efficiency/efficiency-settings";
import { describe, expect, it } from "vitest";

import {
  calculateDustPerCost,
  calculateDustPerGold,
  calculateGoldChaosCost,
  getEfficiencyResult,
} from "@/lib/efficiency/efficiency";

const input: EfficiencyComputeInput = {
  dustPerChaosPerSlot: 1_000,
  dustPerGold: 15,
  calculatedDustValue: 150_000,
  acquisitionChaosCost: 10,
  goldCost: 10_000,
};

const settings: EfficiencySettings = {
  mode: "total-cost",
  goldValueChaosPer10k: 5,
};

describe("efficiency calculations", () => {
  it("converts Gold to the user's Chaos valuation", () => {
    expect(calculateGoldChaosCost(10_000, 5)).toBe(5);
    expect(calculateGoldChaosCost(5_000, 2.5)).toBe(1.25);
  });

  it("calculates Dust per Gold", () => {
    expect(calculateDustPerGold(150_000, 10_000)).toBe(15);
    expect(calculateDustPerGold(150_000, 0)).toBe(0);
  });

  it("calculates Dust per total cost", () => {
    // effective cost of (acq 10 + 10k gold @ 5c/10k) = 15
    expect(calculateDustPerCost(150_000, 15)).toBe(10_000);
    expect(calculateDustPerCost(150_000, 0)).toBe(0);
  });

  it("handles invalid personal valuation defensively", () => {
    expect(calculateGoldChaosCost(10_000, -1)).toBe(0);
    expect(calculateGoldChaosCost(10_000, Number.NaN)).toBe(0);
  });

  it("provides a total cost breakdown only in total-cost mode", () => {
    const totalCost = getEfficiencyResult(input, settings);
    expect(totalCost.totalCostDetails).toEqual({
      goldChaosCost: 5,
      effectiveChaosCost: 15,
    });
    expect(totalCost.value).toBe(10_000);

    expect(
      getEfficiencyResult(input, { ...settings, mode: "per-slot" })
        .totalCostDetails,
    ).toBeNull();
    expect(
      getEfficiencyResult(input, { ...settings, mode: "per-gold" })
        .totalCostDetails,
    ).toBeNull();
  });
});
