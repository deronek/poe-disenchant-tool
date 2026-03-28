/**
 * Utility functions for range value transformations and scaling
 * Used by range filter components to handle different scaling requirements.
 */

/**
 * Converts a linear value to logarithmic scale for better precision at low values
 * @param linearValue - The linear value to convert
 * @param min - Minimum value of the range
 * @param max - Maximum value of the range
 * @returns The logarithmic scale value (0-100)
 */
export const linearToLog = (
  linearValue: number,
  min: number,
  max: number,
): number => {
  if (linearValue <= min) return 0;
  // Use log scale that gives more precision to low values
  const logMin = Math.log(min + 1);
  const logMax = Math.log(max + 1);
  const logValue = Math.log(linearValue + 1);
  return ((logValue - logMin) / (logMax - logMin)) * 100;
};

/**
 * Converts a logarithmic scale value back to linear scale
 * @param logValue - The logarithmic scale value (0-100)
 * @param min - Minimum value of the range
 * @param max - Maximum value of the range
 * @returns The linear value
 */
export const logToLinear = (
  logValue: number,
  min: number,
  max: number,
): number => {
  const logMin = Math.log(min + 1);
  const logMax = Math.log(max + 1);
  const linearValue =
    Math.exp(logMin + (logValue / 100) * (logMax - logMin)) - 1;
  return Math.round(linearValue);
};

/**
 * Creates slider value for lower bound using logarithmic scaling
 * @param linearValue - The current linear value
 * @param min - Minimum value of the range
 * @param max - Maximum value of the range
 * @returns The slider value (0-100)
 */
export const createLowerBoundSliderValue = (
  linearValue: number,
  min: number,
  max: number,
): number => {
  return linearToLog(linearValue, min, max);
};

/**
 * Creates linear value from slider value for lower bound
 * @param sliderValue - The slider value (0-100)
 * @param min - Minimum value of the range
 * @param max - Maximum value of the range
 * @returns The linear value
 */
export const createLowerBoundLinearValue = (
  sliderValue: number,
  min: number,
  max: number,
): number => {
  return logToLinear(sliderValue, min, max);
};
