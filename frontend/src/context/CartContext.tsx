import { createContext, useContext, useEffect, useState } from "react";

interface CartItem {
  bookId: string;
  title: string;
  slug: string;
  price: number;
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
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
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

  const addToCart = (book: any, quantity = 1, format?: string) => {
    const itemFormat = format || book.format || "Paperback";
    const itemPrice = book.salePrice ?? book.price;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.bookId === (book._id || book.id) && i.format === itemFormat
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      } else {
        return [
          ...prev,
          {
            bookId: book._id || book.id,
            title: book.title,
            slug: book.slug,
            price: itemPrice,
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

  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

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
