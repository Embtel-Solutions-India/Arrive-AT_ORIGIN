import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="py-20 text-center max-w-xl mx-auto">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-halo text-3xl font-display">
        404
      </div>
      <span className="text-xs font-semibold tracking-widest text-halo uppercase mb-2 block">
        Lost in Space
      </span>
      <h1 className="font-display font-light text-[clamp(2rem,5vw,3.2rem)] leading-tight text-vellum mb-4">
        Page Not Found
      </h1>
      <p className="text-sm text-[#A9B0C2] mb-8 leading-relaxed">
        The destination you are seeking cannot be located in this coordinate. Return to Origin to continue your journey.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-halo px-6 py-3 text-xs font-bold text-void hover:bg-white transition-colors no-underline"
        >
          Return to Homepage
        </Link>
        <Link
          to="/schedule"
          className="rounded-full border border-[rgba(237,231,218,0.2)] px-6 py-3 text-xs font-semibold text-vellum hover:border-halo transition-colors no-underline"
        >
          Book Consultation
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
