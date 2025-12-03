import { memo } from "react";

import { Icon } from "./icon";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
};

const GOLD_URL =
  "https://web.poecdn.com/image/Art/2DItems/Currency/Ruthless/CoinPileTier2.png";

const GoldIconComponent = ({ className, size = 18, alt = "Gold" }: Props) => {
  return (
    <Icon
      src={GOLD_URL}
      title={alt}
      alt={alt}
      size={size}
      className={className}
    />
  );
};

const GoldIcon = memo(GoldIconComponent);

export { GoldIcon };
