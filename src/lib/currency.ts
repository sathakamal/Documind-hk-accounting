import { Decimal } from "decimal.js";

export function convertToHkd(
  amount: Decimal | string | number,
  exchangeRate: Decimal | string | number
): Decimal {
  return new Decimal(amount).mul(exchangeRate);
}

export const DEFAULT_CURRENCIES = [
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$", isBase: true },
  { code: "USD", name: "US Dollar", symbol: "$", isBase: false },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", isBase: false },
  { code: "INR", name: "Indian Rupee", symbol: "₹", isBase: false },
  { code: "EUR", name: "Euro", symbol: "€", isBase: false },
  { code: "GBP", name: "British Pound", symbol: "£", isBase: false },
];
