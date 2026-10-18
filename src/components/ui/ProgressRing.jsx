import React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function ProgressRing({
  size = 72,
  strokeWidth = 2,
  progress = 0, // 0 to 1
  label,
  valueText,
  subText,
  className = "",
}) {
  const reduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--surface-3)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="none"
            initial={reduced ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: reduced ? 0.01 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {valueText && (
            <span className="text-xs sm:text-sm font-medium mono-num text-[var(--text-1)] leading-none">
              {valueText}
            </span>
          )}
          {subText && (
            <span className="text-[10px] text-[var(--text-3)] font-mono leading-none mt-0.5">
              {subText}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--text-3)] mt-2">
          {label}
        </span>
      )}
    </div>
  );
}
