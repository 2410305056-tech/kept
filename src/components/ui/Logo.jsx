import React from "react";

/**
 * Kept Signature Brand Logo & Monolith Keycap Mark
 * Adheres strictly to DESIGN.md:
 * - 1px spine binding with 4 pillar rivets (Gym, Run, Study, Clean)
 * - Machined monospace typography with +0.18em letter spacing
 * - Signature glowing accent dot (#C8F65C)
 */
export function Logo({
  size = "md",
  showWordmark = true,
  showSubtitle = false,
  className = "",
}) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const markSize = isSm ? 28 : isLg ? 44 : 34;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Keycap Emblem */}
      <div
        className="relative shrink-0 rounded-[8px] bg-[var(--surface-1)] border border-[var(--line-strong)] flex items-center justify-center transition-all duration-140 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.5)] hover:border-[var(--accent)]/50 group"
        style={{ width: markSize, height: markSize }}
        title="Kept — Precision Training Ledger"
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vertical Spine Motif Binding Line */}
          <line
            x1="8"
            y1="6"
            x2="8"
            y2="34"
            stroke="#2A2A36"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* 4 Pillar Rivet Pins: Gym (Accent), Run, Study, Clean */}
          <circle cx="8" cy="9" r="1.6" fill="var(--accent)" className="transition-transform group-hover:scale-125" />
          <circle cx="8" cy="16" r="1.4" fill="#6A6A7C" />
          <circle cx="8" cy="23" r="1.4" fill="#6A6A7C" />
          <circle cx="8" cy="30" r="1.4" fill="#6A6A7C" />

          {/* Geometric Machined "K" Glyph */}
          <path
            d="M17 10V30M17 20L28 10M20 17.5L29 30"
            stroke="var(--text-1)"
            strokeWidth="2.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Glowing Optical Accent Dot */}
          <circle cx="33" cy="28.5" r="2.2" fill="var(--accent)" />
        </svg>
      </div>

      {/* Monolithic Typography Wordmark */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span
              className={`font-mono font-semibold tracking-[0.2em] text-[var(--text-1)] leading-none ${
                isSm ? "text-xs" : isLg ? "text-lg" : "text-sm"
              }`}
            >
              KEPT
            </span>
            <span className="text-[var(--accent)] font-mono ml-0.5 leading-none">
              ●
            </span>
          </div>

          {showSubtitle && (
            <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--text-3)] mt-0.5">
              Ledger
            </span>
          )}
        </div>
      )}
    </div>
  );
}
