import React, { useState } from "react";
import { Card } from "./ui";

const PALETTE = [
  "#C5A880", // Gold / Primary Halo
  "#60A5FA", // Sky Blue
  "#34D399", // Emerald Green
  "#F472B6", // Rose Pink
  "#A78BFA", // Violet / Purple
  "#FBBF24", // Amber Gold
  "#38BDF8", // Cyan
  "#F87171", // Coral Red
];

const money = (n: number) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─────────────────────────────────────────────────────────────
// 1. Primary Analytics Chart (Toggle: Area / Bar / Donut)
// ─────────────────────────────────────────────────────────────

interface TimeSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface AnalyticsTrendProps {
  data: TimeSeriesPoint[];
  range: string;
  onRangeChange: (r: string) => void;
  ranges: Array<{ label: string; value: string }>;
}

// Format compact currency for Y-axis ticks (e.g. $1.5k, $800, $0)
function formatCompactMoney(n: number): string {
  if (n <= 0) return "$0";
  if (n >= 1000) {
    const k = n / 1000;
    return `$${k >= 10 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${Math.round(n)}`;
}

// Format date for display
function formatPointDate(str: string): { short: string; full: string } {
  if (str.includes(":")) {
    return { short: str, full: `Today at ${str}` };
  }
  if (str.length === 3) {
    return { short: str, full: `${str} 2026` };
  }
  const parts = str.split("-");
  if (parts.length === 3) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const monthName = months[m] || parts[1];
    const d = new Date(parseInt(parts[0], 10), m, parseInt(day, 10));
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    return {
      short: `${monthName} ${day}`,
      full: `${weekday}, ${monthName} ${day}, ${parts[0]}`,
    };
  }
  return { short: str, full: str };
}

// Build smooth cubic Catmull-Rom to Bézier spline
function buildSmoothSpline(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export function AnalyticsTrendChart({
  data,
  range,
  onRangeChange,
  ranges,
}: AnalyticsTrendProps) {
  const [chartType, setChartType] = useState<"area" | "bar" | "pie">("area");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute metrics
  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);
  const totalOrders = data.reduce((acc, d) => acc + d.orders, 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Find peak day
  const peakPoint = data.reduce(
    (peak, d) => (d.revenue > (peak?.revenue || 0) ? d : peak),
    null as TimeSeriesPoint | null
  );

  // SVG Geometry Dimensions
  const svgWidth = 1000;
  const svgHeight = 280;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 32;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;
  const baselineY = padTop + plotHeight;

  // Map data to SVG points
  const points = data.map((d, i) => {
    const x = data.length <= 1 ? padLeft + plotWidth / 2 : padLeft + (i / (data.length - 1)) * plotWidth;
    const ratio = maxRevenue > 0 ? d.revenue / maxRevenue : 0;
    const y = baselineY - ratio * plotHeight;
    return { x, y, data: d, index: i };
  });

  const splineLinePath = buildSmoothSpline(points);
  const areaSplinePath =
    points.length > 1
      ? `${splineLinePath} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`
      : "";

  // Reference Y-axis grid ticks (100%, 66%, 33%, 0%)
  const yTicks = [1, 0.66, 0.33, 0].map((pct) => ({
    pct,
    val: maxRevenue * pct,
    y: padTop + (1 - pct) * plotHeight,
  }));

  // Handle magnetic scrub hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (points.length === 0) return;

    // Find nearest point
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((pt, i) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });
    setHoveredIdx(closestIdx);
  };

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--admin-border)]/80 bg-gradient-to-b from-[rgba(15,20,38,0.85)] via-[rgba(11,15,29,0.92)] to-[rgba(7,10,20,0.98)] p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Background Cosmic Atmosphere */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.12)_0%,transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.06)_0%,transparent_70%)] blur-2xl" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--admin-border)]/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-lg sm:text-xl font-medium tracking-tight text-white">
              Sales &amp; Revenue Analytics
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live DB
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
            Continuous real-time revenue trend and order velocity across selected period
          </p>
        </div>

        {/* View Mode & Range Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart View Mode Switcher */}
          <div className="inline-flex items-center rounded-xl border border-[var(--admin-border)] bg-[rgba(7,10,20,0.8)] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                chartType === "area"
                  ? "bg-gradient-to-r from-[#C5A880] to-[#E2BD78] text-[#0A0D18] shadow-md shadow-[#C5A880]/20"
                  : "text-[var(--admin-text-secondary)] hover:text-white"
              }`}
              title="Smooth Area Spline Graph"
            >
              <span>📈</span>
              <span>Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                chartType === "bar"
                  ? "bg-gradient-to-r from-[#C5A880] to-[#E2BD78] text-[#0A0D18] shadow-md shadow-[#C5A880]/20"
                  : "text-[var(--admin-text-secondary)] hover:text-white"
              }`}
              title="Quantum Pillar Bars"
            >
              <span>📊</span>
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("pie")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                chartType === "pie"
                  ? "bg-gradient-to-r from-[#C5A880] to-[#E2BD78] text-[#0A0D18] shadow-md shadow-[#C5A880]/20"
                  : "text-[var(--admin-text-secondary)] hover:text-white"
              }`}
              title="Cosmic Donut Breakdown"
            >
              <span>🍩</span>
              <span>Pie</span>
            </button>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--admin-border)] bg-[rgba(7,10,20,0.8)] p-1 shadow-inner">
            {ranges.map((r) => {
              const active = range === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onRangeChange(r.value)}
                  className={`rounded-lg px-2.5 sm:px-3 py-1 text-[0.74rem] font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-[var(--admin-accent)] text-[#0A0D18] font-bold shadow-sm"
                      : "text-[var(--admin-text-secondary)] hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="relative z-10 grid grid-cols-2 gap-3 py-4 sm:grid-cols-4 sm:gap-4 border-b border-[var(--admin-border)]/40">
        {/* Period Revenue */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-[#C5A880]/30">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Period Revenue
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
              Active
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#E5C69F]">
              {money(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-[#C5A880]/30">
          <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
            Total Orders
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {totalOrders}
            </span>
            <span className="text-[0.72rem] text-[var(--admin-text-muted)]">transactions</span>
          </div>
        </div>

        {/* Avg Order Value (AOV) */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-[#C5A880]/30">
          <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
            Avg Ticket (AOV)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {money(aov)}
            </span>
            <span className="text-[0.72rem] text-[var(--admin-text-muted)]">/ order</span>
          </div>
        </div>

        {/* Peak Performance Day */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-emerald-500/30">
          <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
            Peak Day Velocity
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400">
              {peakPoint ? money(peakPoint.revenue) : "$0.00"}
            </span>
            {peakPoint && peakPoint.revenue > 0 && (
              <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-500/10 px-1 py-0.5 rounded truncate">
                {formatPointDate(peakPoint.date).short}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Stage */}
      <div className="relative pt-4">
        {data.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">📊</span>
            <p className="text-[var(--admin-text-primary)] font-medium text-sm">No transactions in selected period</p>
            <p className="text-xs text-[var(--admin-text-muted)] mt-1">
              Live orders placed in the store will appear automatically here.
            </p>
          </div>
        ) : (
          <div>
            {/* VIEW A: Smooth Area Wave Graph */}
            {chartType === "area" && (
              <div className="relative select-none">
                {/* SVG Visual Canvas */}
                <div className="relative h-[250px] sm:h-[280px] w-full">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    preserveAspectRatio="none"
                    className="h-full w-full overflow-visible"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <defs>
                      {/* Rich Ambient Gold Area Gradient */}
                      <linearGradient id="cosmicAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C5A880" stopOpacity="0.38" />
                        <stop offset="50%" stopColor="#8A6E4C" stopOpacity="0.14" />
                        <stop offset="100%" stopColor="#0B0F1D" stopOpacity="0.0" />
                      </linearGradient>

                      {/* Golden Radiant Stroke Gradient */}
                      <linearGradient id="cosmicLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#C5A880" />
                        <stop offset="50%" stopColor="#F5E4CA" />
                        <stop offset="100%" stopColor="#D8B589" />
                      </linearGradient>

                      {/* Glow Filter for the wave line */}
                      <filter id="cosmicLineGlow" x="-20%" y="-40%" width="140%" height="180%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Horizontal Reference Grid Lines & Left Ticks */}
                    {yTicks.map((tick, i) => (
                      <g key={i}>
                        {/* Dotted grid line */}
                        <line
                          x1={padLeft}
                          y1={tick.y}
                          x2={svgWidth - padRight}
                          y2={tick.y}
                          stroke="rgba(237,231,218,0.07)"
                          strokeDasharray={tick.pct === 0 ? "none" : "3 4"}
                          strokeWidth={tick.pct === 0 ? "1" : "0.75"}
                        />
                        {/* Y-axis currency label */}
                        <text
                          x={padLeft - 12}
                          y={tick.y + 3.5}
                          textAnchor="end"
                          fill="rgba(237,231,218,0.45)"
                          fontSize="11"
                          fontFamily="monospace"
                        >
                          {formatCompactMoney(tick.val)}
                        </text>
                      </g>
                    ))}

                    {/* Area Polygon Fill */}
                    {areaSplinePath && (
                      <path d={areaSplinePath} fill="url(#cosmicAreaGrad)" className="transition-all duration-300" />
                    )}

                    {/* Ambient Glow Under-Stroke */}
                    {splineLinePath && (
                      <path
                        d={splineLinePath}
                        fill="none"
                        stroke="#C5A880"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.35"
                        filter="url(#cosmicLineGlow)"
                      />
                    )}

                    {/* Crisp Main Golden Spline Line */}
                    {splineLinePath ? (
                      <path
                        d={splineLinePath}
                        fill="none"
                        stroke="url(#cosmicLineGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      points.length === 1 && (
                        <circle
                          cx={points[0].x}
                          cy={points[0].y}
                          r="6"
                          fill="#E5C69F"
                          stroke="#C5A880"
                          strokeWidth="2"
                        />
                      )
                    )}

                    {/* Permanent Subtle Markers on Days with Positive Revenue */}
                    {points
                      .filter((pt) => pt.data.revenue > 0)
                      .map((pt) => {
                        const isPeak = peakPoint && pt.data.date === peakPoint.date;
                        return (
                          <g key={pt.index}>
                            {/* Outer aura halo on peak day */}
                            {isPeak && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="12"
                                fill="rgba(197,168,128,0.18)"
                                className="animate-pulse"
                              />
                            )}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isPeak ? "5.5" : "4.5"}
                              fill="#0B0F1D"
                              stroke="#E5C69F"
                              strokeWidth={isPeak ? "2.5" : "2"}
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isPeak ? "2.5" : "2"}
                              fill="#C5A880"
                            />
                          </g>
                        );
                      })}

                    {/* Interactive Active Scrubbing Elements */}
                    {activePoint && (
                      <g>
                        {/* Vertical Laser Guide Line */}
                        <line
                          x1={activePoint.x}
                          y1={padTop}
                          x2={activePoint.x}
                          y2={baselineY}
                          stroke="#C5A880"
                          strokeWidth="1.25"
                          strokeDasharray="4 3"
                          opacity="0.8"
                        />
                        {/* Hover Point Halo Ring */}
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r="14"
                          fill="rgba(197,168,128,0.22)"
                        />
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r="7"
                          fill="#0A0D18"
                          stroke="#F5E4CA"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r="3"
                          fill="#E5C69F"
                        />
                      </g>
                    )}
                  </svg>

                  {/* Floating Glassmorphism Tooltip (HTML Overlay for crisp rendering) */}
                  {activePoint && (
                    <div
                      className="pointer-events-none absolute z-20 -translate-x-1/2 transition-all duration-75"
                      style={{
                        left: `${(activePoint.x / svgWidth) * 100}%`,
                        top: `${Math.max(8, ((activePoint.y - 75) / svgHeight) * 100)}%`,
                      }}
                    >
                      <div className="whitespace-nowrap rounded-xl border border-[#C5A880]/60 bg-[rgba(10,13,24,0.96)] px-3.5 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--admin-text-muted)] mb-0.5">
                          <span>{formatPointDate(activePoint.data.date).full}</span>
                          {peakPoint && activePoint.data.date === peakPoint.date && activePoint.data.revenue > 0 && (
                            <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                              PEAK
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-base font-bold text-[#F5E4CA]">
                            {money(activePoint.data.revenue)}
                          </span>
                          <span className="text-[11px] text-white/70">
                            · {activePoint.data.orders} {activePoint.data.orders === 1 ? "order" : "orders"}
                          </span>
                        </div>
                        {activePoint.data.orders > 0 && (
                          <div className="mt-0.5 text-[10px] text-[var(--admin-accent)]/80 font-mono">
                            AOV: {money(activePoint.data.revenue / activePoint.data.orders)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom X-Axis Date Labels */}
                <div
                  className="relative mt-2 flex justify-between text-[0.72rem] text-[var(--admin-text-muted)] font-mono"
                  style={{
                    paddingLeft: `${(padLeft / svgWidth) * 100}%`,
                    paddingRight: `${(padRight / svgWidth) * 100}%`,
                  }}
                >
                  {/* Select smartly spaced date labels so they never crowd */}
                  {(() => {
                    const step = Math.max(1, Math.floor(data.length / (data.length > 15 ? 7 : 5)));
                    return data.map((d, i) => {
                      const isFirst = i === 0;
                      const isLast = i === data.length - 1;
                      const isStep = i % step === 0;
                      const hasRevenue = d.revenue > 0;
                      const isHovered = hoveredIdx === i;

                      if (!isFirst && !isLast && !isStep && !hasRevenue && !isHovered) {
                        return null;
                      }

                      const pct = (i / (data.length - 1)) * 100;
                      return (
                        <div
                          key={i}
                          className="absolute -translate-x-1/2 cursor-pointer transition-colors"
                          style={{ left: `${pct}%` }}
                          onMouseEnter={() => setHoveredIdx(i)}
                          onMouseLeave={() => setHoveredIdx(null)}
                        >
                          <span
                            className={`rounded px-1 py-0.5 transition-all ${
                              isHovered
                                ? "bg-[#C5A880] text-[#0A0D18] font-bold shadow-sm"
                                : hasRevenue
                                ? "text-[#E5C69F] font-semibold"
                                : "text-[var(--admin-text-muted)] hover:text-white"
                            }`}
                          >
                            {formatPointDate(d.date).short}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* VIEW B: Quantum Cylindrical Bar Graph */}
            {chartType === "bar" && (
              <div className="pt-2">
                <div className="relative flex h-[240px] items-end justify-between gap-1.5 sm:gap-2 border-b border-[var(--admin-border)]/50 px-2 pb-1">
                  {/* Background reference grid lines for bars */}
                  {[0.75, 0.5, 0.25].map((pct, i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute left-0 right-0 border-b border-[rgba(237,231,218,0.05)] border-dashed"
                      style={{ bottom: `${pct * 85}%` }}
                    />
                  ))}

                  {data.map((d, i) => {
                    const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 88 : 0;
                    const isHovered = hoveredIdx === i;
                    const isPeak = peakPoint && d.date === peakPoint.date && d.revenue > 0;

                    return (
                      <div
                        key={i}
                        className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        {/* Hover Tooltip Value */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 whitespace-nowrap rounded-lg border border-[#C5A880]/60 bg-[#0A0D18] px-2.5 py-1 text-xs shadow-xl backdrop-blur-md">
                            <span className="text-[var(--admin-text-muted)] text-[10px] block font-mono">
                              {formatPointDate(d.date).short}
                            </span>
                            <span className="font-bold text-[#E5C69F] font-mono mr-1">
                              {money(d.revenue)}
                            </span>
                            <span className="text-[10px] text-white/70">({d.orders} ord)</span>
                          </div>
                        )}

                        {/* Peak Crown Badge */}
                        {isPeak && !isHovered && (
                          <span className="mb-1 rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                            Peak
                          </span>
                        )}

                        {/* Bar Pillar */}
                        <div
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                          className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 relative overflow-hidden ${
                            isHovered
                              ? "bg-gradient-to-t from-[#8E7552] via-[#C5A880] to-[#F5E4CA] shadow-[0_0_20px_rgba(197,168,128,0.45)]"
                              : isPeak
                              ? "bg-gradient-to-t from-[#524431] via-[#C5A880] to-[#E5C69F] shadow-[0_0_12px_rgba(197,168,128,0.25)]"
                              : d.revenue > 0
                              ? "bg-gradient-to-t from-[#362E23] via-[#8E7552] to-[#C5A880]"
                              : "bg-white/[0.04] hover:bg-white/[0.08]"
                          }`}
                        >
                          {/* Top Highlight Cap */}
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bar Bottom X-axis Date Labels */}
                <div className="mt-3 flex justify-between text-[0.7rem] text-[var(--admin-text-muted)] font-mono px-2">
                  {(() => {
                    const step = Math.max(1, Math.floor(data.length / (data.length > 15 ? 8 : 6)));
                    return data.map((d, i) => {
                      const isFirst = i === 0;
                      const isLast = i === data.length - 1;
                      const isStep = i % step === 0;
                      const hasRevenue = d.revenue > 0;
                      const isHovered = hoveredIdx === i;

                      if (!isFirst && !isLast && !isStep && !hasRevenue && !isHovered) {
                        return <span key={i} className="flex-1" />;
                      }

                      return (
                        <span
                          key={i}
                          className={`flex-1 text-center truncate cursor-pointer transition-colors ${
                            isHovered
                              ? "text-[#C5A880] font-bold"
                              : hasRevenue
                              ? "text-white font-semibold"
                              : "text-[var(--admin-text-muted)]"
                          }`}
                          onMouseEnter={() => setHoveredIdx(i)}
                          onMouseLeave={() => setHoveredIdx(null)}
                        >
                          {formatPointDate(d.date).short}
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* VIEW C: Cosmic Donut / Pie Breakdown */}
            {chartType === "pie" && (
              <div className="py-3">
                <DonutSliceChart
                  items={data
                    .filter((d) => d.revenue > 0)
                    .map((d) => ({
                      label: formatPointDate(d.date).full,
                      value: d.revenue,
                      sub: `${d.orders} ${d.orders === 1 ? "order" : "orders"}`,
                    }))}
                  totalLabel="Period Total"
                  formatValue={money}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Generic Reusable SVG Donut / Pie Chart
// ─────────────────────────────────────────────────────────────

interface SliceItem {
  label: string;
  value: number;
  sub?: string;
  color?: string;
}

interface DonutSliceChartProps {
  items: SliceItem[];
  totalLabel?: string;
  formatValue?: (v: number) => string;
}

export function DonutSliceChart({
  items,
  totalLabel = "Total",
  formatValue = (v) => String(v),
}: DonutSliceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = items.reduce((acc, it) => acc + it.value, 0);
  const radius = 68;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  if (total === 0 || items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-[var(--admin-text-muted)]">
        No distribution data recorded.
      </div>
    );
  }

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg width="190" height="190" viewBox="0 0 200 200" className="transform -rotate-90 overflow-visible">
          {/* Background circle track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="rgba(237,231,218,0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {items.map((item, idx) => {
            const percent = item.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;
            const color = item.color || PALETTE[idx % PALETTE.length];
            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={idx}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-[0.68rem] uppercase tracking-wider text-[var(--admin-text-muted)]">
            {hoveredIndex !== null ? items[hoveredIndex].label : totalLabel}
          </span>
          <span className="text-base font-bold text-white">
            {hoveredIndex !== null ? formatValue(items[hoveredIndex].value) : formatValue(total)}
          </span>
          {hoveredIndex !== null && (
            <span className="text-[0.65rem] text-halo font-semibold">
              {((items[hoveredIndex].value / total) * 100).toFixed(1)}% share
            </span>
          )}
        </div>
      </div>

      {/* Legend & Percentages List */}
      <div className="flex-1 w-full max-w-sm space-y-2">
        {items.slice(0, 6).map((item, idx) => {
          const color = item.color || PALETTE[idx % PALETTE.length];
          const percent = ((item.value / total) * 100).toFixed(1);
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer text-xs ${
                isHovered ? "bg-white/[0.08]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate font-medium text-[var(--admin-text-primary)]">
                  {item.label}
                </span>
                {item.sub && <span className="text-[0.7rem] text-dim">({item.sub})</span>}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <span className="font-semibold text-white">{formatValue(item.value)}</span>
                <span className="w-11 text-right font-mono text-[0.72rem] text-dim">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Category Revenue Share Donut Chart
// ─────────────────────────────────────────────────────────────

interface CategoryItem {
  name: string;
  count: number;
  revenue: number;
  sales: number;
}

export function CategoryRevenueChart({ categories }: { categories: CategoryItem[] }) {
  const items = categories.map((cat, i) => ({
    label: cat.name,
    value: cat.revenue,
    sub: `${cat.count} bks`,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <Card title="Revenue Share by Category (Pie Chart)">
      <div className="pt-2">
        <DonutSliceChart items={items} totalLabel="All Categories" formatValue={money} />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Order Status Breakdown Chart
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#34D399", // Emerald
  PAYMENT_CONFIRMED: "#10B981", // Green
  PROCESSING: "#60A5FA", // Sky Blue
  SHIPPED: "#818CF8", // Indigo
  PENDING: "#FBBF24", // Amber
  CANCELLED: "#F87171", // Rose
  REFUNDED: "#A78BFA", // Violet
};

interface OrderStatusItem {
  status: string;
  count: number;
  amount: number;
}

export function OrderStatusBreakdownChart({ statuses }: { statuses: OrderStatusItem[] }) {
  const items = statuses.map((st) => ({
    label: st.status.replace(/_/g, " "),
    value: st.count,
    sub: money(st.amount),
    color: STATUS_COLORS[st.status] || "#94A3B8",
  }));

  return (
    <Card title="Order Status Breakdown (Pie Chart)">
      <div className="pt-2">
        <DonutSliceChart
          items={items}
          totalLabel="Total Orders"
          formatValue={(v) => `${v} orders`}
        />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Publication Sales Comparison (Horizontal Bar Chart)
// ─────────────────────────────────────────────────────────────

interface BookSaleItem {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  price: number;
  salesCount: number;
  revenue: number;
}

export function PublicationSalesBarChart({ books }: { books: BookSaleItem[] }) {
  const maxUnits = Math.max(...books.map((b) => b.salesCount), 1);

  return (
    <Card title="Publication Sales Comparison (Bar Chart)">
      <div className="space-y-4 pt-2">
        {books.map((book, idx) => {
          const percent = (book.salesCount / maxUnits) * 100;
          return (
            <div key={book._id || idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <img
                    src={book.coverImage || "/aao-part-one.png"}
                    alt={book.title}
                    className="h-7 w-5 rounded object-cover border border-white/10 shrink-0"
                  />
                  <span className="font-medium text-vellum truncate max-w-[200px] sm:max-w-xs">
                    {book.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-white">{book.salesCount} sold</span>
                  <span className="text-halo font-semibold">{money(book.revenue)}</span>
                </div>
              </div>

              {/* Horizontal Bar Track */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.05] p-0.5">
                <div
                  style={{ width: `${Math.max(5, percent)}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-[#C5A880]/70 via-[#C5A880] to-[#E0C9A6] transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
