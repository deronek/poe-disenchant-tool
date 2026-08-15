import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class values into a merged class string.
 *
 * @param inputs - Class values to combine and merge
 * @returns The merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Throws an error for a value that should be unreachable.
 *
 * @param value - The unexpected value encountered
 * @returns Never returns
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}
