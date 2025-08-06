"use client";

import Image from "next/image";

type Props = {
  className?: string;
  size?: number; // square size in px
  alt?: string;
};

const CHAOS_ORB_URL =
  "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png";

function ChaosOrbIcon({ className, size = 18, alt = "Chaos Orb" }: Props) {
  return (
    <Image
      src={CHAOS_ORB_URL}
      title={alt}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block" }}
      loading="lazy"
    />
  );
}

export { ChaosOrbIcon };
