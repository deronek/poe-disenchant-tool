type IconProps = {
  src: string;
  className?: string;
  size?: number; // max size in px (preserves aspect ratio)
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      title={title ?? alt}
      alt={alt}
      className={className}
      style={{
        display: "inline-block",
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        width: "auto",
        height: "auto",
        objectFit: "contain",
      }}
      loading={loading}
    />
  );
}

export { Icon };
export type { IconProps };
