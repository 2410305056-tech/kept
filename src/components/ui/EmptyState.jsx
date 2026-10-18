import React from "react";
import { Button } from "./Button.jsx";

export function EmptyState({
  icon = "∅",
  message = "No data yet",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-[12px] border border-dashed border-[var(--line)] bg-[var(--surface-1)]/50 ${className}`}
    >
      <div className="w-6 h-6 flex items-center justify-center text-[var(--text-3)] text-xl mb-2">
        {icon}
      </div>
      <p className="text-[13px] text-[var(--text-2)] mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button variant="ghost" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
