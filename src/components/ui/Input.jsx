import React from "react";

export function Input({
  label,
  error,
  id,
  className = "",
  type = "text",
  value,
  onChange,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--text-3)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 px-3 bg-[var(--surface-2)] border text-base text-[var(--text-1)] placeholder-[var(--text-3)] rounded-[8px] transition-colors duration-140 outline-none ${
          error
            ? "border-[var(--danger)] focus:border-[var(--danger)]"
            : "border-[var(--line)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        } ${className}`}
        {...props}
      />
      <div className="min-h-[18px] mt-1">
        {error && (
          <span id={errorId} className="text-[11px] text-[var(--danger)]">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
