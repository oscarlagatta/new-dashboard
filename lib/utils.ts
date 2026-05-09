import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(1);
    return `${v.endsWith('.0') ? v.slice(0, -2) : v}M`;
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000)}K`;
  }
  return n.toLocaleString();
}
