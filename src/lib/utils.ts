import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Decimal } from "decimal.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const HK_TIMEZONE = "Asia/Hong_Kong";

export function formatDate(date: Date | string, pattern: string = "dd/MM/yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, HK_TIMEZONE, pattern);
}

export function formatMoney(
  amount: Decimal | number | string,
  currency: string = "HKD"
) {
  const num = new Decimal(amount);
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toFixed(2)}`;
}

export function getCurrencySymbol(code: string) {
  const symbols: Record<string, string> = {
    HKD: "$",
    USD: "US$",
    CNY: "¥",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  return symbols[code] || code;
}
