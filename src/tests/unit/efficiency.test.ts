import { describe, expect, it } from "vitest";

import {
  calculateDustPerCost,
  calculateDustPerGold,
  calculateEffectiveChaosCost,
  calculateGoldChaosCost,
} from "@/lib/efficiency/efficiency";

describe("efficiency calculations", () => {
  it("converts Gold to the user's Chaos valuation", () => {
    expect(calculateGoldChaosCost(10_000, 5)).toBe(5);
    expect(calculateGoldChaosCost(5_000, 2.5)).toBe(1.25);
  });

  it("adds acquisition and Gold-equivalent costs", () => {
    expect(calculateEffectiveChaosCost(10, 10_000, 5)).toBe(15);
    expect(calculateEffectiveChaosCost(10, 10_000, 0)).toBe(10);
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
});
