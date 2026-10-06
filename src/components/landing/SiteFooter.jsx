import { Link } from "react-router-dom";
import SocialIcon from "../SocialIcon";

function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(237,231,218,0.12)] py-[52px] pb-[68px] text-[0.86rem] text-dim">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-9 px-[clamp(20px,5vw,64px)] md:grid-cols-[1fr_1.2fr]">
        <div>
          <b className="text-vellum">Soul Body Healing Center</b>
          <br />
          Fremont, California. In person and online.
          <br />
          Founded and led by Dr. Alka Chopra Madan, D.Msc.
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {[
              ["facebook", "Facebook", "https://www.facebook.com/soulbodyhealingcenter"],
              ["instagram", "Instagram", "https://www.instagram.com/soulbodyhealing.path/"],
              ["google", "Google reviews", "https://g.page/r/CVDKnf9pk9KdEBM/review"],
              ["yelp", "Yelp", "https://www.yelp.com/biz/soul-body-healing-center-fremont-2"],
            ].map(([icon, label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-vellum underline-offset-4 hover:underline">
                <SocialIcon name={icon} />
                {label}
              </a>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-dim">
            <Link to="/books" className="hover:text-vellum">Book Store</Link>
            <span>·</span>
            <Link to="/blog" className="hover:text-vellum">Blog</Link>
            <span>·</span>
            <Link to="/schedule" className="hover:text-vellum">Consultations</Link>
            <span>·</span>
            <Link to="/account" className="hover:text-vellum">My Account</Link>
            <span>·</span>
            <Link to="/admin" className="text-halo/80 hover:text-halo">Admin Portal</Link>
          </div>
        </div>
        <div>
          <b className="text-vellum">Please note.</b> Dr. Alka Chopra Madan holds a Doctorate in Metaphysics. The
          services described here are spiritual, educational and wellness oriented. They are not medical treatment,
          mental-health diagnosis, psychotherapy or psychiatric care, and they are not a substitute for care from a
          licensed medical or mental-health professional.
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
