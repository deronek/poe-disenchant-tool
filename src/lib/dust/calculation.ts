/**
 * Calculates the final Thaumaturgic Dust value for Kingsmarch disenchanting.
 *
 * @param baseDust - The base dust amount of the item
 * @param ilvl - Item level (0–100)
 * @param quality - Item quality percentage (0–20 typically)
 * @param influenceCount - Number of influence types (e.g. 0–2)
 * @param corruptionImplicitCount - Number of corruption implicits (e.g. 0–2)
 * @returns The final dust value after applying all modifiers
 */
export const calculateDustValue = (
  baseDust: number,
  ilvl: number,
  quality: number = 0,
  influenceCount: number = 0,
  corruptionImplicitCount: number = 0,
): number => {
  // === 1. Compute additive bonuses ===
  let increaseByFactors = 0;

  // +2% per 1% quality
  increaseByFactors += quality * 2;

  // +50% per influence type
  increaseByFactors += influenceCount * 50;

  // +50% per corruption implicit
  increaseByFactors += corruptionImplicitCount * 50;

  // === 2. Convert to multiplier ===
  const factorsMultiplier = (increaseByFactors + 100) / 100;

  // === 3. Apply ilvl-based global multiplier ===
  const clampedIlvl = Math.min(Math.max(ilvl, 65), 84);
  const globalMultiplier = 125 * (20 - (84 - clampedIlvl)) * factorsMultiplier;

  // === 4. Compute final dust value ===
  const finalDust = Math.round(baseDust * globalMultiplier);

  return finalDust;
};
