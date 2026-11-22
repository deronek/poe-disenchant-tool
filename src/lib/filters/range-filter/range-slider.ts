import type { RangeFilterConfig, RangeFilterValue } from "./range-filter-logic";
import { getEffectiveMax, getEffectiveMin } from "./range-filter-logic";
import {
  fractionalSliderToLinear,
  getRangeKeyboardDelta,
  hasSubUnitRange,
  linearToFractionalSlider,
} from "./range-transforms";

// Hundredths of a position keep every integer price reachable on the log scale.
const SUB_UNIT_SLIDER_STEP = 0.01;

export interface RangeSliderModel {
  min: number;
  max: number;
  step: number;
  value: number;
  fromSlider: (sliderValue: number) => number;
  getKeyboardValue: (key: string, shiftKey: boolean) => number | undefined;
}

const roundSliderPosition = (
  position: number,
  subUnitRange: boolean,
): number =>
  subUnitRange ? Math.round(position * 100) / 100 : Math.round(position);

export const getRangeSliders = (
  currentRange: Readonly<RangeFilterValue>,
  config: RangeFilterConfig,
) => {
  const effectiveMin = getEffectiveMin(currentRange, config);
  const effectiveMax = getEffectiveMax(currentRange, config);
  const subUnitRange = hasSubUnitRange(config.min, config.max);

  const getKeyboardValue = (
    currentValue: number,
    key: string,
    shiftKey: boolean,
  ): number | undefined => {
    const delta = getRangeKeyboardDelta(
      key,
      currentValue,
      config.precision,
      config.step,
      shiftKey,
    );

    return delta === undefined ? undefined : currentValue + delta;
  };

  const upperValue = subUnitRange
    ? effectiveMax === config.max
      ? 100
      : roundSliderPosition(
          linearToFractionalSlider(effectiveMax, effectiveMin, config.max),
          true,
        )
    : roundSliderPosition(effectiveMax, false);

  return {
    lower: {
      min: 0,
      max: 100,
      step: subUnitRange ? SUB_UNIT_SLIDER_STEP : 1,
      value: roundSliderPosition(
        linearToFractionalSlider(effectiveMin, config.min, effectiveMax),
        subUnitRange,
      ),
      fromSlider: (sliderValue: number) =>
        fractionalSliderToLinear(sliderValue, config.min, effectiveMax),
      getKeyboardValue: (key: string, shiftKey: boolean) =>
        getKeyboardValue(effectiveMin, key, shiftKey),
    },
    upper: {
      min: subUnitRange ? 0 : effectiveMin,
      max: subUnitRange ? 100 : config.max,
      step: subUnitRange ? SUB_UNIT_SLIDER_STEP : config.step,
      value: upperValue,
      fromSlider: (sliderValue: number) =>
        subUnitRange
          ? fractionalSliderToLinear(sliderValue, effectiveMin, config.max)
          : sliderValue,
      getKeyboardValue: (key: string, shiftKey: boolean) =>
        getKeyboardValue(effectiveMax, key, shiftKey),
    },
  } satisfies { lower: RangeSliderModel; upper: RangeSliderModel };
};
