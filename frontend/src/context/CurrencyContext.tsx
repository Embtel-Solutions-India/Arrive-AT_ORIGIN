import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  currencyService,
  CurrencyCode,
  ProductPriceResult,
} from "../services/currencyService";
import { apiUrl } from "../utils/api";

export interface CurrencyContextType {
  currency: CurrencyCode;
  symbol: string;
  country: string;
  detectedCountry: string;
  isManual: boolean;
  loading: boolean;
  setCurrency: (currency: CurrencyCode | null) => void;
  resetToAutoDetect: () => void;
  formatPrice: (amount: number, options?: { forceDecimals?: boolean }) => string;
  getProductPrice: (product: any) => ProductPriceResult;
  shippingRules: {
    fee: number;
    freeThreshold: number;
    freeText: string;
    enableSalesTax?: boolean;
    salesTaxPercentage?: number;
    estimatedDeliveryDays?: string;
  };
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Check localStorage for saved manual choice
  const initialSaved = currencyService.getSavedPreference();

  const [isManual, setIsManual] = useState<boolean>(initialSaved !== null);
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialSaved || "USD");
  const [country, setCountry] = useState<string>(
    initialSaved === "INR" ? "IN" : "US"
  );
  const [detectedCountry, setDetectedCountry] = useState<string>("US");
  const [detectedCurrency, setDetectedCurrency] = useState<CurrencyCode>("USD");
  const [loading, setLoading] = useState<boolean>(true);
  const [serverShippingSettings, setServerShippingSettings] = useState<any>(null);

  // Fetch live shipping settings from backend API
  useEffect(() => {
    fetch(apiUrl("/public/settings/shipping"))
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data?.shipping) {
          setServerShippingSettings(data.data.shipping);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize IP-based geolocation on mount
  useEffect(() => {
    let isMounted = true;

    async function initGeo() {
      try {
        const geo = await currencyService.detectLocation();
        if (!isMounted) return;

        setDetectedCountry(geo.country);
        setDetectedCurrency(geo.currency);

        const currentSaved = currencyService.getSavedPreference();
        if (!currentSaved) {
          // Website default currency is USD across all visitors
          setCurrencyState("USD");
          setCountry(geo.country || "US");
          setIsManual(false);
        } else {
          // Keep manual preference intact
          setCurrencyState(currentSaved);
          setCountry(currentSaved === "INR" ? "IN" : "US");
          setIsManual(true);
        }
      } catch {
        if (!isMounted) return;
        // Fallback default
        const currentSaved = currencyService.getSavedPreference();
        if (!currentSaved) {
          setCurrencyState("USD");
          setCountry("US");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initGeo();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Manual currency switch: "USD", "INR", or null for "Auto Detect (USD Default)"
   */
  const setCurrency = useCallback(
    (newCurrency: CurrencyCode | null) => {
      if (newCurrency === null) {
        // Switch back to website default (USD)
        currencyService.savePreference(null);
        setIsManual(false);
        setCurrencyState("USD");
        setCountry(detectedCountry);
      } else {
        // User explicitly chose USD or INR
        currencyService.savePreference(newCurrency);
        setIsManual(true);
        setCurrencyState(newCurrency);
        setCountry(newCurrency === "INR" ? "IN" : "US");
      }
    },
    [detectedCountry]
  );

  const resetToAutoDetect = useCallback(() => {
    setCurrency(null);
  }, [setCurrency]);

  const symbol = currency === "INR" ? "₹" : "$";

  const formatPrice = useCallback(
    (amount: number, options?: { forceDecimals?: boolean }) => {
      return currencyService.formatPrice(amount, currency, options);
    },
    [currency]
  );

  const getProductPrice = useCallback(
    (product: any) => {
      return currencyService.getProductPrice(product, currency);
    },
    [currency]
  );

  const shippingRules = useMemo(() => {
    return currencyService.getShippingRules(currency, serverShippingSettings);
  }, [currency, serverShippingSettings]);

  const value = useMemo<CurrencyContextType>(
    () => ({
      currency,
      symbol,
      country,
      detectedCountry,
      isManual,
      loading,
      setCurrency,
      resetToAutoDetect,
      formatPrice,
      getProductPrice,
      shippingRules,
    }),
    [
      currency,
      symbol,
      country,
      detectedCountry,
      isManual,
      loading,
      setCurrency,
      resetToAutoDetect,
      formatPrice,
      getProductPrice,
      shippingRules,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
