"use client";

import Image from "next/image";

type IconProps = {
  src: string;
  className?: string;
  size?: number; // square size in px
  alt?: string;
  title?: string;
  loading?: "eager" | "lazy";
};

function Icon({
  src,
  className,
  size = 18,
  alt = "icon",
  title,
  loading = "lazy",
}: IconProps) {
  return (
    <img
      src={src}
      title={title ?? alt}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block" }}
      loading={loading}
    />
  );
}

export { Icon };
export type { IconProps };
