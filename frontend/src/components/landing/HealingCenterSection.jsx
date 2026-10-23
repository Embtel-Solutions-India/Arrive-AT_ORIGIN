import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.04] tracking-[-0.015em]";

const centerStats = [
  {
    num: "38+",
    unit: "Years",
    label: "Holistic Practice",
    desc: "Over three decades of clinical, metaphysical, and spiritual guidance in California.",
  },
  {
    num: "5,000+",
    unit: "Seekers",
    label: "Lives Guided",
    desc: "Individuals, couples, physicians, and executives guided toward inner peace.",
  },
  {
    num: "5.0",
    unit: "Stars",
    label: "Google Verified",
    desc: "Top-tier client reviews highlighting tangible relief, empathy, and clarity.",
  },
  {
    num: "1-on-1",
    unit: "Counsel",
    label: "In-Person & Online",
    desc: "Unhurried private sanctuary in Fremont, CA plus encrypted worldwide tele-sessions.",
  },
];

const modalities = [
  {
    id: "metaphysical-clearing",
    label: "Metaphysical Counsel",
    title: "Metaphysical Inquiry & Concept Clearing",
    tagline: "Subtracting borrowed definitions, karmic conditioning, and subconscious fatigue.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    description:
      "Most mental exhaustion is not caused by your current day, but by the subconscious definitions you inherited: what you owe others, what failure means, how grief must look, and who you are supposed to be. In Dr. Alka's original Concept Clearing process, each operative definition is held up to the light in unhurried dialogue, dissolving the false weight so you can think and live from authentic presence.",
    keyTakeaways: [
      "Subconscious loop identification & gentle deconditioning",
      "Dissolving ancestral guilt and acquired emotional obligations",
      "Plain-language examination of operative subconscious beliefs",
      "Restoring the uninjured meta-human observer beneath daily roles",
    ],
    clientTakeaway: "“Relief rather than effort — seeing what was never mine to carry in the first place.”",
  },
  {
    id: "somatic-healing",
    label: "Soul & Body Somatic",
    title: "Soul & Body Somatic Harmonization",
    tagline: "Calming chronic fight-or-flight, nervous system burnout, and physical tension.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    description:
      "The physical body is the mirror of unexamined mental pressure. When feelings and conflicts are pushed underground, the nervous system remains locked in chronic fight-or-flight, presenting as tension headaches, chest constriction, insomnia, and psychosomatic fatigue. The center's somatic approach uses subtle energetic alignment, breath recalibration, and visceral stillness to allow the body to release the stress it has faithfully held.",
    keyTakeaways: [
      "Vagus nerve down-regulation and deep visceral stillness",
      "Release of somatic stress locked in chest, throat, and shoulders",
      "Cellular rejuvenation and recovery from chronic emotional burnout",
      "Bridging intellectual understanding with felt physical ease",
    ],
    clientTakeaway: "“For the first time in years, my shoulders dropped and my breathing became effortless.”",
  },
  {
    id: "relationship-harmony",
    label: "Relationship & Marriage",
    title: "Relational & Family Harmony",
    tagline: "Dissolving defensiveness and responding from Origin rather than the argument's heat.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    description:
      "Most relational conflict is not about the topic on the table — it is an automated collision of two nervous systems acting out unhealed childhood conditioning and fear. In counsel at the center, couples and family members learn to identify the invisible trigger patterns beneath the dispute. When you learn to communicate from Origin rather than reaction, genuine understanding replaces the compulsion to win.",
    keyTakeaways: [
      "Deconstructing cyclical arguments and defensive posturing",
      "Seeing the subconscious wound underneath a partner's anger or withdrawal",
      "Harmonizing the shared interpersonal energetic space",
      "Private individual preparation sessions paired with joint alignment",
    ],
    clientTakeaway: "“We stopped fighting each other's defense mechanisms and finally heard one another.”",
  },
  {
    id: "grief-transitions",
    label: "Transitions & Grief",
    title: "Life Transition, Bereavement & Spiritual Crisis",
    tagline: "Unhurried companionship when life takes a turn without consulting you first.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    description:
      "Loss, sudden divorce, career disillusionment, and spiritual awakenings can leave you feeling untethered from your previous identity. The Soul Body Healing Center offers a steady, unhurried space where grief is not rushed or pathologized with arbitrary 'stages.' We guide you through the passage from what was lost to the indestructible awareness that continues forward.",
    keyTakeaways: [
      "Companionship free of platitudes, toxic positivity, or dogma",
      "Making sense of identity shifts when roles, marriages, or jobs end",
      "Rebuilding trust with life itself following deep loss or trauma",
      "Navigating existential awakenings with practical, grounded support",
    ],
    clientTakeaway: "“I was allowed to grieve without being told to fix it, and in that permission, peace returned.”",
  },
];

const sanctuarySteps = [
  {
    step: "01",
    title: "Tranquil Reception",
    text: "Step away from the sensory overload of daily demands into our calm, private Fremont suite.",
  },
  {
    step: "02",
    title: "Honest Inquiry",
    text: "Plain conversation with Dr. Alka to identify the subconscious script running beneath the surface.",
  },
  {
    step: "03",
    title: "Concept Clearing",
    text: "Unbundling borrowed definitions and releasing the emotional weight stored in the mind and body.",
  },
  {
    step: "04",
    title: "Origin Baseline",
    text: "Walk away with practical, daily grounding to meet work, family, and choices with unshakeable calm.",
  },
];

function HealingCenterSection() {
  const [activeTab, setActiveTab] = useState(0);

  const activeModality = modalities[activeTab];

  return (
    <section
      id="healing-center"
      className="relative overflow-hidden py-[clamp(72px,10vw,132px)] text-vellum"
      style={{
        background:
          "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(201, 153, 46, 0.12), transparent 70%), linear-gradient(180deg, #070B18 0%, #0E1630 50%, #070B18 100%)",
      }}
    >
      {/* Decorative cosmic subtle grid & blur orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gold/10 blur-[140px] opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-10 w-[500px] h-[500px] rounded-full bg-slate/40 blur-[120px] opacity-60"
      />

      <div className={`${shell} relative z-10`}>
        {/* ========================================================================= */}
        {/* 1. Header & Introduction                                                 */}
        {/* ========================================================================= */}
        <Reveal className="mb-[clamp(40px,6vw,72px)] text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-halo/30 bg-halo/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-halo uppercase mb-4 shadow-sm backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>Fremont Sanctuary & Global Tele-Counsel</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-end">
            <div>
              <h2 className={`${heading} text-[clamp(2.4rem,5.2vw,4.2rem)] text-vellum tracking-tight`}>
                Soul Body Healing Center
              </h2>
              <p className="mt-4 text-[clamp(1.05rem,1.4vw,1.24rem)] font-light leading-relaxed text-[#C6CBD8] max-w-[62ch]">
                A sanctuary of quietude, truth, and somatic restoration in Fremont, California. For over 38 years,
                providing unhurried counsel to help individuals disentangle from mental congestion and return home to
                their true origin.
              </p>
            </div>

            <div className="rounded-2xl border border-[rgba(232,206,140,0.18)] bg-[#090F22]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl md:justify-self-end w-full max-w-md">
              <div className="flex items-center gap-3 pb-3 border-b border-[rgba(237,231,218,0.08)]">
                <svg width="26" height="26" viewBox="0 0 34 34" aria-hidden="true" className="flex-none">
                  <circle cx="17" cy="17" r="16" fill="none" stroke="#C9992E" strokeWidth="1" />
                  <circle cx="17" cy="17" r="10" fill="none" stroke="#E8CE8C" strokeWidth="1" opacity=".7" />
                  <circle cx="17" cy="17" r="3" fill="#E8CE8C" />
                </svg>
                <div>
                  <span className="font-display text-sm font-semibold text-vellum block">
                    Founded by Dr. Alka Chopra Madan, D.Msc.
                  </span>
                  <span className="text-[0.72rem] tracking-wider uppercase text-gold">Doctorate in Metaphysics</span>
                </div>
              </div>
              <p className="mt-3 text-xs sm:text-[0.84rem] text-dim leading-relaxed mb-0">
                “Healing is not acquisition; it is subtraction. We do not burden you with more techniques. We clear the
                borrowed concepts until the calm that was already yours becomes legible again.”
              </p>
            </div>
          </div>
        </Reveal>

        {/* ========================================================================= */}
        {/* 2. Key Center Metrics & Highlights                                       */}
        {/* ========================================================================= */}
        <Reveal className="mb-14 sm:mb-20">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {centerStats.map((st) => (
              <div
                key={st.label}
                className="group relative rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[#0A1024]/70 p-4 xs:p-5 sm:p-6 backdrop-blur-md transition-all duration-300 hover:border-halo/50 hover:bg-[#0E1630]/90 hover:-translate-y-1 shadow-lg"
              >
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-light text-halo tracking-tight">
                    {st.num}
                  </span>
                  <span className="font-mono text-[0.75rem] uppercase tracking-wider text-dim">{st.unit}</span>
                </div>
                <h3 className="font-display text-[0.92rem] xs:text-[0.95rem] sm:text-[1.05rem] font-medium text-vellum mt-1">
                  {st.label}
                </h3>
                <p className="mt-1.5 xs:mt-2 text-[0.78rem] xs:text-[0.8rem] sm:text-[0.84rem] text-[#8A93A8] leading-relaxed mb-0">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ========================================================================= */}
        {/* 3. Four Core Healing Disciplines (Interactive Explorer)                  */}
        {/* ========================================================================= */}
        <Reveal className="mb-14 sm:mb-20">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-gold block mb-2">
                Sanctuary Disciplines
              </span>
              <h3 className={`${heading} text-2xl sm:text-3xl lg:text-4xl text-vellum`}>
                The Four Pillars of Center Work
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-dim max-w-md">
              Each discipline addresses a different manifestation of human congestion, entered through the door of your
              current circumstance.
            </p>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[#090F22]/90 border border-[rgba(237,231,218,0.1)] mb-6">
            {modalities.map((m, idx) => {
              const isSelected = activeTab === idx;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-halo text-void font-bold shadow-[0_2px_14px_rgba(232,206,140,0.3)]"
                      : "text-dim hover:text-vellum hover:bg-white/5"
                  }`}
                  aria-selected={isSelected}
                  role="tab"
                >
                  <span className={isSelected ? "text-void" : "text-halo"}>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="rounded-2xl sm:rounded-3xl border border-[rgba(232,206,140,0.22)] bg-gradient-to-br from-[#0E1630]/95 via-[#0A1024]/90 to-[#070B18]/95 p-4 xs:p-6 sm:p-10 backdrop-blur-xl shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-start">
              <div className="space-y-5">
                <div>
                  <span className="inline-block text-[0.74rem] uppercase tracking-widest text-halo font-mono mb-2">
                    {activeModality.label} Focus
                  </span>
                  <h4 className={`${heading} text-2xl sm:text-3xl text-vellum font-normal`}>
                    {activeModality.title}
                  </h4>
                  <p className="mt-2 text-sm sm:text-base text-gold font-light italic">
                    {activeModality.tagline}
                  </p>
                </div>

                <p className="text-sm sm:text-[0.96rem] text-[#C6CBD8] leading-relaxed">
                  {activeModality.description}
                </p>

                <div className="pt-2">
                  <h5 className="font-display text-xs uppercase tracking-wider text-vellum mb-3 font-semibold">
                    What a session addresses & resolves:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 list-none p-0">
                    {activeModality.keyTakeaways.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs sm:text-[0.88rem] text-[#A9B0C2] leading-snug"
                      >
                        <span className="text-halo text-sm flex-shrink-0 mt-0.5">✦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Aside: Sanctuary Takeaway & Direct Action */}
              <div className="rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[#070B18]/80 p-6 sm:p-7 space-y-6 flex flex-col justify-between">
                <div>
                  <span className="text-[0.72rem] tracking-wider uppercase text-dim font-mono block mb-2">
                    Client Reflection
                  </span>
                  <blockquote className="font-display text-[1rem] sm:text-[1.08rem] font-light text-vellum italic leading-snug m-0 border-l-2 border-halo pl-4">
                    {activeModality.clientTakeaway}
                  </blockquote>
                </div>

                <div className="space-y-3 pt-4 border-t border-[rgba(237,231,218,0.08)]">
                  <div className="text-xs text-dim flex items-center justify-between">
                    <span>Meeting Options:</span>
                    <span className="text-vellum font-semibold">In Fremont & Virtual Zoom</span>
                  </div>
                  <div className="text-xs text-dim flex items-center justify-between">
                    <span>Session Length:</span>
                    <span className="text-vellum font-semibold">60 – 90 Minutes</span>
                  </div>

                  <div className="pt-3">
                    <Link
                      to="/schedule"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-halo py-3 px-5 text-xs font-bold uppercase tracking-wider text-void hover:bg-white transition-all shadow-[0_4px_18px_rgba(232,206,140,0.22)] no-underline cursor-pointer"
                    >
                      <span>Book Consultation Meeting</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ========================================================================= */}
        {/* 4. The Sanctuary Flow: What to Expect                                    */}
        {/* ========================================================================= */}
        <Reveal className="mb-14 sm:mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-gold block mb-2">
              The Experience
            </span>
            <h3 className={`${heading} text-2xl sm:text-3xl lg:text-4xl text-vellum`}>
              How a Sanctuary Session Unfolds
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-dim">
              From the moment you step through our doors or connect on video, there is nothing you need to rehearse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {sanctuarySteps.map((st) => (
              <div
                key={st.step}
                className="relative rounded-2xl border border-[rgba(237,231,218,0.1)] bg-[#0A1024]/60 p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-2xl font-light text-halo/50 block mb-3">
                    {st.step}
                  </span>
                  <h4 className="font-display text-lg text-vellum font-normal mb-2">
                    {st.title}
                  </h4>
                  <p className="text-xs sm:text-[0.86rem] text-dim leading-relaxed mb-0">
                    {st.text}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[rgba(237,231,218,0.06)] flex items-center gap-1.5 text-[0.72rem] text-gold uppercase tracking-wider font-mono">
                  <span>Conscious step</span>
                  <span>•</span>
                  <span>Unhurried</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ========================================================================= */}
        {/* 5. Center Information, Location & Visiting Details                       */}
        {/* ========================================================================= */}
        <Reveal>
          <div className="rounded-3xl border border-halo/30 bg-gradient-to-r from-[#0E1630] via-[#141C3A] to-[#0E1630] p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 sm:gap-12 items-center">
              {/* Left Column: Location & Contact Specifications */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[0.76rem] tracking-widest text-gold uppercase mb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    <span>Physical Sanctuary & Worldwide Reach</span>
                  </div>
                  <h3 className={`${heading} text-2xl sm:text-3xl text-vellum`}>
                    Visiting Soul Body Healing Center
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#A9B0C2] leading-relaxed">
                    Centrally situated in Fremont, California with dedicated private suites, ample parking, and
                    complete discretion. Appointments are arranged prior to arrival to maintain a serene, undisturbed
                    environment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {/* Address */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-halo font-semibold text-xs uppercase tracking-wider">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Sanctuary Address</span>
                    </div>
                    <p className="text-vellum font-medium mb-0">
                      39159 Paseo Padre Parkway, Suite 115<br />
                      Fremont, CA 94538
                    </p>
                  </div>

                  {/* Hours */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-halo font-semibold text-xs uppercase tracking-wider">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Hours of Practice</span>
                    </div>
                    <p className="text-vellum font-medium mb-0">
                      Monday – Saturday<br />
                      <span className="text-dim">By Prior Appointment Only</span>
                    </p>
                  </div>

                  {/* Direct Phone */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-halo font-semibold text-xs uppercase tracking-wider">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Telephone</span>
                    </div>
                    <a
                      href="tel:+15108308771"
                      className="text-vellum font-medium hover:text-halo transition-colors no-underline block"
                    >
                      +1 (510) 830-8771
                    </a>
                  </div>

                  {/* Email */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-halo font-semibold text-xs uppercase tracking-wider">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Direct Email</span>
                    </div>
                    <a
                      href="mailto:info@soulbodyhealingcenter.com"
                      className="text-vellum font-medium hover:text-halo transition-colors no-underline block truncate"
                    >
                      info@soulbodyhealingcenter.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Personal Sanctuary Invitation & Quick CTAs */}
              <div className="rounded-2xl border border-halo/40 bg-[#070B18]/90 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-[0.72rem] tracking-wider uppercase text-gold font-mono block mb-2">
                    An Invitation
                  </span>
                  <h4 className={`${heading} text-xl sm:text-2xl text-vellum`}>
                    Begin with an unhurried conversation.
                  </h4>
                  <p className="mt-3 text-xs sm:text-sm text-[#C6CBD8] leading-relaxed">
                    Whether you carry unresolved grief, relational tension, heavy career demands, or simply an inner
                    pull toward self-realization, you are invited to experience Soul Body Healing Center.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Link
                    to="/schedule"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-halo py-3.5 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-void hover:bg-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)] no-underline"
                  >
                    <span>Schedule Sanctuary Consultation</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 pt-1">
                    <a
                      href="https://www.google.com/maps/place//@46.423669,-129.9427085,3z/data=!3m1!4b1!4m3!3m2!1s0x6613bd4da2da38c7:0x44d81f84a5ec0c06!12e1?entry=ttu&g_ep=EgoyMDI2MTAxMi4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-2.5 px-4 text-xs font-semibold text-vellum hover:border-halo hover:bg-white/10 transition-colors no-underline text-center"
                    >
                      <span>Google Maps</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                    <a
                      href="tel:+15108308771"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-2.5 px-4 text-xs font-semibold text-vellum hover:border-halo hover:bg-white/10 transition-colors no-underline text-center"
                    >
                      <span>Call (510) 830-8771</span>
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-[rgba(237,231,218,0.06)] text-[0.7rem] text-dim leading-normal">
                  <strong className="text-[#C6CBD8]">Sanctuary Notice:</strong> Services are spiritual, metaphysical,
                  and educational in nature. We do not provide medical diagnosis or psychotherapeutic care.
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default HealingCenterSection;
