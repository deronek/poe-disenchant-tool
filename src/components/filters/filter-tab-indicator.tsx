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
        className="text-primary/80 dark:text-primary/90 bg-muted absolute -top-1 left-full ml-1.5 inline-flex items-center justify-center rounded-full p-0.5 text-[10px] leading-none font-bold"
      >
        {count}
      </span>
      <span className="sr-only">
        ({count} active {label} filter bounds)
      </span>
    </>
  );
}
