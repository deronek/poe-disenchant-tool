import { z } from "zod";

import { EfficiencyModeSchema } from "./efficiency";

export const GOLD_VALUATION_MIN = 0;
export const GOLD_VALUATION_MAX = 50;

export const EfficiencySettingsSchema = z.object({
  mode: EfficiencyModeSchema.prefault("total-cost"),
  goldValueChaosPer10k: z
    .int()
    .min(GOLD_VALUATION_MIN)
    .max(GOLD_VALUATION_MAX)
    .prefault(10),
});

export type EfficiencySettings = z.infer<typeof EfficiencySettingsSchema>;

export const DEFAULT_EFFICIENCY_SETTINGS: EfficiencySettings =
  EfficiencySettingsSchema.parse({});

export const EFFICIENCY_SETTINGS_STORAGE_KEY = "poe-udt:efficiency-settings:v1";
