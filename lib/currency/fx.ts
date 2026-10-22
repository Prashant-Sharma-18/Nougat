export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "INR" | "JPY";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  countryCode: string;
  rateAgainstUsd: number;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    countryCode: "US",
    rateAgainstUsd: 1.0,
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    countryCode: "EU",
    rateAgainstUsd: 0.92,
    decimals: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    countryCode: "GB",
    rateAgainstUsd: 0.78,
    decimals: 2,
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    countryCode: "CA",
    rateAgainstUsd: 1.36,
    decimals: 2,
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    countryCode: "AU",
    rateAgainstUsd: 1.52,
    decimals: 2,
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    countryCode: "IN",
    rateAgainstUsd: 83.5,
    decimals: 0,
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    countryCode: "JP",
    rateAgainstUsd: 155.0,
    decimals: 0,
  },
};

export function convertUsdToCurrency(amountInUsd: number, targetCurrency: CurrencyCode): number {
  const config = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.USD;
  const converted = amountInUsd * config.rateAgainstUsd;
  return config.decimals === 0 ? Math.round(converted) : Math.round(converted * 100) / 100;
}

export function convertCurrencyToUsd(amountInCurrency: number, sourceCurrency: CurrencyCode): number {
  const config = SUPPORTED_CURRENCIES[sourceCurrency] || SUPPORTED_CURRENCIES.USD;
  if (!config || config.rateAgainstUsd === 0) return amountInCurrency;
  return Math.round((amountInCurrency / config.rateAgainstUsd) * 100) / 100;
}

export function formatWithFx(amountInUsd: number, currency: CurrencyCode): string {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const converted = convertUsdToCurrency(amountInUsd, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: config.decimals === 0 ? 0 : 2,
    maximumFractionDigits: config.decimals === 0 ? 0 : 2,
  }).format(converted);
}

