import { memo } from "react";

import { Icon } from "./icon";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
};

const DIVINE_ORB_URL =
  "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyModValues.png";

const DivineOrbIconComponent = ({
  className,
  size = 18,
  alt = "Divine Orb",
}: Props) => {
  return (
    <Icon
      src={DIVINE_ORB_URL}
      title={alt}
      alt={alt}
      size={size}
      className={className}
    />
  );
};

const DivineOrbIcon = memo(DivineOrbIconComponent);

export { DivineOrbIcon };
