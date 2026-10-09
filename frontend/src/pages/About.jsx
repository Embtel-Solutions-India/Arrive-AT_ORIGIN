import { Link } from "react-router-dom";

function About() {
  return (
    <div className="py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
      {/* Intro Header */}
      <div className="border-b border-[rgba(237,231,218,0.12)] pb-8">
        <span className="text-xs font-semibold tracking-widest text-halo uppercase mb-2 block">
          About the Founder & Method
        </span>
        <h1 className="font-display font-light text-[clamp(2.4rem,5vw,4.2rem)] leading-tight text-vellum mb-4">
          Dr. Alka Chopra Madan, <span className="text-halo">D.Msc.</span>
        </h1>
        <p className="text-lg text-[#C6CBD8] font-light leading-relaxed max-w-2xl">
          Doctorate in Metaphysics, author of the AAO — Arrive at Origin series, and founder of the Soul Body Healing Center with over 38 years in holistic practice.
        </p>
      </div>

      {/* Grid: Philosophy & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4 text-sm text-[#A9B0C2] leading-relaxed">
          <h2 className="font-display text-2xl text-vellum font-normal">
            Metaphysics & Living from Origin
          </h2>
          <p>
            Metaphysics asks what a human being fundamentally <em>is</em> — beneath biology, biography, and acquired mental congestion. The work offered here is subtraction rather than acquisition: removing borrowed concepts until what is authentic and grounded becomes legible again.
          </p>
          <p>
            Through Concept Clearing, Living from Origin, and 1-on-1 counsel, clients worldwide cultivate emotional resilience, inner silence, and clarity inside ordinary modern obligations.
          </p>
        </div>

        {/* Credentials Card */}
        <div className="rounded-2xl border border-[rgba(232,206,140,0.2)] bg-[#0E1630]/80 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-4">
          <h3 className="font-display text-xl text-vellum font-medium pb-3 border-b border-white/10">
            Distinctions & Foundation
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-[#C6CBD8]">
            <li className="flex items-start gap-2.5">
              <span className="text-halo">✦</span>
              <span><strong>Doctorate in Metaphysics (D.Msc.)</strong> — Academic ground of this life work</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-halo">✦</span>
              <span><strong>38+ Years</strong> of holistic and alternative wellness practice</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-halo">✦</span>
              <span><strong>Author</strong> of the acclaimed <em>Arrive at Origin</em> book series</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-halo">✦</span>
              <span><strong>Sanctuary in Fremont, CA</strong> & Worldwide Video Consultations</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action CTA */}
      <div className="rounded-2xl border border-halo/30 bg-halo/5 p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-left max-w-lg">
          <h3 className="font-display text-xl text-vellum mb-1">Begin Your Counsel</h3>
          <p className="text-xs sm:text-sm text-dim">
            Private 1-on-1 sessions and transformation packages available online worldwide or in-person.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/schedule"
            className="rounded-full bg-halo px-6 py-2.5 text-xs font-bold text-void hover:bg-white transition-colors no-underline whitespace-nowrap"
          >
            Schedule Consultation
          </Link>
          <Link
            to="/books"
            className="rounded-full border border-[rgba(237,231,218,0.25)] px-5 py-2.5 text-xs text-vellum hover:border-halo transition-colors no-underline whitespace-nowrap"
          >
            Explore Books
          </Link>
        </div>
      </div>
    </div>
  );
}

export default About;
