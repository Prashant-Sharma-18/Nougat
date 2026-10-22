import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("en-US").format(points);
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const POINTS_PER_DOLLAR = 100;

export function dollarsToPoints(dollars: number): number {
  return Math.round(dollars * POINTS_PER_DOLLAR);
}

export function pointsToDollars(points: number): number {
  return points / POINTS_PER_DOLLAR;
}

