import type { EfficiencyMode } from "@/lib/efficiency";
import type { ReactNode } from "react";

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

/** The per-mode unit shown next to the efficiency value (e.g. "Dust / Chaos / 6 slots"). */
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

  let icons: ReactNode;

  switch (mode) {
    case "per-slot":
      icons = (
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
      break;
    case "per-gold":
      icons = (
        <>
          <DustIcon size={px} />
          <UnitSeparator />
          <GoldIcon size={px} />
        </>
      );
      break;
    case "total-cost":
      icons = (
        <>
          <DustIcon size={px} />
          <UnitSeparator />
          <TotalCostIcon size={px} />
        </>
      );
      break;
    default:
      return assertNever(mode);
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {icons}
    </span>
  );
}
