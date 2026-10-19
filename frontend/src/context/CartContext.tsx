import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useCurrency } from "./CurrencyContext";
import { convertInrToUsd, convertUsdToInr } from "../services/currencyService";
import { getEbookPdfUrl } from "../utils/ebookUtils";

export interface CartItem {
  bookId: string;
  title: string;
  slug: string;
  price: number;
  priceUSD?: number;
  priceINR?: number;
  salePriceUSD?: number;
  salePriceINR?: number;
  format: string;
  coverImage: string;
  quantity: number;
  pdfUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (book: any, quantity?: number, format?: string) => void;
  removeFromCart: (bookId: string, format?: string) => void;
  updateQuantity: (bookId: string, format: string, quantity: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  getItemPrice: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currency, getProductPrice } = useCurrency();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("sb_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("sb_cart", JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  /**
   * Resolves the price of a cart item in the currently active currency.
   * Seamlessly converts between INR and USD using 1 USD = 96.79 INR.
   */
  const getItemPrice = useCallback(
    (item: CartItem): number => {
      if (currency === "INR") {
        if (typeof item.salePriceINR === "number" && item.salePriceINR > 0) {
          return item.salePriceINR;
        }
        if (typeof item.priceINR === "number" && item.priceINR > 0) {
          return item.priceINR;
        }
        if (typeof item.priceUSD === "number" && item.priceUSD > 0) {
          return convertUsdToInr(item.priceUSD);
        }
        return typeof item.price === "number" && item.price > 100 ? item.price : 483.23;
      }

      // USD
      if (typeof item.salePriceUSD === "number" && item.salePriceUSD > 0) {
        return item.salePriceUSD;
      }
      if (typeof item.priceUSD === "number" && item.priceUSD > 0) {
        return item.priceUSD;
      }
      if (typeof item.salePriceINR === "number" && item.salePriceINR > 0) {
        return convertInrToUsd(item.salePriceINR);
      }
      if (typeof item.priceINR === "number" && item.priceINR > 0) {
        return convertInrToUsd(item.priceINR);
      }
      if (typeof item.price === "number" && item.price > 0 && item.price < 50) {
        return item.price;
      }
      if (typeof item.price === "number" && item.price >= 50) {
        return convertInrToUsd(item.price);
      }
      return 4.99;
    },
    [currency]
  );
  const addToCart = (book: any, quantity = 1, format?: string) => {
    const itemFormat = format || (book.format === "Kindle" ? "E-Book" : (book.format || "E-Book"));

    // Lookup format in book.formats if available
    const fmtObj = Array.isArray(book.formats)
      ? book.formats.find((f: any) => {
          const fName = (f.format || "").trim().toLowerCase();
          const target = itemFormat.trim().toLowerCase();
          const isEbookMatch =
            (target.includes("kindle") || target.includes("ebook") || target.includes("e-book")) &&
            (fName.includes("kindle") || fName.includes("ebook") || fName.includes("e-book"));
          return fName === target || isEbookMatch;
        })
      : null;

    // Extract format-specific resolved price
    const resolvedPricing = getProductPrice(book, itemFormat);

    let bookPriceUSD: number | undefined;
    let bookPriceINR: number | undefined;

    if (fmtObj && fmtObj.isAvailable !== false) {
      if (typeof fmtObj.priceUSD === "number" && fmtObj.priceUSD > 0) {
        bookPriceUSD = fmtObj.priceUSD;
      } else if (typeof fmtObj.price === "number" && fmtObj.price < 50) {
        bookPriceUSD = fmtObj.price;
      }

      if (typeof fmtObj.priceINR === "number" && fmtObj.priceINR > 0) {
        bookPriceINR = fmtObj.priceINR;
      } else if (bookPriceUSD) {
        bookPriceINR = convertUsdToInr(bookPriceUSD);
      }
    }

    if (bookPriceUSD === undefined) {
      bookPriceUSD =
        typeof book.priceUSD === "number" && book.priceUSD > 0
          ? book.priceUSD
          : (typeof book.price === "number" && book.price < 50 ? book.price : undefined);
    }
    if (bookPriceINR === undefined) {
      bookPriceINR =
        typeof book.priceINR === "number" && book.priceINR > 0
          ? book.priceINR
          : (bookPriceUSD ? convertUsdToInr(bookPriceUSD) : undefined);
    }

    const isDigital =
      itemFormat.toLowerCase().includes("ebook") ||
      itemFormat.toLowerCase().includes("e-book") ||
      itemFormat.toLowerCase().includes("kindle") ||
      itemFormat.toLowerCase().includes("digital") ||
      itemFormat.toLowerCase().includes("pdf");

    const pdfUrl = isDigital
      ? getEbookPdfUrl(fmtObj?.pdfUrl || book.pdfUrl, book.slug || book.title)
      : "";

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.bookId === (book._id || book.id) && i.format === itemFormat
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        if (bookPriceINR !== undefined) next[existingIdx].priceINR = bookPriceINR;
        if (bookPriceUSD !== undefined) next[existingIdx].priceUSD = bookPriceUSD;
        if (pdfUrl) next[existingIdx].pdfUrl = pdfUrl;
        return next;
      } else {
        return [
          ...prev,
          {
            bookId: book._id || book.id,
            title: book.title,
            slug: book.slug,
            price: resolvedPricing.effectivePrice,
            priceUSD: bookPriceUSD,
            priceINR: bookPriceINR,
            format: itemFormat,
            coverImage: book.coverImage || "/aao-part-one.png",
            quantity,
            pdfUrl,
          },
        ];
      }
    });

    setCartOpen(true);
  };

  const removeFromCart = (bookId: string, format?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.bookId === bookId && (!format || i.format === format)))
    );
  };

  const updateQuantity = (bookId: string, format: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId, format);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.bookId === bookId && i.format === format ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      Number(
        items
          .reduce((acc, it) => acc + getItemPrice(it) * it.quantity, 0)
          .toFixed(2)
      ),
    [items, getItemPrice]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartOpen,
        setCartOpen,
        totalItems,
        subtotal,
        getItemPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
