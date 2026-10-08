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

  /**
   * Resolves discrete prices from a book/product object for the chosen currency.
   * Never applies exchange rates; always uses discrete priceUSD and priceINR.
   */
  getProductPrice(product: any, currency: CurrencyCode): ProductPriceResult {
    if (!product) {
      return { price: 0, isSale: false, effectivePrice: 0 };
    }

    let price = 0;
    let salePrice: number | undefined;

    if (currency === "INR") {
      price =
        typeof product.priceINR === "number" && product.priceINR > 0
          ? product.priceINR
          : typeof product.price === "number" && product.price > 100
          ? product.price
          : 483.23;

      if (typeof product.salePriceINR === "number" && product.salePriceINR > 0) {
        salePrice = product.salePriceINR;
      }
    } else {
      // USD
      price =
        typeof product.priceUSD === "number" && product.priceUSD > 0
          ? product.priceUSD
          : typeof product.price === "number" && product.price < 100
          ? product.price
          : 24.95;

      if (typeof product.salePriceUSD === "number" && product.salePriceUSD > 0) {
        salePrice = product.salePriceUSD;
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
   * USD: $5.00 shipping, Free over $50.00
   * INR: ₹50.00 shipping, Free over ₹400.00
   */
  getShippingRules(currency: CurrencyCode) {
    if (currency === "INR") {
      return {
        fee: 50,
        freeThreshold: 400,
        freeText: "FREE (Orders over ₹400)",
      };
    }
    return {
      fee: 5,
      freeThreshold: 50,
      freeText: "FREE (Orders over $50)",
    };
  },
};
