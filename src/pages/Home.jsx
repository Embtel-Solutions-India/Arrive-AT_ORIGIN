import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import HeroCanvas from "../components/landing/HeroCanvas";
import ThresholdCompare from "../components/landing/ThresholdCompare";
import FrameworkTabs from "../components/landing/FrameworkTabs";
import Reveal from "../components/landing/Reveal";

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
    text: "AAO and Induced Calmness for leaders and teams: attention, clarity, resilience and the human side of work.",
    cta: "Enquire",
  },
];

const books = [
  {
    tagline: "AAO series · Part One",
    title: "Arrive at Origin",
    text: "The central work. Origin as the position that remains when you stop moving away from yourself, and the method for returning to it.",
    meta: "link to Amazon / KDP listing",
    series: true,
  },
  {
    tagline: "AAO series · Part Two",
    title: "Arrive at Origin II",
    text: "The elaboration: Concept Clearing as gateway, the four movements in depth, and living from Origin inside ordinary obligation.",
    meta: "confirm publication date and listing link",
    series: true,
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Transformation",
    text: "Change, unpredictability, and the way we meet a life that does not consult us first.",
    meta: "listing link",
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Spirituality",
    text: "A return to what spirituality is underneath the labels it has collected.",
    meta: "listing link",
  },
  {
    tagline: "Earlier work",
    title: "Your Path to Healing",
    text: "What healing means across living, loss and recovery — held as inquiry rather than instruction.",
    meta: "listing link",
  },
  {
    tagline: "Earlier work",
    title: "Keeping It Simple",
    text: "Soul, body and mind do not require life to be made more complicated than it already is.",
    meta: "listing link",
  },
  {
    tagline: "Earlier work",
    title: "Life Force: Lost and Found",
    text: "Energy, wholeness, and reconnecting with the vitality of being alive.",
    meta: "listing link",
  },
];

const voices = [
  {
    quote: "The process seemed original, simple, effective.",
    cite: "Soul Body Healing Center client · [ verify source and consent ]",
  },
  {
    quote: "Helped me to clearly and smoothly channelize my thought process.",
    cite: "Soul Body Healing Center client · [ verify source and consent ]",
  },
  {
    quote: "Very helpful and extremely knowledgeable.",
    cite: "Soul Body Healing Center client · [ verify source and consent ]",
  },
];

const placeholder = "text-[0.82em] font-medium tracking-[0.01em] text-[#E8963C] before:content-['[_'] after:content-['_]']";

function Home() {
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
              <a
                href="#begin"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[rgba(237,231,218,0.32)] bg-transparent px-[26px] text-[0.95rem] font-bold text-vellum no-underline transition-all duration-200 hover:border-halo hover:bg-[rgba(237,231,218,0.08)]"
              >
                Book a conversation
              </a>
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
                  <b className="font-bold text-ink">Founder</b>, University of Spiritual Sciences
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
                AAO is the passage. Induced Calmness is the state you become able to hold once you have made it.
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
                <a
                  key={item.title}
                  href="#begin"
                  className="group grid grid-cols-1 items-baseline gap-2 border-b border-[rgba(237,231,218,0.14)] py-[30px] no-underline transition-all duration-300 hover:bg-linear-to-r hover:from-[rgba(232,206,140,0.1)] hover:to-transparent hover:pl-[18px] focus-visible:bg-linear-to-r focus-visible:from-[rgba(232,206,140,0.1)] focus-visible:to-transparent focus-visible:pl-[18px] sm:grid-cols-[minmax(220px,0.9fr)_1.4fr_auto] sm:gap-6"
                >
                  <h3 className={`${heading} text-[clamp(1.3rem,2vw,1.7rem)] font-normal text-vellum`}>{item.title}</h3>
                  <p className="m-0 text-[0.95rem] text-[#A9B0C2]">{item.text}</p>
                  <span className="text-[0.85rem] whitespace-nowrap text-halo opacity-100 transition-opacity duration-300 sm:opacity-[0.55] sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                    {item.cta}
                  </span>
                </a>
              ))}
            </Reveal>
          </div>
        </section>

        {/* BOOKS */}
        <section className="relative bg-vellum-2 py-[clamp(72px,10vw,132px)] text-ink" id="books">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)] text-ink`}>
                The written body of work.
              </h2>
              <p className="max-w-[56ch] text-[#4A4638]">
                The books are not companion products to the practice — they are where the frameworks are set down in
                full. The AAO series is the spine; the earlier titles are the inquiry that led to it.
              </p>
            </Reveal>

            <Reveal
              as="div"
              className="grid auto-cols-[minmax(268px,1fr)] grid-flow-col gap-[18px] overflow-x-auto pb-4 [scrollbar-width:thin] snap-x snap-mandatory"
            >
              {books.map((book) => (
                <article
                  key={book.title}
                  className={`flex min-h-[330px] snap-start flex-col justify-between rounded-2xl border p-7 ${
                    book.series
                      ? "border-transparent text-vellum"
                      : "border-[rgba(42,38,24,0.14)] bg-vellum-2 text-ink"
                  }`}
                  style={book.series ? { background: "linear-gradient(165deg, #0E1630, #2C2246)" } : undefined}
                >
                  <div>
                    <span className={`text-[0.76rem] tracking-[0.14em] ${book.series ? "text-halo" : "text-gold"}`}>
                      {book.tagline}
                    </span>
                    <h3 className="my-[18px] font-display text-[1.7rem] font-light">{book.title}</h3>
                    <p className={`m-0 text-[0.92rem] ${book.series ? "text-[#C6CBD8]" : ""}`}>{book.text}</p>
                  </div>
                  <div className="mt-5 border-t border-[rgba(128,128,128,0.25)] pt-[14px] text-[0.84rem]">
                    <span className={placeholder}>{book.meta}</span>
                  </div>
                </article>
              ))}
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
              <span>
                <b className={`block font-display text-[1.3rem] font-normal text-ink ${placeholder}`}>
                  7 titles shown; profile records five books — confirm the canonical list before launch
                </b>
              </span>
            </Reveal>
          </div>
        </section>

        {/* WIDER WORK */}
        <section className="relative py-[clamp(72px,10vw,132px)]">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)]`}>
                The work does not stop at the consulting room.
              </h2>
              <p className="max-w-[56ch] text-vellum">
                The same metaphysics runs through teaching and through service. Both were built so the framework
                would outlast any one practitioner, including me.
              </p>
            </Reveal>
            <Reveal className="grid grid-cols-1 gap-[clamp(20px,3vw,32px)] md:grid-cols-2">
              <article className="rounded-2xl border border-[rgba(237,231,218,0.16)] bg-[rgba(237,231,218,0.04)] p-[clamp(26px,3vw,40px)]">
                <h3 className={`${heading} mb-[0.4em] text-[clamp(1.5rem,2.6vw,2rem)] text-vellum`}>
                  University of Spiritual Sciences
                </h3>
                <p className="mb-[0.8em] text-[#A9B0C2]">
                  Where the frameworks are taught rather than delivered — for practitioners, students and anyone who
                  intends to carry this work into their own community.
                </p>
                <p className="mb-0 text-[#A9B0C2]">
                  <span className={placeholder}>curriculum, enrolment status and link</span>
                </p>
              </article>
              <article className="rounded-2xl border border-[rgba(237,231,218,0.16)] bg-[rgba(237,231,218,0.04)] p-[clamp(26px,3vw,40px)]">
                <h3 className={`${heading} mb-[0.4em] text-[clamp(1.5rem,2.6vw,2rem)] text-vellum`}>
                  Global Women Power &amp; Community Kitchen
                </h3>
                <p className="mb-[0.8em] text-[#A9B0C2]">
                  Metaphysics that stays theoretical has not finished its sentence. This is the service arm: women's
                  empowerment, and food given without conditions attached.
                </p>
                <p className="mb-0 text-[#A9B0C2]">
                  <span className={placeholder}>programme details, volunteer and donation links</span>
                </p>
              </article>
            </Reveal>
          </div>
        </section>

        {/* VOICES */}
        <section className="relative bg-vellum py-[clamp(72px,10vw,132px)] text-ink" id="voices">
          <div className={shell}>
            <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[34ch]">
              <h2 className={`${heading} mb-[0.34em] text-[clamp(2.2rem,4.6vw,3.9rem)] text-ink`}>
                What people say afterward.
              </h2>
              <p className="max-w-[56ch] text-[#4A4638]">
                Ratings and counts should be pulled live from each platform so this page never shows a stale number.
              </p>
            </Reveal>
            <Reveal className="grid grid-cols-1 gap-[clamp(20px,3vw,34px)] md:grid-cols-3">
              {voices.map((v) => (
                <div key={v.quote} className="border-t-2 border-gold pt-[22px]">
                  <blockquote className="mb-4 font-display text-[clamp(1.25rem,2vw,1.6rem)] leading-[1.28] text-ink">
                    {v.quote}
                  </blockquote>
                  <cite className="text-[0.84rem] text-dim-warm not-italic">{v.cite}</cite>
                </div>
              ))}
            </Reveal>
            <Reveal className="mt-11 flex flex-wrap gap-3">
              {["Google reviews", "Facebook recommendations", "Yelp", "Thumbtack"].map((plat) => (
                <a
                  key={plat}
                  href="#"
                  className="rounded-full border border-[rgba(42,38,24,0.2)] px-5 py-[11px] text-[0.9rem] text-ink no-underline transition-all duration-200 hover:border-ink hover:bg-ink hover:text-vellum"
                >
                  {plat} <span className={placeholder}>live link</span>
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
              <p className="rounded-[10px] bg-void/55 p-[14px_16px] text-[0.85rem] text-[#A9B0C2] backdrop-blur-[6px]">
                <span className={placeholder}>
                  Replace with a current, high-resolution portrait — warm, natural light, direct eye contact, not a
                  stock wellness image
                </span>
              </p>
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
                <a
                  href="#begin"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-halo bg-halo px-[26px] text-[0.95rem] font-bold text-void no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white"
                >
                  Book a conversation
                </a>
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
              <span className={placeholder}>online booking link</span>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Home;
