import { useEffect, useRef } from "react";

/**
 * Manages the text content of an ARIA live region for filter chips.
 *
 * Live regions must be mounted before content changes to be announced reliably.
 * This hook keeps the region always present and drives its text through three
 * states: empty (on mount), an applied message when a filter becomes active,
 * and an explicit cleared message when it is removed.
 */
export function useFilterStatus(
  hasValue: boolean,
  appliedMessage: string,
  clearedMessage: string,
) {
  const statusRef = useRef<HTMLSpanElement | null>(null);
  const prevHasValueRef = useRef(hasValue);

  useEffect(() => {
    const node = statusRef.current;
    if (!node) return;

    if (hasValue) {
      node.textContent = appliedMessage;
    } else if (prevHasValueRef.current) {
      node.textContent = clearedMessage;
    }

    prevHasValueRef.current = hasValue;
  }, [hasValue, appliedMessage, clearedMessage]);

  return statusRef;
}
