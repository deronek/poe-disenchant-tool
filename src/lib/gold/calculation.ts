/**
 * Calculates gold cost of a unique item for async trade.
 *
 * @param baseDust - The base dust amount of the item
 * @param quality - Item quality percentage (0–20 typically)
 * @param influenceCount - Number of influence types (e.g. 0–2)
 * @param corruptionImplicitCount - Number of corruption implicits (e.g. 0–2)
 * @returns The final gold cost after applying all modifiers
 */
export const calculateGoldCost = (
  baseDust: number,
  quality: number,
  influenceCount: number,
  corruptionImplicitCount: number,
): number => {
  if (!Number.isFinite(baseDust) || baseDust <= 0)
    throw new Error("baseDust is invalid");
  if (!Number.isFinite(quality) || quality < 0)
    throw new Error("quality is invalid");
  if (!Number.isFinite(influenceCount) || influenceCount < 0)
    throw new Error("influenceCount is invalid");
  if (!Number.isFinite(corruptionImplicitCount) || corruptionImplicitCount < 0)
    throw new Error("corruptionImplicitCount is invalid");

  // === 1. Compute inner value ===
  const floorTo = (value: number, step: number) =>
    Math.floor(value / step) * step;
  const inner = floorTo(Math.pow(baseDust, 0.45), 0.01);

  // === 2. Calculate multiplier ===
  const multiplier =
    1 + 0.02 * quality + 0.5 * (influenceCount + corruptionImplicitCount);

  // === 3. Compute final gold cost ===
  const finalGoldCost = Math.floor(2000 * inner * multiplier);

  return finalGoldCost;
};
