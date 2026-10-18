import React from "react";
import { marksFor } from "../../lib/logic.js";
import { parse } from "../../lib/dates.js";

export function DayCell({
  dateStr,
  currentMonth,
  todayStr,
  isSelected,
  onClick,
  state,
}) {
  const dateObj = parse(dateStr);
  const dayNum = dateObj.getDate();
  const isToday = dateStr === todayStr;
  const isOutOfMonth = dateStr.slice(0, 7) !== currentMonth;
  const isFuture = dateStr > todayStr;

  const marks = marksFor(dateStr, state);

  // Accessible mark descriptions
  const statusParts = [];
  if (marks.gym) statusParts.push("Gym done");
  if (marks.run) statusParts.push("Run done");
  if (marks.study) statusParts.push("Study done");
  if (marks.clean) statusParts.push("Clean done");
  if (marks.slip) statusParts.push("Slip recorded");
  const ariaLabel = `${dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}: ${statusParts.length ? statusParts.join(", ") : "Nothing logged"}`;

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isSelected}
      onClick={() => onClick(dateStr)}
      className={`keycap-3d group relative flex flex-col justify-between p-1.5 sm:p-2.5 rounded-[10px] border aspect-square sm:aspect-[1/0.75] outline-none select-none text-left cursor-pointer ${
        isSelected
          ? "bg-[var(--surface-2)] border-[var(--line-strong)] !translate-y-[-2px] shadow-[var(--e2)] ring-1 ring-[var(--line-strong)]"
          : isToday
          ? "border-[var(--accent)] bg-[var(--surface-1)] shadow-[var(--e1)]"
          : "border-[var(--line)] bg-[var(--surface-1)]"
      } ${isOutOfMonth ? "opacity-30" : isFuture ? "opacity-45" : "opacity-100"}`}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`text-xs sm:text-[13px] font-mono leading-none ${
            isToday ? "text-[var(--accent)] font-medium" : "text-[var(--text-1)]"
          }`}
        >
          {dayNum}
        </span>
        {isToday && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block sm:hidden" />
        )}
      </div>

      {/* 4 Pillar Marks (Gym, Run, Study, Clean) */}
      <div className="flex items-center gap-1 sm:gap-1.5 mt-auto">
        {/* Gym Mark (G) */}
        <div
          title={marks.gym ? "Gym logged" : "No gym"}
          className={`w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-[2px] flex items-center justify-center text-[9px] font-mono leading-none font-bold transition-colors ${
            marks.gym
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "border border-[var(--line-strong)] text-[var(--text-3)]"
          }`}
        >
          <span className="hidden sm:inline">G</span>
        </div>

        {/* Run Mark (R) */}
        <div
          title={marks.run ? "Run logged" : "No run"}
          className={`w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-[2px] flex items-center justify-center text-[9px] font-mono leading-none font-bold transition-colors ${
            marks.run
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "border border-[var(--line-strong)] text-[var(--text-3)]"
          }`}
        >
          <span className="hidden sm:inline">R</span>
        </div>

        {/* Study Mark (S) */}
        <div
          title={marks.study ? "Study logged" : "No study"}
          className={`w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-[2px] flex items-center justify-center text-[9px] font-mono leading-none font-bold transition-colors ${
            marks.study
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "border border-[var(--line-strong)] text-[var(--text-3)]"
          }`}
        >
          <span className="hidden sm:inline">S</span>
        </div>

        {/* Clean Mark (C) */}
        <div
          title={marks.clean ? "Clean day" : marks.slip ? "Slip (strike)" : "No clean mark"}
          className={`relative w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-[2px] flex items-center justify-center text-[9px] font-mono leading-none font-bold transition-colors ${
            marks.clean
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : marks.slip
              ? "border border-[var(--text-3)] text-[var(--text-2)] bg-[var(--surface-3)]"
              : "border border-[var(--line-strong)] text-[var(--text-3)]"
          }`}
        >
          <span className="hidden sm:inline">C</span>
          {/* Slip diagonal strike (never red) */}
          {marks.slip && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none stroke-[var(--text-2)] stroke-[1.5]"
              viewBox="0 0 14 14"
            >
              <line x1="2" y1="12" x2="12" y2="2" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
