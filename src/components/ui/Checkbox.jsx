import React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
  className = "",
}) {
  const reduced = useReducedMotion();

  const handleToggle = () => {
    if (disabled) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={`w-5 h-5 rounded-[4px] border transition-colors flex items-center justify-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        checked
          ? "bg-[var(--accent)] border-[var(--accent)]"
          : "bg-transparent border-[var(--line-strong)] hover:border-[var(--text-3)]"
      } ${disabled ? "opacity-35 pointer-events-none" : ""} ${className}`}
    >
      {checked && (
        <svg
          viewBox="0 0 14 14"
          className="w-3.5 h-3.5 text-[var(--accent-ink)] stroke-current"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M2.5 7.5L5.5 10.5L11.5 3.5"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.18, ease: "easeOut" }}
          />
        </svg>
      )}
    </button>
  );
}
