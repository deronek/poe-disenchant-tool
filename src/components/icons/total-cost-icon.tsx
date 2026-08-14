import { memo } from "react";
import { HandCoins } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
  title?: string;
};

const TotalCostIconComponent = ({
  className,
  size = 18,
  alt = "Total Cost",
  title,
}: Props) => {
  const titleText = title ?? alt;
  return (
    <HandCoins
      size={size}
      className={cn("text-amber-600 dark:text-amber-500", className)}
      aria-label={alt || undefined}
    >
      (titleText && <title>{title ?? alt}</title>)
    </HandCoins>
  );
};

const TotalCostIcon = memo(TotalCostIconComponent);

export { TotalCostIcon };
