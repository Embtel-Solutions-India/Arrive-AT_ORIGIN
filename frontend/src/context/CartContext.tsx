import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useCurrency } from "./CurrencyContext";

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
   * Priority: discrete sale price -> discrete regular price -> fallback item.price.
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
        return typeof item.price === "number" && item.price > 100 ? item.price : 483.23;
      }

      // USD
      if (typeof item.salePriceUSD === "number" && item.salePriceUSD > 0) {
        return item.salePriceUSD;
      }
      if (typeof item.priceUSD === "number" && item.priceUSD > 0) {
        return item.priceUSD;
      }
      return typeof item.price === "number" && item.price < 100 ? item.price : 24.95;
    },
    [currency]
  );

  const addToCart = (book: any, quantity = 1, format?: string) => {
    const itemFormat = format || book.format || "Paperback";

    // Extract both USD and INR discrete pricing
    const resolvedPricing = getProductPrice(book);
    const bookPriceINR = typeof book.priceINR === "number" ? book.priceINR : undefined;
    const bookPriceUSD = typeof book.priceUSD === "number" ? book.priceUSD : undefined;
    const bookSaleINR = typeof book.salePriceINR === "number" ? book.salePriceINR : undefined;
    const bookSaleUSD = typeof book.salePriceUSD === "number" ? book.salePriceUSD : undefined;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.bookId === (book._id || book.id) && i.format === itemFormat
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        // Keep discrete prices updated if they changed
        if (bookPriceINR !== undefined) next[existingIdx].priceINR = bookPriceINR;
        if (bookPriceUSD !== undefined) next[existingIdx].priceUSD = bookPriceUSD;
        if (bookSaleINR !== undefined) next[existingIdx].salePriceINR = bookSaleINR;
        if (bookSaleUSD !== undefined) next[existingIdx].salePriceUSD = bookSaleUSD;
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
            salePriceUSD: bookSaleUSD,
            salePriceINR: bookSaleINR,
            format: itemFormat,
            coverImage: book.coverImage || "/aao-part-one.png",
            quantity,
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
