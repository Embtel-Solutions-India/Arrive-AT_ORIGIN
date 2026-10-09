import { apiUrl } from "../utils/api";

export type CurrencyCode = "USD" | "INR";

export interface GeoLocationData {
  country: string;
  currency: CurrencyCode;
  source: string;
}

export interface ProductPriceResult {
  price: number;
  salePrice?: number;
  isSale: boolean;
  effectivePrice: number;
}

const STORAGE_KEY_MANUAL = "sb_currency_manual";
const SESSION_KEY_GEO = "sb_geo_detected";

export const USD_TO_INR_RATE = 96.79;

export function convertInrToUsd(priceInr: number): number {
  if (!priceInr || typeof priceInr !== "number" || priceInr <= 0) return 0;
  return Number((priceInr / USD_TO_INR_RATE).toFixed(2));
}

export function convertUsdToInr(priceUsd: number): number {
  if (!priceUsd || typeof priceUsd !== "number" || priceUsd <= 0) return 0;
  return Number((priceUsd * USD_TO_INR_RATE).toFixed(2));
}

export const currencyService = {
  /**
   * Retrieves the user's manual currency preference from localStorage.
   * Returns null if set to Auto Detect or not set.
   */
  getSavedPreference(): CurrencyCode | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANUAL);
      if (saved === "USD" || saved === "INR") {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  },

  /**
   * Stores the manual currency selection or removes it for Auto Detect.
   */
  savePreference(currency: CurrencyCode | null): void {
    try {
      if (currency === "USD" || currency === "INR") {
        localStorage.setItem(STORAGE_KEY_MANUAL, currency);
      } else {
        localStorage.removeItem(STORAGE_KEY_MANUAL);
      }
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Detects the visitor's country and default currency via the backend Geo API.
   * Uses sessionStorage to cache results per session and prevent redundant calls.
   * Priority: Country IN -> INR, Country US -> USD, any other country -> USD.
   */
  async detectLocation(): Promise<GeoLocationData> {
    // 1. Check session cache first
    try {
      const cached = sessionStorage.getItem(SESSION_KEY_GEO);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.currency === "USD" || parsed.currency === "INR") {
          return parsed;
        }
      }
    } catch {
      // Ignore session storage errors
    }

    // 2. Fetch from backend Geo endpoint with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(apiUrl("/public/geo"), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const rawCountry = (json.data.country || "US").toUpperCase().trim();
          const determinedCurrency: CurrencyCode = rawCountry === "IN" ? "INR" : "USD";
          const result: GeoLocationData = {
            country: rawCountry,
            currency: determinedCurrency,
            source: json.data.source || "backend_api",
          };

          try {
            sessionStorage.setItem(SESSION_KEY_GEO, JSON.stringify(result));
          } catch {
            // Ignore
          }

          return result;
        }
      }
    } catch {
      // Network failure, timeout, or aborted
    }

    // 3. Fallback to default US / USD
    const fallback: GeoLocationData = {
      country: "US",
      currency: "USD",
      source: "client_fallback",
    };

    return fallback;
  },

  /**
   * Formats a price using Intl.NumberFormat based on currency standards.
   * USD: $49.99, $1,299.00
   * INR: ₹3,999, ₹1,29,999, ₹483.23 (if has decimals)
   */
  formatPrice(
    amount: number,
    currency: CurrencyCode = "USD",
    options: { forceDecimals?: boolean } = {}
  ): string {
    const num = Number(amount) || 0;

    if (currency === "INR") {
      const hasDecimals = options.forceDecimals || !Number.isInteger(num);
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(num);
    }

    // USD default formatting
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  },

  USD_TO_INR_RATE,
  convertInrToUsd,
  convertUsdToInr,

  /**
   * Resolves discrete prices from a book/product object for the chosen currency.
   * Seamlessly converts between INR and USD using the official rate (1 USD = 96.79 INR)
   * whenever discrete prices are not pre-calculated.
   */
  getProductPrice(product: any, currency: CurrencyCode): ProductPriceResult {
    if (!product) {
      return { price: 0, isSale: false, effectivePrice: 0 };
    }

    let price = 0;
    let salePrice: number | undefined;

    if (currency === "INR") {
      if (typeof product.priceINR === "number" && product.priceINR > 0) {
        price = product.priceINR;
      } else if (typeof product.price === "number" && product.price >= 100) {
        price = product.price;
      } else if (typeof product.priceUSD === "number" && product.priceUSD > 0) {
        price = convertUsdToInr(product.priceUSD);
      } else if (typeof product.price === "number" && product.price > 0) {
        price = convertUsdToInr(product.price);
      } else {
        price = 483.23;
      }

      if (typeof product.salePriceINR === "number" && product.salePriceINR > 0) {
        salePrice = product.salePriceINR;
      } else if (typeof product.salePriceUSD === "number" && product.salePriceUSD > 0) {
        salePrice = convertUsdToInr(product.salePriceUSD);
      }
    } else {
      // USD
      if (typeof product.priceUSD === "number" && product.priceUSD > 0) {
        price = product.priceUSD;
      } else if (typeof product.priceINR === "number" && product.priceINR > 0) {
        price = convertInrToUsd(product.priceINR);
      } else if (typeof product.price === "number" && product.price > 0 && product.price < 50) {
        price = product.price;
      } else if (typeof product.price === "number" && product.price >= 50) {
        price = convertInrToUsd(product.price);
      } else {
        price = 4.99;
      }

      if (typeof product.salePriceUSD === "number" && product.salePriceUSD > 0) {
        salePrice = product.salePriceUSD;
      } else if (typeof product.salePriceINR === "number" && product.salePriceINR > 0) {
        salePrice = convertInrToUsd(product.salePriceINR);
      }
    }

    const isSale = typeof salePrice === "number" && salePrice < price;
    const effectivePrice = isSale && salePrice !== undefined ? salePrice : price;

    return {
      price,
      salePrice,
      isSale,
      effectivePrice,
    };
  },

  /**
   * Currency specific shipping configuration.
   * Default is Free Delivery ($0.00 / ₹0) and dynamic integration with admin shipping settings.
   */
  getShippingRules(currency: CurrencyCode, customRules?: any) {
    if (customRules) {
      const isINR = currency === "INR";
      const fee = customRules.enableShipping
        ? (isINR ? customRules.standardShippingFeeINR : customRules.standardShippingFeeUSD) || 0
        : 0;
      const freeThreshold = customRules.enableFreeDelivery
        ? (isINR ? customRules.freeDeliveryThresholdINR : customRules.freeDeliveryThresholdUSD) || 0
        : 0;
      return {
        fee,
        freeThreshold,
        freeText: "FREE Delivery",
        enableSalesTax: Boolean(customRules.enableSalesTax),
        salesTaxPercentage: Number(customRules.salesTaxPercentage) || 0,
        estimatedDeliveryDays: customRules.estimatedDeliveryDays || "3–5 Business Days",
      };
    }

    if (currency === "INR") {
      return {
        fee: 0,
        freeThreshold: 0,
        freeText: "FREE Delivery",
        enableSalesTax: false,
        salesTaxPercentage: 0,
        estimatedDeliveryDays: "3–5 Business Days",
      };
    }
    return {
      fee: 0,
      freeThreshold: 0,
      freeText: "FREE Delivery",
      enableSalesTax: false,
      salesTaxPercentage: 0,
      estimatedDeliveryDays: "3–5 Business Days",
    };
  },
};
