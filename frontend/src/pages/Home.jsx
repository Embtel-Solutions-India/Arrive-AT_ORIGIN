import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SocialIcon from "../components/SocialIcon";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import HeroCanvas from "../components/landing/HeroCanvas";
import ThresholdCompare from "../components/landing/ThresholdCompare";
import FrameworkTabs from "../components/landing/FrameworkTabs";
import Reveal from "../components/landing/Reveal";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading =
  "font-display font-light leading-[1.02] tracking-[-0.015em]";

const practiceItems = [
  {
    title: "Private sessions",
    text: "Unhurried one-to-one work for clarity, self-observation, life transition and reconnection with yourself.",
    cta: "Book",
  },
  {
    title: "Grief and life transition",
    text: "Company for loss, change and identity shift — without being told what stage you are supposed to be at.",
    cta: "Book",
  },
  {
    title: "Relationship and marriage counsel",
    text: "See the pattern underneath the conflict so you can respond from your own ground rather than the argument's.",
    cta: "Book",
  },
  {
    title: "Spiritual counsel",
    text: "For seekers working on meaning, self-realisation and the relationship between soul, body and mind.",
    cta: "Book",
  },
  {
    title: "Stress and emotional overload",
    text: "Step out of mental congestion long enough to see the situation before forcing an answer onto it.",
    cta: "Book",
  },
  {
    title: "Corporate mind-fitness",
    text: "AAO and Living from Origin for leaders and teams: attention, clarity, resilience and the human side of work.",
    cta: "Enquire",
  },
];

const books = [
  {
    tagline: "Earlier work",
    title: "Keeping It Simple",
    slug: "keeping-it-simple",
    priceINR: 289.55,
    priceUSD: 2.99,
    href: "https://www.amazon.com/dp/B07VRKSC9P",
    image: "/keeping-it-simple.png",
    alt: "Keeping It Simple book cover",
    text: "Soul, body and mind do not require life to be made more complicated than it already is.",
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Peace",
    slug: "your-path-to-peace",
    priceINR: 386.39,
    priceUSD: 3.99,
    href: "https://www.amazon.com/dp/B0GJQV5M2F",
    image: "/your-path-to-peace.png",
    alt: "Your Path to Peace book cover",
    text: "A journey beyond calmness — toward the peace that remains when what is unfinished is no longer veiled.",
  },
  {
    tagline: "Earlier work",
    title: "Life Force: Lost and Found",
    slug: "life-force-lost-and-found",
    priceINR: 289.55,
    priceUSD: 2.99,
    href: "https://www.amazon.com/Life-Force-Alka-Chopra-Madan-ebook/dp/B07VQDY6VP",
    image: "/life-force-lost-and-found.png",
    alt: "Life Force: Lost and Found book cover",
    text: "Energy, wholeness, and reconnecting with the vitality of being alive.",
  },
  {
    tagline: "AAO series · Part One",
    title: "Arrive at Origin",
    slug: "arrive-at-origin-part-one",
    priceINR: 483.23,
    priceUSD: 4.99,
    href: "https://www.amazon.com/dp/B0GX33FYHW",
    image: "/aao-part-one.png",
    alt: "Arrive at Origin, Part One book cover",
    text: "The central work. Origin as the position that remains when you stop moving away from yourself, and the method for returning to it.",
    series: true,
  },
  {
    tagline: "AAO series · Part Two",
    title: "Arrive at Origin II",
    slug: "arrive-at-origin-part-two",
    priceINR: 483.23,
    priceUSD: 4.99,
    href: "https://www.amazon.com/dp/B0H1H83KNV",
    image: "/aao-part-two.png",
    alt: "Arrive at Origin, Part Two book cover",
    text: "The elaboration: Concept Clearing as gateway, the four movements in depth, and living from Origin inside ordinary obligation.",
    series: true,
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Transformation",
    slug: "your-path-to-transformation",
    priceINR: 484.20,
    priceUSD: 5.00,
    href: "https://www.amazon.com/dp/B0CR9H7YMH",
    image: "/your-path-to-transformation.png",
    alt: "Your Path to Transformation book cover",
    text: "Change, unpredictability, and the way we meet a life that does not consult us first.",
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Spirituality",
    slug: "your-path-to-spirituality",
    priceINR: 290.52,
    priceUSD: 3.00,
    href: "https://www.amazon.com/dp/B0BBS9GRPJ",
    image: "/your-path-to-spirituality.png",
    alt: "Your Path to Spirituality book cover",
    text: "A return to what spirituality is underneath the labels it has collected.",
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Healing",
    slug: "your-path-to-healing",
    priceINR: 483.23,
    priceUSD: 4.99,
    href: "https://www.amazon.com/dp/B0C386DNVQ",
    image: "/your-path-to-healing.png",
    alt: "Your Path to Healing book cover",
    text: "What healing means across living, loss and recovery — held as inquiry rather than instruction.",
  },
];

function BookCard({ book, hidden }) {
  const { addToCart } = useCart();
  const { formatPrice, getProductPrice, currency } = useCurrency();
  const [added, setAdded] = useState(false);

  const pricing = getProductPrice(book);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      _id: book.slug,
      id: book.slug,
      title: book.title,
      slug: book.slug,
      price: pricing.effectivePrice,
      priceUSD: book.priceUSD,
      priceINR: book.priceINR,
      currency,
      format: "Paperback",
      coverImage: book.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      aria-hidden={hidden || undefined}
      className="group relative flex h-[560px] w-[260px] sm:w-[270px] shrink-0 flex-col rounded-2xl border border-[rgba(237,231,218,0.14)] p-4 pb-5 text-vellum transition-all duration-300 hover:border-halo/70 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] select-none"
      style={{ background: "linear-gradient(165deg, #0E1630 0%, #1A1832 55%, #2A1F40 100%)" }}
    >
      {/* Centered Gallery Book Cover */}
      <div className="relative flex items-center justify-center w-full h-[220px] mb-3 flex-shrink-0">
        <Link
          to={`/books/${book.slug}`}
          tabIndex={hidden ? -1 : undefined}
          aria-label={`${book.title} — view publication details`}
          className="relative block h-full aspect-[2/3] overflow-hidden rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.45)] group-hover:shadow-[0_14px_30px_rgba(0,0,0,0.65)] group-hover:scale-[1.03] transition-all duration-300"
        >
          {book.image ? (
            <img
              src={book.image}
              alt={hidden ? "" : book.alt}
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[rgba(237,231,218,0.25)] text-[0.78rem] text-[#A9B0C2]">
              Cover coming soon
            </div>
          )}
        </Link>
      </div>

      {/* Book Metadata: Tagline, Title, Excerpt */}
      <div className="flex flex-col flex-1 min-h-0">
        <span className="text-[0.66rem] tracking-[0.16em] text-halo uppercase block font-mono font-semibold">
          {book.tagline}
        </span>

        {/* Title */}
        <Link
          to={`/books/${book.slug}`}
          tabIndex={hidden ? -1 : undefined}
          className="no-underline block mt-1"
        >
          <h3 className="m-0 line-clamp-2 min-h-[2.4em] font-display text-[1.06rem] font-light leading-[1.28] text-vellum group-hover:text-halo transition-colors">
            {book.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {book.text && (
          <p className="m-0 mt-1 line-clamp-2 text-[0.76rem] text-[#C6CBD8] leading-relaxed">
            {book.text}
          </p>
        )}
      </div>

      {/* Bottom Actions Cluster: Guaranteed clearance & fixed positions */}
      <div className="mt-auto pt-3 border-t border-[rgba(237,231,218,0.12)] flex-shrink-0">
        {/* Price & Website Details link */}
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-display text-[1.08rem] font-semibold text-halo tracking-tight">
            {formatPrice(pricing.effectivePrice)}
          </span>
          <Link
            to={`/books/${book.slug}`}
            tabIndex={hidden ? -1 : undefined}
            className="text-[0.72rem] text-dim hover:text-halo transition-colors no-underline font-medium"
          >
            Details →
          </Link>
        </div>

        {/* Action Buttons: Add to Cart & Buy on Amazon */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            tabIndex={hidden ? -1 : undefined}
            onClick={handleAddToCart}
            className="w-full h-9 rounded-full bg-halo px-3 text-[0.76rem] font-bold text-void transition-all duration-200 hover:bg-white hover:shadow-md active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
          >
            {added ? (
              <>
                <span className="text-emerald-800 font-bold">✓</span> Added to Cart
              </>
            ) : (
              <>Add to Cart</>
            )}
          </button>

          {book.href && (
            <a
              href={book.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={hidden ? -1 : undefined}
              aria-label={`${book.title} — buy on Amazon`}
              className="w-full h-8 rounded-full border border-[rgba(237,231,218,0.22)] bg-white/[0.05] px-3 text-[0.72rem] font-semibold text-vellum transition-all duration-200 hover:border-halo hover:bg-white/10 hover:text-white text-center no-underline flex items-center justify-center gap-1"
            >
              <span>Buy on Amazon</span>
              <span aria-hidden="true" className="text-halo text-[0.8rem]">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function Home() {
  const [isBooksPaused, setIsBooksPaused] = useState(false);

  useEffect(() => {
    const existing = document.querySelector('script[src="https://elfsightcdn.com/platform.js"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://elfsightcdn.com/platform.js";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.ElfsightApp) {
      try {
        window.ElfsightApp.initialize?.();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <div className="bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] font-normal selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />

      <main id="top">
        {/* HERO */}
        <section className="relative flex min-h-[min(94svh,900px)] items-center overflow-hidden py-24 pb-[72px]">
          <HeroCanvas />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(120% 80% at 72% 40%, transparent 30%, rgba(7,11,24,.86) 78%)",
            }}
          />
          <div className={`${shell} relative z-[2] max-w-[56ch]`}>
            <div className="mb-[26px] flex items-center gap-[10px] text-[0.82rem] tracking-[0.02em] text-halo">
              <span className="inline-block h-px w-[34px] bg-gold" /> Doctorate in Metaphysics · Fremont, California
            </div>
            <h1 className={`${heading} mb-[0.34em] text-[clamp(2.9rem,7.4vw,5.6rem)]`}>
              There is a self in you that your history did not build.
            </h1>
            <p className="max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.22rem)] text-[#C6CBD8]">
              I am Dr. Alka Chopra Madan. For more than thirty-eight years I have worked with the part of a person
              that circumstance never manufactured — the meta-human. Metaphysics is the discipline that studies it.
              This practice is where it is put to use.
            </p>
            <div className="mt-[34px] flex flex-wrap gap-[14px]">
              <a
                href="#threshold"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-halo bg-halo px-[26px] text-[0.95rem] font-bold text-void no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white"
              >
                See what meta-human means
              </a>
              <Link
                to="/schedule"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[rgba(237,231,218,0.32)] bg-transparent px-[26px] text-[0.95rem] font-bold text-vellum no-underline transition-all duration-200 hover:border-halo hover:bg-[rgba(237,231,218,0.08)]"
              >
                Book a conversation
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-[26px] gap-y-[10px] text-[0.86rem] text-dim">
              <span>
                <b className="font-medium text-vellum">D.Msc.</b> Doctorate in Metaphysics
              </span>
              <span>
                <b className="font-medium text-vellum">38+ years</b> in holistic practice
              </span>
              <span>
                <b className="font-medium text-vellum">Author</b> of the AAO series
              </span>
            </div>
          </div>
        </section>

        {/* THRESHOLD */}
        <section className="relative py-[clamp(72px,10vw,132px)]" id="threshold">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)]`}>
                Two ways of reading the same life.
              </h2>
              <p className="max-w-[56ch] text-vellum">
                The human is the part assembled from memory, role, injury and expectation. The meta-human is what
                remains when that assembly is set down — awareness that observes rather than reacts. Both are
                present in everyone. Drag the threshold and watch the same four moments change meaning.
              </p>
            </Reveal>

            <Reveal>
              <ThresholdCompare />
            </Reveal>
          </div>
        </section>

        {/* METAPHYSICS */}
        <section className="relative bg-vellum py-[clamp(72px,10vw,132px)] text-ink" id="metaphysics">
          <div className={`${shell} grid grid-cols-1 items-start gap-[clamp(32px,6vw,86px)] lg:grid-cols-[0.95fr_1.05fr]`}>
            <Reveal
              as="aside"
              className="rounded-[18px] border border-[rgba(42,38,24,0.18)] p-[clamp(26px,3.4vw,40px)] lg:sticky lg:top-[110px]"
              style={{ background: "linear-gradient(160deg, #fff, rgba(201,153,46,.09))" }}
            >
              <div className={`${heading} text-[clamp(2.4rem,5vw,3.6rem)] text-ink`}>
                <small className="mb-3 block font-text text-[0.8rem] tracking-[0.16em] text-gold">The credential</small>
                D.Msc.
              </div>
              <p className="mt-[14px] mb-0 max-w-none text-[#4A4638]">
                Metaphysics asks what a human being fundamentally <em>is</em> — beneath biology, biography and
                behaviour. It is the field that already holds the question the meta-human answers.
              </p>
              <ul className="mt-[26px] list-none p-0 text-[0.94rem]">
                <li className="border-t border-[rgba(42,38,24,0.14)] py-3 text-[#4A4638]">
                  <b className="font-bold text-ink">Doctorate in Metaphysics</b> — the academic ground of this work
                </li>
                <li className="border-t border-[rgba(42,38,24,0.14)] py-3 text-[#4A4638]">
                  <b className="font-bold text-ink">38+ years</b> of holistic and alternative healing practice
                </li>
                <li className="border-t border-[rgba(42,38,24,0.14)] py-3 text-[#4A4638]">
                  <b className="font-bold text-ink">Author</b> of the AAO — Arrive at Origin series
                </li>
                <li className="border-t border-[rgba(42,38,24,0.14)] py-3 text-[#4A4638]">
                  <b className="font-bold text-ink">Founder</b>, Soul Body Healing Center, Fremont
                </li>
              </ul>
            </Reveal>

            <Reveal className="grid gap-0">
              <div className="border-t-0 pt-0 pb-7">
                <h3 className={`${heading} mb-[0.4em] text-[clamp(1.35rem,2.2vw,1.75rem)] text-ink`}>
                  Why the meta-human needs metaphysics, not motivation
                </h3>
                <p className="mb-0 max-w-none text-[#4A4638]">
                  Coaching improves performance. Therapy treats disorder. Neither is designed to ask what remains of
                  a person when performance and disorder are both set aside. That question belongs to metaphysics,
                  and it is where this doctorate lands.
                </p>
              </div>
              <div className="border-t border-[rgba(42,38,24,0.16)] py-7">
                <h3 className={`${heading} mb-[0.4em] text-[clamp(1.35rem,2.2vw,1.75rem)] text-ink`}>
                  The work is subtraction, not acquisition
                </h3>
                <p className="mb-0 max-w-none text-[#4A4638]">
                  Nothing here adds another identity, discipline or belief system to the ones you already carry. The
                  method removes what was borrowed until what is actually yours becomes legible again. People often
                  describe the result as relief rather than achievement.
                </p>
              </div>
              <div className="border-t border-[rgba(42,38,24,0.16)] py-7">
                <h3 className={`${heading} mb-[0.4em] text-[clamp(1.35rem,2.2vw,1.75rem)] text-ink`}>
                  Rigorous inside, ordinary outside
                </h3>
                <p className="mb-0 max-w-none text-[#4A4638]">
                  The framework behind a session is precise. The session itself is a conversation — plain language,
                  no ceremony, no requirement that you hold any particular belief. Engineers, physicians, founders
                  and grandmothers sit in the same chair.
                </p>
              </div>
              <div className="border-t border-[rgba(42,38,24,0.16)] py-7">
                <h3 className={`${heading} mb-[0.4em] text-[clamp(1.35rem,2.2vw,1.75rem)] text-ink`}>
                  Tested against real life, not retreat conditions
                </h3>
                <p className="mb-0 max-w-none text-[#4A4638]">
                  These frameworks were formed across decades of holistic practice, spiritual education and running
                  businesses — grief, litigation, payroll, family. A metaphysics that only works in silence is not
                  yet finished.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FRAMEWORKS */}
        <section className="relative py-[clamp(72px,10vw,132px)]" id="frameworks">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)]`}>
                Three original frameworks, in sequence.
              </h2>
              <p className="max-w-[56ch] text-vellum">
                Each one was developed by Dr. Alka and each does a different job. Concept Clearing is the gateway.
                AAO is the passage. Living from Origin is the grounded state you carry into daily life.
              </p>
            </Reveal>

            <FrameworkTabs />
          </div>
        </section>

        {/* MOVEMENTS */}
        <section className="relative bg-vellum py-[clamp(72px,10vw,132px)] text-ink">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)] text-ink`}>
                What arriving actually looks like.
              </h2>
              <p className="max-w-[56ch] text-[#4A4638]">
                The four movements of AAO are a sequence, though people rarely walk them in a straight line. Most
                return to the first one many times, and that is the work behaving correctly.
              </p>
            </Reveal>
          </div>
          <Reveal className={shell}>
            <div className="grid grid-cols-1 gap-px border-y border-[rgba(42,38,24,0.16)] bg-[rgba(42,38,24,0.16)] sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  n: "First movement",
                  title: "Observe",
                  text: "Stop adding. Watch the thought, the reaction, the role and the pressure without immediately doing what they say.",
                },
                {
                  n: "Second movement",
                  title: "Differentiate",
                  text: "Begin separating your own response from habit, fear, inheritance and other people's expectations of you.",
                },
                {
                  n: "Third movement",
                  title: "Arrive",
                  text: "Reconnect with the quieter centre that was underneath the identities the whole time, unhurried and unimpressed.",
                },
                {
                  n: "Fourth movement",
                  title: "Live from Origin",
                  text: "Go back to work, family, grief, money and love — carrying steadiness instead of trying to manufacture it.",
                },
              ].map((mv) => (
                <article key={mv.title} className="bg-vellum px-[26px] pt-8 pb-[38px]">
                  <span className="mb-5 block font-display text-[0.9rem] text-gold">{mv.n}</span>
                  <h3 className={`${heading} mb-[0.45em] text-2xl text-ink`}>{mv.title}</h3>
                  <p className="m-0 text-[0.94rem] text-[#4A4638]">{mv.text}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* PRACTICE */}
        <section className="relative py-[clamp(72px,10vw,132px)]" id="practice">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)]`}>
                One method, applied to the situation you are actually in.
              </h2>
              <p className="max-w-[56ch] text-vellum">
                These are not separate services. Each is the same work — clear the concept, observe, differentiate,
                arrive — entered through a different door. Sessions are held in Fremont and online.
              </p>
            </Reveal>

            <Reveal as="div" className="border-t border-[rgba(237,231,218,0.14)]">
              {practiceItems.map((item) => (
                <Link
                  key={item.title}
                  to="/schedule"
                  className="group grid grid-cols-1 items-baseline gap-2 border-b border-[rgba(237,231,218,0.14)] py-[30px] no-underline transition-all duration-300 hover:bg-linear-to-r hover:from-[rgba(232,206,140,0.1)] hover:to-transparent hover:pl-[18px] focus-visible:bg-linear-to-r focus-visible:from-[rgba(232,206,140,0.1)] focus-visible:to-transparent focus-visible:pl-[18px] sm:grid-cols-[minmax(220px,0.9fr)_1.4fr_auto] sm:gap-6"
                >
                  <h3 className={`${heading} text-[clamp(1.3rem,2vw,1.7rem)] font-normal text-vellum`}>{item.title}</h3>
                  <p className="m-0 text-[0.95rem] text-[#A9B0C2]">{item.text}</p>
                  <span className="text-[0.85rem] whitespace-nowrap text-halo opacity-100 transition-opacity duration-300 sm:opacity-[0.55] sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                    {item.cta}
                  </span>
                </Link>
              ))}
            </Reveal>
          </div>
        </section>

        {/* BOOKS */}
        <section className="relative bg-vellum-2 py-[clamp(72px,10vw,132px)] text-ink" id="books">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[34ch]">
                <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)] text-ink`}>
                  The written body of work.
                </h2>
                <p className="max-w-[56ch] text-[#4A4638]">
                  The books are not companion products to the practice — they are where the frameworks are set down in
                  full. The AAO series is the spine; the earlier titles are the inquiry that led to it.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBooksPaused((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white/70 px-4 py-2.5 text-xs font-semibold text-ink hover:border-ink hover:bg-white transition-all cursor-pointer shadow-sm"
                  title={isBooksPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
                  aria-label={isBooksPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
                >
                  <span className="text-sm leading-none" aria-hidden="true">
                    {isBooksPaused ? "▶" : "⏸"}
                  </span>
                  <span>{isBooksPaused ? "Resume Scroll" : "Pause Scroll"}</span>
                </button>
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-vellum hover:bg-gold hover:text-ink transition-colors no-underline shadow-sm"
                >
                  Visit Book Store & Orders →
                </Link>
              </div>
            </Reveal>

            <Reveal as="div" className="book-marquee -mx-[clamp(20px,5vw,64px)]">
              <div
                className="book-track"
                style={{ animationPlayState: isBooksPaused ? "paused" : undefined }}
              >
                {[...books, ...books].map((book, i) => (
                  <BookCard key={`${book.title}-${i}`} book={book} hidden={i >= books.length} />
                ))}
              </div>
            </Reveal>

            <Reveal className="mt-8 flex flex-wrap gap-[22px] text-[0.9rem] text-[#4A4638]">
              <span>
                <b className="block font-display text-[1.3rem] font-normal text-ink">हिन्दी</b> AAO in Hindi — in
                translation
              </span>
              <span>
                <b className="block font-display text-[1.3rem] font-normal text-ink">ਪੰਜਾਬੀ</b> AAO in Punjabi — in
                translation
              </span>
            </Reveal>
          </div>
        </section>



        {/* VOICES / GOOGLE REVIEWS */}
        <section className="relative bg-vellum py-[clamp(72px,10vw,132px)] text-ink" id="voices">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[42ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)] text-ink`}>
                What people say afterward.
              </h2>
              <p className="max-w-[56ch] text-[#4A4638]">
                Real Google verified reviews from clients who have experienced Soul Body Healing Center counsel and metaphysical guidance.
              </p>
            </Reveal>

            {/* Elfsight Google Reviews | Soul Body Healing Centre */}
            <Reveal className="my-8 w-full min-h-[300px]">
              <div
                className="elfsight-app-3a7e5042-128d-438e-aa63-5a702876d9a9"
                data-elfsight-app-lazy
              />
            </Reveal>
            <Reveal className="mt-11 flex flex-wrap gap-3">
              {[
                { name: "Google reviews", icon: "google", href: "https://g.page/r/CVDKnf9pk9KdEBM/review" },
                { name: "Facebook recommendations", icon: "facebook", href: "https://www.facebook.com/soulbodyhealingcenter" },
                { name: "Yelp", icon: "yelp", href: "https://www.yelp.com/biz/soul-body-healing-center-fremont-2" },
                { name: "Thumbtack" },
                { name: "Instagram", icon: "instagram", href: "https://www.instagram.com/soulbodyhealing.path/" },
              ].map((plat) => (
                <a
                  key={plat.name}
                  href={plat.href || "#"}
                  {...(plat.href ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(42,38,24,0.2)] px-5 py-[11px] text-[0.9rem] text-ink no-underline transition-all duration-200 hover:border-ink hover:bg-ink hover:text-vellum"
                >
                  {plat.icon && <SocialIcon name={plat.icon} />}
                  {plat.name}
                </a>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ABOUT */}
        <section className="relative py-[clamp(72px,10vw,132px)]" id="about">
          <div className={`${shell} grid grid-cols-1 items-center gap-[clamp(30px,5vw,72px)] md:grid-cols-[0.8fr_1.2fr]`}>
            <Reveal
              className="relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.14)] p-6"
              style={{
                background:
                  "radial-gradient(90% 70% at 50% 18%, rgba(232,206,140,.28), transparent 60%), linear-gradient(170deg, #1B2647, #0A1024 70%)",
              }}
            >
              <img
                src="/dr-alka-chopra-madan.png"
                alt="Dr. Alka Chopra Madan — AAO: Arrive at Origin"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </Reveal>
            <Reveal>
              <h2 className={`${heading} mb-[0.4em] text-[clamp(2rem,4vw,3.2rem)]`}>
                A life spent watching people, and life itself.
              </h2>
              <p className="max-w-[64ch] text-vellum">
                My work sits at an unusual intersection: metaphysical study, spiritual inquiry, entrepreneurship,
                philanthropy, and decades of listening to people navigate the plain difficulty of being human. I have
                run companies and buried people I loved. Both taught me the same thing.
              </p>
              <p className="max-w-[64ch] text-vellum">
                I do not position myself as the person holding your answers. My role is to create conditions in
                which you can see more clearly, hear yourself more honestly, and become steadily less dependent on
                anyone else's reading of your life — including mine.
              </p>
              <p className="max-w-[64ch] text-vellum">AAO is the clearest expression of that. The meta-human is who it is addressed to.</p>
              <div className="mt-[34px] flex flex-wrap gap-[14px]">
                <Link
                  to="/schedule"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-halo bg-halo px-[26px] text-[0.95rem] font-bold text-void no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white"
                >
                  Book a conversation
                </Link>
                <a
                  href="#books"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[rgba(237,231,218,0.32)] bg-transparent px-[26px] text-[0.95rem] font-bold text-vellum no-underline transition-all duration-200 hover:border-halo hover:bg-[rgba(237,231,218,0.08)]"
                >
                  Read the books
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* BEGIN */}
        <section
          className="relative py-[clamp(72px,10vw,132px)]"
          id="begin"
          style={{ background: "linear-gradient(150deg, #101B3D, #070B18 70%)" }}
        >
          <div className={`${shell} grid grid-cols-1 items-end gap-[clamp(30px,5vw,70px)] md:grid-cols-[1.2fr_0.8fr]`}>
            <Reveal>
              <h2 className={`${heading} mb-[0.3em] text-[clamp(2.4rem,6vw,4.6rem)]`}>Begin by arriving.</h2>
              <p className="text-[1.08rem] text-[#C6CBD8]">
                Grief, confusion, strain at home, pressure at work, spiritual questions — or only the sense that you
                have drifted some distance from yourself. Any of those is a legitimate first sentence.
              </p>
            </Reveal>
            <Reveal className="text-[0.98rem] leading-[2] text-[#C6CBD8]">
              39159 Paseo Padre Parkway, Suite 115
              <br />
              Fremont, CA 94538
              <br />
              <a href="tel:+15108308771" className="border-b border-[rgba(232,206,140,0.35)] text-halo no-underline">
                +1 (510) 830-8771
              </a>
              <br />
              <a
                href="mailto:info@soulbodyhealingcenter.com"
                className="border-b border-[rgba(232,206,140,0.35)] text-halo no-underline"
              >
                info@soulbodyhealingcenter.com
              </a>
              <br />
              <Link to="/schedule" className="border-b border-[rgba(232,206,140,0.35)] text-halo no-underline">
                Schedule an appointment online
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Home;
