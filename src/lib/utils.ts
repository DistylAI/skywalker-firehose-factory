"use client";

import { twMerge } from "tailwind-merge";

/**
 * Utility function used by shadcn/ui components to conditionally join
 * and merge Tailwind CSS class names.
 */
export function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(inputs.filter(Boolean).join(" "));
} 