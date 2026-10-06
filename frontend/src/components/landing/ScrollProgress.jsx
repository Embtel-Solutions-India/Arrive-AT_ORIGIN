import { useEffect, useRef } from "react";

function ScrollProgress() {
  const lineRef = useRef(null);

  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${progress})`;
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      ref={lineRef}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left scale-x-0 bg-linear-to-r from-gold to-halo"
    />
  );
}

export default ScrollProgress;
