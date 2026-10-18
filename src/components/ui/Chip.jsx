import React from "react";

export function Chip({
  children,
  variant = "accent", // "accent", "neutral", "warn", "down"
  className = "",
  title,
}) {
  let styleClasses = "bg-[var(--accent-soft)] text-[var(--accent)]";

  if (variant === "neutral") {
    styleClasses = "bg-[var(--surface-3)] text-[var(--text-2)]";
  } else if (variant === "warn") {
    styleClasses = "bg-[var(--warn)]/15 text-[var(--warn)]";
  } else if (variant === "down") {
    styleClasses = "bg-[var(--surface-3)] text-[var(--text-3)]";
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-mono leading-none tracking-tight select-none cursor-default ${styleClasses} ${className}`}
    >
      {children}
    </span>
  );
}
