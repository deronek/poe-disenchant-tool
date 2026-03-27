import { memo } from "react";

import { Icon } from "./icon";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
};

const CATALYST_URL =
  "https://web.poecdn.com/image/Art/2DItems/Currency/Catalysts/ImbuedCatalyst.png";

const CatalystIconComponent = ({
  className,
  size = 18,
  alt = "Imbued Catalyst",
}: Props) => {
  return (
    <Icon
      src={CATALYST_URL}
      title={alt}
      alt={alt}
      size={size}
      className={className}
    />
  );
};

const CatalystIcon = memo(CatalystIconComponent);

export { CatalystIcon };
