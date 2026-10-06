import { useEffect, useRef, useState } from "react";

const humanRows = [
  { label: "Grief", text: "Something was taken from me. I need to get back to who I was before it happened." },
  { label: "Conflict", text: "They are the problem. If they changed their behaviour, I would be at peace." },
  { label: "Ambition", text: "I will be enough once the next thing arrives. Until then, I am behind." },
  { label: "Silence", text: "Empty and uncomfortable. Fill it with noise, motion, a plan, anything." },
];

const metaRows = [
  { label: "Grief", text: "Love is still moving in me. I am not returning to a former self; I am meeting a larger one." },
  { label: "Conflict", text: "I can see my part without collapsing into blame. My response is mine to author." },
  { label: "Ambition", text: "I am already whole. What I build now is expression, not evidence that I exist." },
  { label: "Silence", text: "The only place I can hear what is actually mine. Nothing needs to be added here." },
];

function ThresholdCompare() {
  const [split, setSplit] = useState(52);
  const boxRef = useRef(null);
  const openedRef = useRef(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !openedRef.current) {
            openedRef.current = true;
            const start = performance.now();
            const from = 96;
            const to = 52;
            const dur = 1400;
            function step(now) {
              const t = Math.min((now - start) / dur, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              setSplit(from + (to - from) * eased);
              if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.45 }
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div
        ref={boxRef}
        className="relative min-h-[520px] overflow-hidden rounded-[20px] shadow-[0_40px_90px_rgba(0,0,0,0.45)] max-[760px]:min-h-[660px]"
      >
        <div className="absolute inset-0 flex flex-col bg-vellum p-[clamp(26px,4vw,52px)] text-[#2A2618]">
          <h3 className="mb-[0.15em] font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-light leading-[1.02] tracking-[-0.015em] text-[#2A2618]">
            The acquired self
          </h3>
          <p className="mb-[26px] min-h-[2.6em] max-w-[34ch] text-[0.86rem] tracking-[0.02em] text-dim-warm">
            Life read through what has accumulated.
          </p>
          <dl className="grid min-h-0 flex-1 grid-rows-4">
            {humanRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[118px_1fr] items-start gap-5 border-t border-[rgba(42,38,24,0.16)] py-4 max-[760px]:grid-cols-1 max-[760px]:gap-1"
              >
                <dt className="font-display text-[1.02rem] font-normal text-dim-warm">{row.label}</dt>
                <dd className="m-0 text-[0.95rem] leading-[1.5] text-[#4A4638]">{row.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="absolute inset-0 flex flex-col p-[clamp(26px,4vw,52px)] text-vellum"
          style={{
            clipPath: `inset(0 0 0 ${split}%)`,
            background: "radial-gradient(120% 100% at 85% 10%, #16224A 0%, #070B18 62%)",
          }}
        >
          <h3 className="mb-[0.15em] font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-light leading-[1.02] tracking-[-0.015em] text-vellum">
            The meta-human
          </h3>
          <p className="mb-[26px] min-h-[2.6em] max-w-[34ch] text-[0.86rem] tracking-[0.02em] text-halo">
            The same life, read from Origin.
          </p>
          <dl className="grid min-h-0 flex-1 grid-rows-4">
            {metaRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[118px_1fr] items-start gap-5 border-t border-[rgba(237,231,218,0.14)] py-4 max-[760px]:grid-cols-1 max-[760px]:gap-1"
              >
                <dt className="font-display text-[1.02rem] font-normal text-halo">{row.label}</dt>
                <dd className="m-0 text-[0.95rem] leading-[1.5] text-[#C6CBD8]">{row.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <input
          type="range"
          min={4}
          max={96}
          step={1}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Move the threshold between the acquired self and the meta-human"
          className="absolute inset-0 z-[6] m-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:h-[520px] [&::-moz-range-thumb]:w-16 [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:h-[520px] [&::-webkit-slider-thumb]:w-16 [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:appearance-none"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-[5] w-px bg-linear-to-b from-transparent via-halo to-transparent"
          style={{ left: `${split}%` }}
        >
          <span className="absolute top-1/2 left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-halo shadow-[0_0_0_10px_rgba(232,206,140,0.16),0_10px_30px_rgba(0,0,0,0.4)]" />
          <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-[3px]">
            <span className="h-[10px] w-[2px] bg-void" />
            <span className="h-[10px] w-[2px] bg-void" />
            <span className="h-[10px] w-[2px] bg-void" />
          </span>
        </div>
      </div>

      <p className="mt-[18px] flex items-center gap-[10px] text-[0.86rem] text-dim">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true" className="flex-none">
          <path d="M5 1 1 6l4 5M13 1l4 5-4 5" stroke="#C9992E" strokeWidth="1.3" />
        </svg>
        Drag the threshold, or use the arrow keys.
      </p>

      <p className="mt-7 max-w-[70ch] text-[0.84rem] text-dim">
        Meta-human is used here as Dr. Alka Chopra Madan&rsquo;s metaphysical and philosophical concept. It is not
        offered as a biological, medical or scientific classification.
      </p>
    </div>
  );
}

export default ThresholdCompare;
