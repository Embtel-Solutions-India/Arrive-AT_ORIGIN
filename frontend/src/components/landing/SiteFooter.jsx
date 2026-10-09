import { Link } from "react-router-dom";
import SocialIcon from "../SocialIcon";

function SiteFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[rgba(237,231,218,0.12)] bg-[#050812] py-12 sm:py-16 text-[0.86rem] text-dim transition-colors">
      <div className="mx-auto w-full max-w-[1360px] px-[clamp(20px,4vw,64px)]">
        {/* Main 5-Column Responsive Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 border-b border-[rgba(237,231,218,0.08)]">
          {/* Column 1: Brand & Founder Identity */}
          <div className="space-y-4 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 34 34" aria-hidden="true" className="flex-none">
                <circle cx="17" cy="17" r="16" fill="none" stroke="#C9992E" strokeWidth="1" />
                <circle cx="17" cy="17" r="10" fill="none" stroke="#E8CE8C" strokeWidth="1" opacity=".75" />
                <circle cx="17" cy="17" r="3" fill="#E8CE8C" />
              </svg>
              <b className="text-vellum font-display text-[1.05rem] tracking-tight block">
                Soul Body Healing Center
              </b>
            </div>

            <p className="text-xs sm:text-[0.84rem] text-dim/90 leading-relaxed">
              Founded and led by <strong>Dr. Alka Chopra Madan, D.Msc.</strong> Fremont, California. In person sanctuary sessions and global online spiritual care.
            </p>

            <div className="pt-1">
              <span className="block text-[0.7rem] uppercase tracking-wider text-halo font-semibold mb-2.5">
                Connect With Us
              </span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  ["facebook", "Facebook", "https://www.facebook.com/soulbodyhealingcenter"],
                  ["instagram", "Instagram", "https://www.instagram.com/soulbodyhealing.path/"],
                  ["google", "Google reviews", "https://g.page/r/CVDKnf9pk9KdEBM/review"],
                  ["yelp", "Yelp", "https://www.yelp.com/biz/soul-body-healing-center-fremont-2"],
                ].map(([icon, label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-vellum hover:border-halo hover:text-halo transition-colors no-underline"
                    aria-label={label}
                  >
                    <SocialIcon name={icon} />
                    <span className="hidden xs:inline">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Teachings & Spiritual Philosophy */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-vellum tracking-wide uppercase text-[0.78rem] text-halo">
              Teachings & Path
            </h3>
            <ul className="space-y-2 text-xs sm:text-[0.84rem]">
              <li>
                <a href="/#threshold" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  The Meta-Human
                </a>
              </li>
              <li>
                <a href="/#metaphysics" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Metaphysics
                </a>
              </li>
              <li>
                <a href="/#frameworks" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Healing Frameworks
                </a>
              </li>
              <li>
                <a href="/#practice" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Daily Practice
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  About Dr. Alka
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Sacred Offerings & Book Store */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-vellum tracking-wide uppercase text-[0.78rem] text-halo">
              Offerings & Store
            </h3>
            <ul className="space-y-2 text-xs sm:text-[0.84rem]">
              <li>
                <Link to="/books" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Book Store & Publications
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  1-on-1 Consultations
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Package Appointments
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Holistic Journal & Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: User Services & Account */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-vellum tracking-wide uppercase text-[0.78rem] text-halo">
              User Account
            </h3>
            <ul className="space-y-2 text-xs sm:text-[0.84rem]">
              <li>
                <Link to="/account" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  My User Account
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Appointments & Orders
                </Link>
              </li>
              <li>
                <Link to="/reset-password" className="hover:text-vellum transition-colors no-underline block py-0.5">
                  Password Recovery
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-halo/90 hover:text-white font-medium transition-colors no-underline block py-0.5">
                  Administrative Access →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Sanctuary Location & Details */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-vellum tracking-wide uppercase text-[0.78rem] text-halo">
              Sanctuary
            </h3>
            <p className="text-xs sm:text-[0.82rem] leading-relaxed text-dim">
              Soul Body Healing Center<br />
              Fremont, California, USA<br />
              <span className="text-vellum/90 font-medium">In Person & Online Video</span>
            </p>
            <div className="pt-1">
              <span className="text-[0.7rem] uppercase tracking-wider text-dim block">General Contact</span>
              <a href="mailto:info@arriveatorigin.com" className="text-xs text-halo hover:underline">
                info@arriveatorigin.com
              </a>
            </div>
            <div className="text-[0.72rem] text-dim/80">
              Payments Accepted: USD ($) & INR (₹)
            </div>
          </div>
        </div>

        {/* Lower Section: Legal Metaphysics Notice & Bottom Bar */}
        <div className="pt-8 space-y-6">
          <div className="rounded-2xl border border-[rgba(237,231,218,0.1)] bg-white/[0.02] p-4 sm:p-5 text-xs text-dim/90 leading-relaxed">
            <b className="text-vellum block mb-1">Please note.</b> Dr. Alka Chopra Madan holds a Doctorate in Metaphysics. The
            services described here are spiritual, educational and wellness oriented. They are not medical treatment,
            mental-health diagnosis, psychotherapy or psychiatric care, and they are not a substitute for care from a
            licensed medical or mental-health professional.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dim text-center sm:text-left">
            <p className="m-0">
              © {new Date().getFullYear()} Soul Body Healing Center • Arrive at Origin. All rights reserved.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-halo hover:text-white transition-colors cursor-pointer text-xs"
              aria-label="Back to top of page"
            >
              <span>Back to Top</span>
              <span>↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
