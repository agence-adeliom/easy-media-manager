import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The utilities are prefixed (`emm:p-3`, see src/styles/main.css): tailwind-merge must know it to dedupe them.
const twMerge = extendTailwindMerge({ prefix: "emm" });

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
