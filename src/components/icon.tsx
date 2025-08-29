type IconProps = {
  src: string;
  className?: string;
  size?: number; // render box size in px (image contains, preserves aspect)
  alt?: string;
  title?: string;
  loading?: "eager" | "lazy";
};

function Icon({
  src,
  className,
  size = 18,
  alt = "",
  title,
  loading = "lazy",
}: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      title={title ?? alt}
      alt={alt}
      className={className}
      style={{
        display: "inline-block",
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
      }}
      referrerPolicy="no-referrer"
      decoding="async"
      loading={loading}
    />
  );
}

export { Icon };
export type { IconProps };
