import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import NotFound from "./NotFound";
import SEO from "../components/seo/SEO";
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
  const [selectedFormat, setSelectedFormat] = useState("E-Book");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    fetch(apiUrl(`/public/books/${slug}`))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.book) {
          const b = json.data.book;
          setBook(b);
          setRelated(json.data.related || []);

          // Find first available format to select by default (prefer E-Book, then Paperback, then Hardcover)
          const priority = ["E-Book", "Paperback", "Hardcover"];
          let defaultFormat = "E-Book";
          if (Array.isArray(b.formats) && b.formats.length > 0) {
            for (const p of priority) {
              const match = b.formats.find(
                (f) => {
                  const fn = (f.format || "").toLowerCase();
                  const target = p.toLowerCase();
                  const isEbookMatch = (target.includes("ebook") || target.includes("e-book")) && (fn.includes("ebook") || fn.includes("e-book") || fn.includes("kindle"));
                  return (fn === target || isEbookMatch) && f.isAvailable !== false && f.price > 0;
                }
              );
              if (match) {
                defaultFormat = p;
                break;
              }
            }
          } else if (b.format) {
            defaultFormat = b.format === "Kindle" ? "E-Book" : b.format;
          }
          setSelectedFormat(defaultFormat);
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

  // Resolve price according to the currently selected format
  const pricing = getProductPrice(book, selectedFormat);

  // Check if current format is available
  const currentFormatObj = Array.isArray(book.formats)
    ? book.formats.find((f) => {
        const fn = (f.format || "").toLowerCase();
        const sf = selectedFormat.toLowerCase();
        const isEbookMatch = (sf.includes("ebook") || sf.includes("e-book")) && (fn.includes("ebook") || fn.includes("e-book") || fn.includes("kindle"));
        return fn === sf || isEbookMatch;
      })
    : null;

  const isCurrentFormatAvailable = currentFormatObj
    ? currentFormatObj.isAvailable !== false && currentFormatObj.price > 0
    : true;

  const isOutOfStock = book.stockQuantity <= 0 || !isCurrentFormatAvailable;

  const handleBuyNow = () => {
    if (!isCurrentFormatAvailable) return;
    addToCart(book, quantity, selectedFormat);
    navigate("/checkout");
  };

  // The 3 standard Amazon US format types
  const formatOptions = [
    {
      key: "E-Book",
      title: "E-Book",
      badge: "e-Book Soft Copy",
      icon: "📱",
      description: "Instant digital soft copy delivered to your user account upon purchase",
    },
    {
      key: "Paperback",
      title: "Paperback",
      badge: "Printed Book",
      icon: "📖",
      description: "Quality printed paperback edition delivered to your doorstep",
    },
    {
      key: "Hardcover",
      title: "Hardcover",
      badge: "Collector Edition",
      icon: "📕",
      description: "Durable casebound collector hardback volume",
    },
  ];

  const isEbookSelected =
    selectedFormat.toLowerCase().includes("ebook") ||
    selectedFormat.toLowerCase().includes("e-book") ||
    selectedFormat.toLowerCase().includes("kindle");

  const pageTitle = book.seo?.seoTitle || `${book.title} — Dr. Alka Chopra Madan | Official Bookstore`;
  const rawDesc = book.seo?.metaDescription || book.subtitle || (book.description ? book.description.replace(/<[^>]+>/g, "").slice(0, 160) : "") || `Explore and order ${book.title} by Dr. Alka Chopra Madan.`;
  const pageKeywords = book.seo?.focusKeyword || `${book.title}, Dr Alka Chopra Madan, Arrive at Origin, metaphysics books, spiritual guidance, Concept Clearing`;
  const bookOgImage = book.coverImage?.startsWith("http") ? book.coverImage : `https://arriveatorigin.com${book.coverImage || "/aao-part-one.png"}`;
  const bookCanonical = book.seo?.canonicalUrl || `https://arriveatorigin.com/books/${slug}`;

  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "description": rawDesc,
    "image": bookOgImage,
    "url": bookCanonical,
    "author": {
      "@type": "Person",
      "name": "Dr. Alka Chopra Madan, D.Msc.",
      "url": "https://arriveatorigin.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Soul Body Healing Center",
      "url": "https://arriveatorigin.com"
    },
    "inLanguage": "en"
  };

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.7] selection:bg-gold selection:text-void">
      <SEO
        title={pageTitle}
        description={rawDesc}
        keywords={pageKeywords}
        canonical={bookCanonical}
        ogType="book"
        ogImage={bookOgImage}
        jsonLd={bookSchema}
      />
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="mb-6 sm:mb-8 flex flex-wrap items-center gap-1.5 text-xs text-dim">
            <Link to="/" className="text-dim hover:text-vellum">Home</Link>
            <span>/</span>
            <Link to="/books" className="text-dim hover:text-vellum">Books</Link>
            <span>/</span>
            <span className="text-halo truncate max-w-[220px] sm:max-w-none">{book.title}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-12 items-start">
            {/* Left Cover Image (5 cols) */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28 overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.16)] bg-black/40 p-3 sm:p-4 shadow-2xl">
                <img
                  src={book.coverImage || "/aao-part-one.png"}
                  alt={book.title}
                  className="w-full max-h-[460px] sm:max-h-[560px] object-cover rounded-xl mx-auto shadow-md"
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
                  {isCurrentFormatAvailable ? (
                    <>
                      <span className="text-3xl font-bold text-halo">{formatPrice(pricing.effectivePrice)}</span>
                      <span className="text-xs uppercase font-mono text-dim tracking-wider">
                        ({selectedFormat} Edition)
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-rose-400">
                      Not Available in {selectedFormat}
                    </span>
                  )}
                  {pricing.isSale && isCurrentFormatAvailable && (
                    <span className="text-lg text-dim line-through">{formatPrice(pricing.price)}</span>
                  )}
                </div>

                <div className="ml-auto">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      !isCurrentFormatAvailable
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : isOutOfStock
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {!isCurrentFormatAvailable
                      ? "Format Not Available"
                      : isEbookSelected
                      ? "⚡ Instant Soft Copy Access"
                      : "In Stock & Ready to Ship"}
                  </span>
                </div>
              </div>

              {/* 3 Book Format Types as per Amazon US Pricing */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-dim uppercase tracking-wider">
                    Select Edition / Format (Amazon US Pricing)
                  </label>
                  <span className="text-[0.72rem] text-halo font-mono">
                    3 Formats Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {formatOptions.map((opt) => {
                    const fmtData = book.formats?.find((f) => {
                      const fn = (f.format || "").toLowerCase();
                      const sf = opt.key.toLowerCase();
                      const isEbookMatch = (sf.includes("ebook") || sf.includes("e-book")) && (fn.includes("ebook") || fn.includes("e-book") || fn.includes("kindle"));
                      return fn === sf || isEbookMatch;
                    });

                    const isAvailable = Boolean(fmtData && fmtData.isAvailable !== false && fmtData.price > 0);
                    const isSelected = selectedFormat === opt.key;
                    const formatPriceResult = isAvailable ? getProductPrice(book, opt.key) : null;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedFormat(opt.key)}
                        className={`relative rounded-2xl p-4 text-left transition-all border ${
                          isSelected
                            ? "border-halo bg-halo/15 shadow-[0_0_24px_rgba(201,168,106,0.25)] ring-2 ring-halo"
                            : isAvailable
                            ? "border-[rgba(237,231,218,0.18)] bg-white/[0.03] hover:border-vellum hover:bg-white/[0.06] cursor-pointer"
                            : "border-dashed border-white/10 bg-black/30 opacity-45 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm text-vellum flex items-center gap-1.5">
                            <span>{opt.icon}</span>
                            <span>{opt.title}</span>
                          </span>
                          {isSelected && (
                            <span className="h-4 w-4 rounded-full bg-halo text-void flex items-center justify-center text-[0.65rem] font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <span className="block text-[0.68rem] text-dim font-medium uppercase tracking-wider mb-3">
                          {opt.badge}
                        </span>

                        <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                          <span
                            className={
                              isAvailable
                                ? "font-bold text-base text-halo"
                                : "text-xs text-rose-300 font-semibold"
                            }
                          >
                            {isAvailable && formatPriceResult
                              ? formatPrice(formatPriceResult.effectivePrice)
                              : "Not Available"}
                          </span>
                          <span
                            className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                              isAvailable
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-white/5 text-dim border border-white/5"
                            }`}
                          >
                            {isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Soft Copy Notice if E-Book selected */}
              {isEbookSelected && (
                <div className="rounded-2xl border border-halo/30 bg-gradient-to-r from-halo/10 via-black/40 to-halo/5 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-halo/20 text-halo text-lg shadow">
                      📱
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-halo">
                          Instant E-Book Soft Copy (PDF)
                        </h4>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-300 border border-emerald-500/30">
                          Included With Purchase
                        </span>
                      </div>
                      <p className="text-xs text-[#C6CBD8] mt-1 leading-relaxed">
                        After purchasing this book, your e-book soft copy will appear automatically in your User Account. You can read it online anytime or download the complete PDF to your tablet, phone, or computer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                    className="rounded-full bg-halo py-3.5 px-6 text-sm font-bold text-void transition-colors hover:bg-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-center shadow-[0_4px_20px_rgba(201,168,106,0.25)]"
                  >
                    {!isCurrentFormatAvailable ? "Format Not Available" : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="rounded-full border border-[rgba(237,231,218,0.3)] bg-white/[0.04] py-3.5 px-6 text-sm font-bold text-vellum transition-colors hover:border-halo hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-center"
                  >
                    {!isCurrentFormatAvailable ? "Unavailable" : "Buy Now →"}
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
                      Prefer buying from Amazon? View Amazon US Listing ↗
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
