export function FilterTabIndicator({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className="text-primary bg-muted absolute -top-1 left-full ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full text-[10px] leading-none font-bold"
      >
        {count}
      </span>
      <span className="sr-only">
        ({count} active {label} filter bounds)
      </span>
    </>
  );
}
