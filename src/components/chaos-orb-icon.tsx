import { memo } from "react";

import { Icon } from "./icon";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
};

const CHAOS_ORB_URL =
  "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png";

const ChaosOrbIconComponent = ({
  className,
  size = 18,
  alt = "Chaos Orb",
}: Props) => {
  return (
    <Icon
      src={CHAOS_ORB_URL}
      title={alt}
      alt={alt}
      size={size}
      className={className}
    />
  );
};

const ChaosOrbIcon = memo(ChaosOrbIconComponent);

export { ChaosOrbIcon };
