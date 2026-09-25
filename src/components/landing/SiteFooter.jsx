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
