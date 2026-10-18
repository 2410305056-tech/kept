import React from "react";

export function Stat({
  label,
  value,
  unit,
  delta,
  deltaType = "neutral", // "positive", "negative", "neutral"
  className = "",
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--text-3)] mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl sm:text-[40px] font-medium leading-none mono-num text-[var(--text-1)]">
          {value}
        </span>
        {unit && <span className="text-xs text-[var(--text-3)] font-mono">{unit}</span>}
        {delta && (
          <span
            className={`text-[11px] font-mono px-1.5 py-0.5 rounded-[4px] leading-tight ${
              deltaType === "positive"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : deltaType === "negative"
                ? "bg-[var(--surface-3)] text-[var(--text-2)]"
                : "bg-[var(--surface-2)] text-[var(--text-3)]"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
