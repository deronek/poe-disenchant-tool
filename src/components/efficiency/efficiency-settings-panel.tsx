import * as React from "react";

import { ChaosOrbIcon, GoldIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  EFFICIENCY_MODES,
  EfficiencyMode,
  EfficiencyModeSchema,
  GOLD_VALUATION_DEFAULT,
  GOLD_VALUATION_MAX,
  GOLD_VALUATION_MIN,
} from "@/lib/efficiency";
import { useEfficiencySettings } from "./efficiency-settings-context";

export function EfficiencySettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = useEfficiencySettings();

  const setMode = React.useCallback(
    (mode: EfficiencyMode) => {
      setSettings((previous) => ({ ...previous, mode }));
    },
    [setSettings],
  );

  const setGoldValueChaosPer10k = React.useCallback(
    (goldValueChaosPer10k: number) => {
      setSettings((previous) => ({
        ...previous,
        goldValueChaosPer10k,
      }));
    },
    [setSettings],
  );

  const [draftGoldValue, setDraftGoldValue] = React.useState(
    settings.goldValueChaosPer10k,
  );

  React.useEffect(() => {
    setDraftGoldValue(settings.goldValueChaosPer10k);
  }, [settings.goldValueChaosPer10k]);

  const handleModeChange = (value: EfficiencyMode) => {
    // Set value with no validation - values are created directly from schema
    setMode(value);
  };

  const handleResetGoldValue = () => {
    setDraftGoldValue(GOLD_VALUATION_DEFAULT);
    setGoldValueChaosPer10k(GOLD_VALUATION_DEFAULT);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="font-semibold">Efficiency Metric</h4>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Select the calculation used by the Efficiency column.
        </p>
      </div>

      <RadioGroup
        value={settings.mode}
        onValueChange={handleModeChange}
        aria-label="Efficiency metric"
      >
        {EfficiencyModeSchema.options.map((mode) => {
          const id = `efficiency-${mode}`;
          const { label, description } = EFFICIENCY_MODES[mode];

          return (
            <FieldLabel key={mode} htmlFor={id}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{label}</FieldTitle>
                  <FieldDescription className="text-xs">
                    {description}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem id={id} value={mode} />
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>

      {settings.mode === "total-cost" && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="gold-valuation-slider"
              className="text-sm font-medium"
            >
              Gold valuation
            </Label>

            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              {draftGoldValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}

              <ChaosOrbIcon />

              <span className="text-muted-foreground font-normal">
                per 10 K
              </span>

              <GoldIcon />
            </span>
          </div>

          <Slider
            id="gold-valuation-slider"
            min={GOLD_VALUATION_MIN}
            max={GOLD_VALUATION_MAX}
            step={1}
            value={[draftGoldValue]}
            onValueChange={([v]) => setDraftGoldValue(v)}
            onValueCommit={([v]) => setGoldValueChaosPer10k(v)}
            aria-label="Chaos value per ten thousand Gold"
            aria-describedby="gold-valuation-description"
          />
          <div className="text-muted-foreground grid grid-cols-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <span className="leading-none">{GOLD_VALUATION_MIN}</span>
              <ChaosOrbIcon />
            </span>
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  settings.goldValueChaosPer10k === GOLD_VALUATION_DEFAULT
                }
                onClick={handleResetGoldValue}
                className="bg-background dark:bg-background hover:bg-accent h-6 text-xs"
                aria-label="Reset gold valuation to default"
              >
                Reset
              </Button>
            </div>
            <span className="inline-flex items-center justify-end gap-1">
              <span className="leading-none">{GOLD_VALUATION_MAX}</span>
              <ChaosOrbIcon />
            </span>
          </div>

          <p
            id="gold-valuation-description"
            className="text-muted-foreground text-xs leading-relaxed"
          >
            Sets how much 10,000 Gold is worth to you in Chaos. This value is
            added to the item price when calculating Total Cost.
          </p>
        </div>
      )}

      <Button size="sm" onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  );
}
