import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import { useCart } from "../context/CartContext";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.02] tracking-[-0.015em]";
const money = (n) => `$${(n || 0).toFixed(2)}`;

function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState("all");
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(apiUrl(`/public/books${selectedFormat !== "all" ? `?format=${selectedFormat}` : ""}`))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.books) {
          setBooks(json.data.books);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedFormat]);

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(56px,8vw,110px)]">
        <div className={shell}>
          {/* Header */}
          <div className="mb-[clamp(36px,5vw,64px)] border-b border-[rgba(237,231,218,0.12)] pb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-halo uppercase mb-2 block">
                Official Book Store
              </span>
              <h1 className={`${heading} text-[clamp(2.4rem,6vw,4.6rem)] mb-3`}>
                Books & Publications
              </h1>
              <p className="max-w-[62ch] text-[#C6CBD8]">
                Authored by Dr. Alka Chopra Madan. Printed volumes, paperbacks, and editions on metaphysics, living from origin, and induced calmness.
              </p>
            </div>

            {/* Format Filter */}
            <div className="flex flex-wrap gap-2 text-xs">
              {["all", "Paperback", "Hardcover", "E-book"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`rounded-full px-4 py-2 font-semibold tracking-wider transition-all uppercase ${
                    selectedFormat === fmt
                      ? "bg-halo text-void"
                      : "border border-[rgba(237,231,218,0.16)] text-dim hover:border-vellum hover:text-vellum"
                  }`}
                >
                  {fmt === "all" ? "All Formats" : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Book Catalog Grid */}
          {loading ? (
            <div className="py-20 text-center text-dim">Loading publications from store…</div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => {
                const isOutOfStock = book.stockQuantity <= 0;
                return (
                  <div
                    key={book._id}
                    className="group flex flex-col justify-between rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 transition-all duration-300 hover:border-halo hover:bg-[rgba(237,231,218,0.05)]"
                  >
                    <div>
                      {/* Book Cover */}
                      <Link
                        to={`/books/${book.slug}`}
                        className="relative block overflow-hidden rounded-xl aspect-[3/4] bg-black/40 mb-5 shadow-lg group-hover:shadow-2xl transition-shadow"
                      >
                        <img
                          src={book.coverImage || "/aao-part-one.png"}
                          alt={book.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {book.salePrice && (
                          <div className="absolute top-3 right-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow">
                            SALE
                          </div>
                        )}
                        {book.isFeatured && (
                          <div className="absolute top-3 left-3 rounded-full bg-halo/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-void">
                            ★ Featured
                          </div>
                        )}
                      </Link>

                      <div className="mb-2 text-xs font-mono tracking-wider text-halo uppercase">
                        {book.categoryName} · {book.format}
                      </div>

                      <Link to={`/books/${book.slug}`} className="no-underline">
                        <h2 className={`${heading} text-2xl text-vellum group-hover:text-halo transition-colors mb-2`}>
                          {book.title}
                        </h2>
                      </Link>

                      <p className="text-sm text-[#A9B0C2] leading-relaxed line-clamp-3 mb-4">
                        {book.shortDescription || book.description}
                      </p>
                    </div>

                    <div className="border-t border-[rgba(237,231,218,0.1)] pt-4 mt-2">
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          {book.salePrice ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-halo">{money(book.salePrice)}</span>
                              <span className="text-sm text-dim line-through">{money(book.price)}</span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-vellum">{money(book.price)}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isOutOfStock
                              ? "text-rose-400"
                              : book.stockQuantity <= 5
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : "In Stock"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(book)}
                          className="rounded-full bg-halo py-2.5 px-3 text-xs font-bold text-void transition-colors hover:bg-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-center"
                        >
                          Add to Cart
                        </button>
                        <Link
                          to={`/books/${book.slug}`}
                          className="rounded-full border border-[rgba(237,231,218,0.25)] py-2.5 px-3 text-xs font-semibold text-vellum hover:border-halo transition-colors text-center no-underline"
                        >
                          View Details
                        </Link>
                      </div>

                      {book.amazonUrl && (
                        <div className="mt-3 text-center">
                          <a
                            href={book.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[0.75rem] text-dim hover:text-vellum hover:underline"
                          >
                            Or order on Amazon ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Books;
