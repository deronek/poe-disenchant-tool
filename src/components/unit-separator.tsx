/**
 * Renders an accessible separator between units.
 */
export function UnitSeparator() {
  const sep = (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        /
      </span>
      <span className="sr-only"> per </span>
    </>
  );
  return sep;
}
