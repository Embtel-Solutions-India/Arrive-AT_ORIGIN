import { useEffect } from "react";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import Reveal from "../components/landing/Reveal";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.02] tracking-[-0.015em]";
const BOOKING_URL = "https://soulbodyhealingcenter.com";

const packages = [
  {
    name: "Silver",
    price: "$250",
    sessions: "1 Session",
    text: "Start your wellness journey – book a single session today.",
  },
  {
    name: "Gold",
    price: "$1250",
    sessions: "5 Sessions",
    text: "Boost your well-being with a package of five sessions.",
    featured: true,
  },
  {
    name: "Platinum",
    price: "$2500",
    sessions: "10 Sessions",
    text: "Dive into a transformative experience with ten sessions.",
  },
];

function Schedule() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] font-normal selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />

      <main id="top" className="py-[clamp(56px,8vw,110px)]">
        <div className={shell}>
          <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[60ch]">
            <h1 className={`${heading} mb-[0.34em] text-[clamp(2.4rem,6vw,4.6rem)]`}>
              Schedule an <span className="text-halo">Appointment</span>
            </h1>
            <p className="mb-5 border-l-4 border-gold pl-4 text-[1.1rem] text-[#C6CBD8]">
              “True healing begins when we embrace the power of our mind, body, and spirit in unison.”
            </p>
            <p className="text-[#C6CBD8]">
              Embark on your journey towards inner harmony and emotional wellness. Book an appointment now for a wide
              range of therapies including marriage counseling, grief counseling, stress management, relationship
              management, spiritual counseling, and holistic healing.
            </p>
          </Reveal>

          <Reveal className="grid grid-cols-1 gap-[clamp(20px,3vw,32px)] md:grid-cols-3">
            {packages.map((pkg) => (
              <article
                key={pkg.name}
                className={`flex flex-col rounded-2xl border p-[clamp(26px,3vw,40px)] ${
                  pkg.featured
                    ? "border-halo bg-[rgba(232,206,140,0.1)]"
                    : "border-[rgba(237,231,218,0.16)] bg-[rgba(237,231,218,0.04)]"
                }`}
              >
                <h2 className="mb-4 text-[1.2rem] font-semibold text-vellum">{pkg.name}</h2>
                <p className="mb-5 border-b border-[rgba(237,231,218,0.2)] pb-6">
                  <span className={`${heading} text-[clamp(2.4rem,4vw,3.4rem)] font-normal text-vellum`}>
                    {pkg.price}
                  </span>{" "}
                  <span className="text-[0.95rem] text-dim">({pkg.sessions})</span>
                </p>
                <p className="mb-8 flex-1 text-[#A9B0C2]">{pkg.text}</p>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-halo bg-halo px-[26px] text-[0.95rem] font-bold text-void no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white"
                >
                  Book Now
                </a>
              </article>
            ))}
          </Reveal>

          <p className="mt-10 text-[0.95rem] text-dim">
            Sessions are held in Fremont, CA and online. Questions? Call{" "}
            <a href="tel:+15108308771" className="text-halo">
              +1 (510) 830-8771
            </a>{" "}
            or email{" "}
            <a href="mailto:info@soulbodyhealingcenter.com" className="text-halo">
              info@soulbodyhealingcenter.com
            </a>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Schedule;
