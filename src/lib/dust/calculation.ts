/**
 * Calculates the final Thaumaturgic Dust value for Kingsmarch disenchanting,
 * assuming no influence or corruption is present.
 *
 * @param baseDust - The base dust amount of the item
 * @param ilvl - Item level (0–100)
 * @param quality - Item quality percentage (0–20 typically)
 * @returns The final dust value after applying all modifiers
 * @see calculateDustValueFull for full function implementation
 */
export const calculateDustValue = (
  baseDust: number,
  ilvl: number,
  quality: number = 0,
): number => {
  if (!Number.isFinite(baseDust) || baseDust <= 0)
    throw new Error("baseDust is invalid");
  if (!Number.isFinite(ilvl) || ilvl <= 0) throw new Error("ilvl is invalid");
  if (!Number.isFinite(quality) || quality < 0)
    throw new Error("quality is invalid");
  const clampedIlvl = Math.min(Math.max(ilvl, 65), 84);

  // === 1. Compute additive bonuses ===
  let increaseByFactors = 0;

  // +2% per 1% quality
  increaseByFactors += quality * 2;

  // === 2. Calculate multiplier ===
  const factorsMultiplier = (increaseByFactors + 100) / 100;

  // === 3. Apply formula with ilvl and multiplier ===
  const globalMultiplier = 125 * (20 - (84 - clampedIlvl)) * factorsMultiplier;

  // === 4. Compute final dust value ===
  const finalDust = Math.round(baseDust * globalMultiplier);

  return finalDust;
};

/**
 * Calculates the final Thaumaturgic Dust value for Kingsmarch disenchanting.
 *
 * @param baseDust - The base dust amount of the item
 * @param ilvl - Item level (0–100)
 * @param quality - Item quality percentage (0–20 typically)
 * @param influenceCount - Number of influence types (e.g. 0–2)
 * @param corruptionImplicitCount - Number of corruption implicits (e.g. 0–6)
 * @returns The final dust value after applying all modifiers
 * @see calculateDustValue
 */
export const calculateDustValueFull = (
  baseDust: number,
  ilvl: number,
  quality: number = 0,
  influenceCount: number = 0,
  corruptionImplicitCount: number = 0,
): number => {
  if (!Number.isFinite(baseDust) || baseDust <= 0)
    throw new Error("baseDust is invalid");
  if (!Number.isFinite(ilvl) || ilvl <= 0) throw new Error("ilvl is invalid");
  if (!Number.isFinite(quality) || quality < 0)
    throw new Error("quality is invalid");
  if (!Number.isFinite(influenceCount) || influenceCount < 0)
    throw new Error("influenceCount is invalid");
  if (!Number.isFinite(corruptionImplicitCount) || corruptionImplicitCount < 0)
    throw new Error("corruptionImplicitCount is invalid");
  const clampedIlvl = Math.min(Math.max(ilvl, 65), 84);

  // === 1. Compute additive bonuses ===
  let increaseByFactors = 0;

  // +2% per 1% quality
  increaseByFactors += quality * 2;

  // +50% per influence type
  increaseByFactors += influenceCount * 50;

  // +50% per corruption implicit
  increaseByFactors += corruptionImplicitCount * 50;

  // === 2. Calculate multiplier ===
  const factorsMultiplier = (increaseByFactors + 100) / 100;

  // === 3. Apply formula with ilvl and multiplier ===
  const globalMultiplier = 125 * (20 - (84 - clampedIlvl)) * factorsMultiplier;

  // === 4. Compute final dust value ===
  const finalDust = Math.round(baseDust * globalMultiplier);

  return finalDust;
};


/**
 * Reverse-calculates the range of base dust values that could produce a given
 * final Thaumaturgic Dust value after rounding.
 *
 * Intended only for debugging, formula verification, and investigating observed
 * dust values. This helper is not used in production calculations.
 *
 * The returned range represents values that round to `finalDust` when passed
 * through the same item-level, quality, influence, and corruption modifiers
 * used by `calculateDustValueFull`.
 *
 * @param finalDust - The observed final dust value
 * @param ilvl - Item level; clamped to the supported range of 65–84
 * @param quality - Item quality percentage
 * @param influenceCount - Number of influence types applied to the item
 * @param corruptionImplicitCount - Number of corruption implicits on the item
 * @returns The minimum, maximum, and directly estimated base dust values
 * @see calculateDustValueFull
 * @internal
 */
export const calculateBaseDustRange = (
  finalDust: number,
  ilvl: number,
  quality: number = 0,
  influenceCount: number = 0,
  corruptionImplicitCount: number = 0,
) => {
  const clampedIlvl = Math.min(Math.max(ilvl, 65), 84);

  const increaseByFactors =
    quality * 2 +
    influenceCount * 50 +
    corruptionImplicitCount * 50;

  const factorsMultiplier = (increaseByFactors + 100) / 100;

  const globalMultiplier =
    125 *
    (20 - (84 - clampedIlvl)) *
    factorsMultiplier;

  return {
    minBaseDust: (finalDust - 0.5) / globalMultiplier,
    maxBaseDust: (finalDust + 0.5) / globalMultiplier,
    estimatedBaseDust: finalDust / globalMultiplier,
  };
};