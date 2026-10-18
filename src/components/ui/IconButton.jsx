import React from "react";

export function IconButton({
  children,
  onClick,
  "aria-label": ariaLabel,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-10 h-10 rounded-[10px] inline-flex items-center justify-center text-[var(--text-1)] border border-transparent hover:border-[var(--line)] hover:bg-[var(--surface-2)] active:bg-[var(--surface-3)] active:scale-[0.98] transition-all duration-140 cursor-pointer disabled:opacity-35 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className}`}
      {...props}
    >
      <div className="w-6 h-6 flex items-center justify-center stroke-[1.5px]">
        {children}
      </div>
    </button>
  );
}
