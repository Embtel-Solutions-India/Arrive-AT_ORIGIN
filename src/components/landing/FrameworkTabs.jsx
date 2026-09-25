import { useState } from "react";

const frameworks = [
  {
    numeral: "I",
    label: "Concept Clearing",
    role: "The gateway — first, and for everyone",
    title: "Concept Clearing",
    paragraphs: [
      "Before anything can be arrived at, the terms have to be cleared. Most suffering runs on inherited definitions: what love is, what success owes you, what a good daughter does, what silence means, what healing should feel like. These were installed young and have never been examined since.",
      "Concept Clearing takes the concepts you are actually living by and holds each one up to the light. Not to replace it with mine — to let you see whether it is yours at all. It is the entry point to AAO because the passage cannot be walked in borrowed language.",
    ],
    asideTitle: "What a clearing session examines",
    asideType: "ul",
    asideItems: [
      "The definition you are operating under, stated plainly",
      "Where it came from, and who it originally served",
      "What it costs you now, in behaviour and in body",
      "What is left standing when it is set down",
    ],
  },
  {
    numeral: "II",
    label: "AAO — Arrive at Origin",
    role: "The passage — the central body of work",
    title: "AAO — Arrive at Origin",
    paragraphs: [
      "Origin is not a destination and not an ascent. It is the position you occupy when you stop moving away from yourself. AAO is the method for getting there, developed across decades of one-to-one work and set down in the AAO book series.",
      "It centres on observed silence — not forcing the mind quiet, not performing spirituality, not collecting further techniques. Reduce the distraction long enough and the distinction between what belongs to you and what was merely acquired becomes obvious without effort.",
    ],
    asideTitle: "The four movements",
    asideType: "ol",
    asideItems: [
      ["Observe.", " Stop adding. Notice thought, role and pressure without obeying them."],
      ["Differentiate.", " Separate natural response from conditioning, fear and expectation."],
      ["Arrive.", " Reconnect with the quieter centre beneath the identities you carry."],
      ["Live from Origin.", " Return to work, family, grief and love — steadier."],
    ],
  },
  {
    numeral: "III",
    label: "Induced Calmness",
    role: "The state — what becomes available afterward",
    title: "Induced Calmness",
    paragraphs: [
      "Calm is usually treated as something that happens to you when conditions cooperate. Induced Calmness treats it as something a person can deliberately enter, on an ordinary Tuesday, in the middle of a difficult room, without waiting for the room to change.",
      "It is the most portable part of the work, which is why it travels well into organisations. Leaders and teams learn to recover attention under pressure rather than perform composure while depleting themselves underneath it.",
    ],
    asideTitle: "Where it is used",
    asideType: "ul",
    asideItems: [
      "Grief and the hours that ambush you",
      "Rooms where you are expected to have the answer",
      "Conflict, negotiation and family decisions",
      "Corporate mind-fitness sessions for leaders and teams",
    ],
  },
];

function FrameworkTabs() {
  const [active, setActive] = useState(0);

  function handleKeyDown(e, i) {
    let d = 0;
    if (e.key === "ArrowRight") d = 1;
    else if (e.key === "ArrowLeft") d = -1;
    else return;
    e.preventDefault();
    const next = (i + d + frameworks.length) % frameworks.length;
    setActive(next);
    document.getElementById(`fw-tab-${next}`)?.focus();
  }

  const current = frameworks[active];

  return (
    <div>
      <div className="mb-9 flex flex-wrap gap-[10px]" role="tablist" aria-label="Frameworks">
        {frameworks.map((fw, i) => (
          <button
            key={fw.label}
            id={`fw-tab-${i}`}
            type="button"
            role="tab"
            aria-controls={`fw-panel-${i}`}
            aria-selected={active === i}
            onClick={() => setActive(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`flex items-center gap-[10px] rounded-full border px-[22px] py-3 font-text text-[0.92rem] font-medium transition-colors duration-200 ${
              active === i
                ? "border-halo bg-halo text-void"
                : "border-[rgba(237,231,218,0.2)] bg-transparent text-dim hover:border-[rgba(237,231,218,0.45)] hover:text-vellum"
            }`}
          >
            <i className={`font-display not-italic ${active === i ? "text-void/55" : "text-gold"}`}>{fw.numeral}</i>
            {fw.label}
          </button>
        ))}
      </div>

      <div
        id={`fw-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`fw-tab-${active}`}
        tabIndex={0}
        className="grid grid-cols-1 items-start gap-[clamp(28px,5vw,64px)] lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div>
          <div className="mb-[22px] text-[0.85rem] tracking-[0.02em] text-halo">{current.role}</div>
          <h3 className="mb-[0.3em] font-display text-[clamp(1.9rem,3.6vw,2.9rem)] font-light leading-[1.02] tracking-[-0.015em] text-vellum">
            {current.title}
          </h3>
          {current.paragraphs.map((p, idx) => (
            <p key={idx} className="mb-[1.1em] max-w-[64ch] text-[#C6CBD8]">
              {p}
            </p>
          ))}
        </div>
        <div className="rounded-2xl border border-[rgba(237,231,218,0.16)] bg-[rgba(237,231,218,0.035)] p-7">
          <h4 className="mb-[14px] font-text text-[1.05rem] font-bold text-vellum">{current.asideTitle}</h4>
          {current.asideType === "ol" ? (
            <ol className="list-decimal space-y-[9px] pl-[1.15em] text-[0.94rem] text-[#C6CBD8] marker:text-gold">
              {current.asideItems.map((item, idx) => (
                <li key={idx}>
                  <b className="text-vellum">{item[0]}</b>
                  {item[1]}
                </li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc space-y-[9px] pl-[1.15em] text-[0.94rem] text-[#C6CBD8] marker:text-gold">
              {current.asideItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default FrameworkTabs;
