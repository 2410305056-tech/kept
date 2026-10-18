import React from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  badge,
  className = "",
}) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[var(--line)] ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-[var(--text-1)]">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--text-2)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
