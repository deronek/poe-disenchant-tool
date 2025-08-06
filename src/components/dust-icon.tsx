"use client";

import { Icon } from "./icon";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
};

const DUST_URL =
  "https://web.poecdn.com/image/Art/2DItems/Currency/Settlers/DisenchantedMagicDust.png";

function DustIcon({ className, size = 18, alt = "Thaumaturgic Dust" }: Props) {
  return (
    <Icon
      src={DUST_URL}
      title={alt}
      alt={alt}
      size={size}
      className={className}
    />
  );
}

export { DustIcon };
