import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

export function CartDrawer() {
  const { items, removeFromCart, updateQuantity, cartOpen, setCartOpen, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#0F121C] text-[#EDE7DA] border-l border-[rgba(237,231,218,0.12)] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] p-5">
            <h2 className="font-display text-xl font-light">
              Your Cart ({totalItems})
            </h2>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="rounded-lg p-1.5 text-[#A9B0C2] hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-[#A9B0C2]">
                <span className="text-4xl mb-3">📖</span>
                <p className="font-medium text-lg text-white">Your cart is empty</p>
                <p className="text-xs text-[#A9B0C2] mt-1 max-w-xs">
                  Explore Dr. Alka Chopra Madan’s published books and writings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    navigate("/books");
                  }}
                  className="mt-5 rounded-full bg-[#E0C9A6] px-5 py-2.5 text-xs font-bold text-[#0B0D13] hover:bg-white transition-colors"
                >
                  Browse Book Store
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.bookId}-${item.format}-${idx}`}
                  className="flex gap-4 rounded-xl border border-[rgba(237,231,218,0.08)] bg-white/[0.02] p-3.5"
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-20 w-14 rounded object-cover border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-[#EDE7DA] truncate">{item.title}</h3>
                    <p className="text-xs text-[#C5A880] mt-0.5">{item.format}</p>
                    <p className="text-sm font-semibold text-white mt-1">{money(item.price)}</p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-[rgba(237,231,218,0.2)] bg-black/40">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.bookId, item.format, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-[#A9B0C2] hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.bookId, item.format, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-[#A9B0C2] hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.bookId, item.format)}
                        className="text-xs text-[#A9B0C2] hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="border-t border-[rgba(237,231,218,0.1)] p-5 space-y-3 bg-[#0B0D13]">
              <div className="space-y-1.5 text-xs text-[#A9B0C2]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{subtotal >= 50 ? "FREE (Orders over $50)" : "$5.00"}</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-[rgba(237,231,218,0.1)] pt-2 text-base font-bold text-white">
                <span>Estimated Total</span>
                <span className="text-[#E0C9A6]">
                  {money(subtotal + (subtotal >= 50 ? 0 : 5))}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate("/checkout");
                }}
                className="w-full rounded-full bg-[#E0C9A6] py-3 text-center text-sm font-bold text-[#0B0D13] hover:bg-white transition-all duration-150"
              >
                Proceed to Checkout →
              </button>

              <p className="text-center text-[0.7rem] text-[#A9B0C2]">
                Secure 256-bit encrypted checkout. Direct author fulfillment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
