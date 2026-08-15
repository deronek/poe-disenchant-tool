import type { EfficiencyMode } from "@/lib/efficiency";

import {
  ChaosOrbIcon,
  DustIcon,
  GoldIcon,
  TotalCostIcon,
} from "@/components/icons";
import { UnitSeparator } from "@/components/unit-separator";
import { assertNever, cn } from "@/lib/utils";

const SIZE = {
  sm: 12,
  md: 16,
} as const;

/**
 * Displays the unit associated with an efficiency mode.
 *
 * @param slots - The number of slots displayed for per-slot efficiency.
 * @param size - The icon size, defaulting to medium.
 * @returns The rendered efficiency unit.
 */
export function EfficiencyUnit({
  mode,
  slots,
  size = "md",
  className,
}: {
  mode: EfficiencyMode;
  slots: number;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const px = SIZE[size];

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <EfficiencyUnitIcons mode={mode} slots={slots} px={px} />
    </span>
  );
}

/**
 * Renders the icons and labels associated with an efficiency mode.
 *
 * @param mode - The efficiency mode that determines the displayed unit.
 * @param slots - The number of slots shown for per-slot efficiency.
 * @param px - The pixel size applied to each icon.
 * @returns The mode-specific efficiency unit content.
 */
function EfficiencyUnitIcons({
  mode,
  slots,
  px,
}: {
  mode: EfficiencyMode;
  slots: number;
  px: number;
}) {
  switch (mode) {
    case "per-slot":
      return (
        <>
          <DustIcon size={px} />
          <UnitSeparator />
          <ChaosOrbIcon size={px} />
          <UnitSeparator />
          <span className="text-muted-foreground min-w-10 text-left text-xs">
            {slots} slot{slots !== 1 ? "s" : ""}
          </span>
        </>
      );
    case "per-gold":
      return (
        <>
          <DustIcon size={px} />
          <UnitSeparator />
          <GoldIcon size={px} />
        </>
      );
    case "total-cost":
      return (
        <>
          <DustIcon size={px} />
          <UnitSeparator />
          <TotalCostIcon size={px} />
        </>
      );
    default: {
      return assertNever(mode);
    }
  }
}
