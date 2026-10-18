import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) {
  const isPrimary = variant === "primary";
  const isLg = size === "lg";

  const heightClass = isLg ? "h-12 sm:h-14 px-6 text-sm" : "h-11 px-4 text-[13px]";
  const baseClass =
    "inline-flex items-center justify-center font-medium tracking-[0.04em] rounded-[10px] select-none transition-all duration-140 active:scale-[0.98] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

  const variantClass = isPrimary
    ? "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-105 active:brightness-95 shadow-[var(--e1)]"
    : "bg-transparent text-[var(--text-1)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] active:bg-[var(--surface-3)]";

  const disabledClass = disabled || loading ? "opacity-35 pointer-events-none cursor-not-allowed" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClass} ${heightClass} ${variantClass} ${disabledClass} ${className}`}
      {...props}
    >
      <span className={loading ? "opacity-50" : ""}>{children}</span>
    </button>
  );
}
