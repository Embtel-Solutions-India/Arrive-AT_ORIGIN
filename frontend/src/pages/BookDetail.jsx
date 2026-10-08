import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import NotFound from "./NotFound";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.08] tracking-[-0.015em]";

function BookDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice, getProductPrice } = useCurrency();

  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState("Paperback");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    fetch(apiUrl(`/public/books/${slug}`))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.book) {
          setBook(json.data.book);
          setRelated(json.data.related || []);
          if (json.data.book.format) {
            setSelectedFormat(json.data.book.format);
          }
        } else {
          setBook(null);
        }
      })
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-svh bg-void text-vellum grid place-items-center">
        <p className="text-dim">Loading publication…</p>
      </div>
    );
  }

  if (!book) return <NotFound />;

  const isOutOfStock = book.stockQuantity <= 0;
  const pricing = getProductPrice(book);

  const handleBuyNow = () => {
    addToCart(book, quantity, selectedFormat);
    navigate("/checkout");
  };

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.7] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="mb-8 flex items-center gap-2 text-xs text-dim">
            <Link to="/" className="text-dim hover:text-vellum">Home</Link>
            <span>/</span>
            <Link to="/books" className="text-dim hover:text-vellum">Books</Link>
            <span>/</span>
            <span className="text-halo truncate">{book.title}</span>
          </nav>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
            {/* Left Cover Image (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.16)] bg-black/40 p-4 shadow-2xl">
                <img
                  src={book.coverImage || "/aao-part-one.png"}
                  alt={book.title}
                  className="w-full max-h-[560px] object-cover rounded-xl mx-auto shadow-md"
                />
              </div>
            </div>

            {/* Right Book Details & Checkout Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-mono tracking-widest text-halo uppercase">
                  <span>{book.categoryName}</span>
                  <span>·</span>
                  <span>By {book.authorName}</span>
                </div>
                <h1 className={`${heading} text-[clamp(2.4rem,4.5vw,3.6rem)] text-vellum mb-3`}>
                  {book.title}
                </h1>
                {book.shortDescription && (
                  <p className="text-lg text-[#C6CBD8] font-light leading-relaxed">
                    {book.shortDescription}
                  </p>
                )}
              </div>

              {/* Price & Stock Badge */}
              <div className="flex flex-wrap items-baseline gap-4 border-y border-[rgba(237,231,218,0.12)] py-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-halo">{formatPrice(pricing.effectivePrice)}</span>
                  {pricing.isSale && (
                    <span className="text-lg text-dim line-through">{formatPrice(pricing.price)}</span>
                  )}
                  {pricing.isSale && (
                    <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                      Save {formatPrice(pricing.price - pricing.effectivePrice)}
                    </span>
                  )}
                </div>

                <div className="ml-auto">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isOutOfStock
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {isOutOfStock ? "Out of Stock" : "In Stock & Ready to Ship"}
                  </span>
                </div>
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-xs font-semibold text-dim uppercase tracking-wider mb-2">
                  Select Edition / Format
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(book.formats?.length ? book.formats.map((f) => f.format) : ["Paperback", "Hardcover", "E-book"]).map(
                    (fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedFormat(fmt)}
                        className={`rounded-xl border px-4 py-2 text-xs font-semibold tracking-wider transition-all uppercase ${
                          selectedFormat === fmt
                            ? "border-halo bg-halo text-void"
                            : "border-[rgba(237,231,218,0.2)] text-vellum hover:border-vellum"
                        }`}
                      >
                        {fmt}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-dim font-medium uppercase">Qty:</span>
                  <div className="flex items-center rounded-xl border border-[rgba(237,231,218,0.25)] bg-white/5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 text-vellum hover:text-white"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-semibold text-white">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 text-vellum hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(book, quantity, selectedFormat)}
                    className="rounded-full bg-halo py-3.5 px-6 text-sm font-bold text-void transition-colors hover:bg-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-center"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="rounded-full border border-[rgba(237,231,218,0.3)] bg-white/[0.04] py-3.5 px-6 text-sm font-bold text-vellum transition-colors hover:border-halo hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-center"
                  >
                    Buy Now →
                  </button>
                </div>

                {book.amazonUrl && (
                  <div className="pt-1">
                    <a
                      href={book.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center rounded-full border border-[rgba(237,231,218,0.15)] py-2 text-xs text-dim hover:text-vellum hover:border-halo transition-colors"
                    >
                      Prefer buying from Amazon? View Amazon / KDP Listing ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="border-t border-[rgba(237,231,218,0.12)] pt-6 space-y-4">
                <h3 className={`${heading} text-xl text-vellum`}>About this Work</h3>
                <div
                  className="prose prose-invert max-w-none text-[#C6CBD8] text-sm leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: book.description }}
                />
              </div>

              {/* Specifications Table */}
              <div className="border-t border-[rgba(237,231,218,0.12)] pt-6">
                <h3 className={`${heading} text-lg text-vellum mb-3`}>Product Specifications</h3>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <dt className="text-dim">ISBN</dt>
                    <dd className="font-mono text-vellum mt-0.5">{book.isbn || "979-8877665544"}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Publisher</dt>
                    <dd className="text-vellum mt-0.5">{book.publisher || "Soul Body Publishing"}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Language</dt>
                    <dd className="text-vellum mt-0.5">{book.language || "English"}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Pages</dt>
                    <dd className="text-vellum mt-0.5">{book.pages || 200}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Format</dt>
                    <dd className="text-vellum mt-0.5">{book.format || "Paperback"}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">SKU</dt>
                    <dd className="font-mono text-vellum mt-0.5">{book.sku}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Related Publications */}
          {related.length > 0 && (
            <div className="mt-24 border-t border-[rgba(237,231,218,0.12)] pt-12">
              <h3 className={`${heading} text-2xl text-vellum mb-6`}>More from Dr. Alka Chopra Madan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((rel) => {
                  const relPricing = getProductPrice(rel);
                  return (
                    <Link
                      key={rel.slug}
                      to={`/books/${rel.slug}`}
                      className="group rounded-2xl border border-[rgba(237,231,218,0.1)] bg-white/[0.02] p-4 transition-all hover:border-halo"
                    >
                      <img
                        src={rel.coverImage || "/aao-part-one.png"}
                        alt={rel.title}
                        className="h-48 w-full object-cover rounded-xl mb-3 shadow"
                      />
                      <h4 className="font-medium text-sm text-vellum group-hover:text-halo truncate">{rel.title}</h4>
                      <p className="text-xs text-halo font-semibold mt-1">{formatPrice(relPricing.effectivePrice)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default BookDetail;
