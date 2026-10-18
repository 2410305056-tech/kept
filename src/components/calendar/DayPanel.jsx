import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { formatDisplayDate, parse } from "../../lib/dates.js";
import { formatMinutes, formatWeight, formatPace } from "../../lib/format.js";
import { Button } from "../ui/Button.jsx";
import { Chip } from "../ui/Chip.jsx";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function DayPanel({
  dateStr,
  state,
  todayStr,
  onClose,
}) {
  const reduced = useReducedMotion();
  const isFuture = dateStr > todayStr;
  const displayDate = formatDisplayDate(dateStr);

  const session = state.sessions.find((s) => s.date === dateStr);
  const studySessions = state.studySessions.filter((s) => s.date === dateStr);
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const cleanEntry = state.cleanLog.find((c) => c.date === dateStr);
  const runs = state.runs.filter((r) => r.date === dateStr);
  const totalRunKm = runs.reduce((acc, r) => acc + (r.km || 0), 0);
  const totalRunMinutes = runs.reduce((acc, r) => acc + (r.minutes || 0), 0);

  const hasAnyData = session || studySessions.length > 0 || cleanEntry || runs.length > 0;

  return (
    <motion.div
      layoutId={reduced ? undefined : `day-panel-${dateStr}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
      transition={{ duration: reduced ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full bg-[var(--surface-1)] border border-[var(--line)] rounded-[12px] p-5 shadow-[var(--e2)] space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)]">
            Daily Record
          </span>
          <h2 className="text-xl font-medium tracking-tight text-[var(--text-1)]">
            {displayDate}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail panel"
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Future date warning */}
      {isFuture ? (
        <div className="p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] text-xs font-mono text-[var(--text-3)] text-center">
          Future date — logging disabled.
        </div>
      ) : !hasAnyData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-3">
          <span className="text-2xl text-[var(--text-3)]">∅</span>
          <p className="text-sm text-[var(--text-2)]">Nothing logged for this day</p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Link to={`/gym?date=${dateStr}`}>
              <Button variant="ghost" size="md">
                Log Gym
              </Button>
            </Link>
            <Link to={`/study?date=${dateStr}`}>
              <Button variant="ghost" size="md">
                Log Study
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Gym Pillar */}
          <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[2px] bg-[var(--accent)]" />
                <span className="text-xs font-mono uppercase text-[var(--text-2)]">Gym</span>
              </div>
              {session ? (
                <span className="text-xs font-mono text-[var(--accent)]">{session.dayName}</span>
              ) : (
                <Link to={`/gym?date=${dateStr}`} className="text-xs text-[var(--text-3)] hover:text-[var(--accent)]">
                  + Log
                </Link>
              )}
            </div>

            {session ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-baseline justify-between text-xs font-mono text-[var(--text-2)] border-b border-[var(--line)] pb-1.5">
                  <span>Sets: {session.exercises?.reduce((acc, e) => acc + (e.sets?.filter((s) => s.done)?.length || 0), 0)}</span>
                  <span title="Dumbbell volume = entered per-hand weight × reps (no doubling)" className="cursor-help">
                    Vol: {session.totalVolume || 0} kg ℹ
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {session.exercises?.map((e, idx) => {
                    const doneSets = e.sets?.filter((s) => s.done) || [];
                    if (doneSets.length === 0) return null;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-1)] truncate pr-2">{e.name}</span>
                        <span className="font-mono text-[var(--text-2)] shrink-0">
                          {doneSets.length} sets ({doneSets.map((s) => `${s.weightKg}×${s.reps}`).join(", ")})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-3)] font-mono">No workout recorded</span>
            )}
          </div>

          {/* Study Pillar */}
          <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[2px] bg-[var(--accent)]" />
                <span className="text-xs font-mono uppercase text-[var(--text-2)]">Study</span>
              </div>
              <span className="text-xs font-mono text-[var(--text-1)]">
                {totalStudyMinutes > 0 ? formatMinutes(totalStudyMinutes) : "0m"}
              </span>
            </div>
            {studySessions.length > 0 ? (
              <div className="text-xs text-[var(--text-3)] font-mono">
                {studySessions.length} session{studySessions.length > 1 ? "s" : ""}
              </div>
            ) : (
              <span className="text-xs text-[var(--text-3)] font-mono">No study logged</span>
            )}
          </div>

          {/* Clean Pillar */}
          <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[2px] bg-[var(--accent)]" />
                <span className="text-xs font-mono uppercase text-[var(--text-2)]">Clean</span>
              </div>
              {cleanEntry ? (
                <Chip variant={cleanEntry.status === "clean" ? "accent" : "down"}>
                  {cleanEntry.status === "clean" ? "Clean" : "Slipped"}
                </Chip>
              ) : (
                <span className="text-xs text-[var(--text-3)] font-mono">Unmarked</span>
              )}
            </div>
          </div>

          {/* Run Pillar */}
          <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[2px] bg-[var(--accent)]" />
                <span className="text-xs font-mono uppercase text-[var(--text-2)]">Running</span>
              </div>
              {totalRunKm > 0 ? (
                <span className="text-xs font-mono text-[var(--text-1)]">
                  {totalRunKm} km ({formatPace(totalRunMinutes, totalRunKm)})
                </span>
              ) : (
                <span className="text-xs text-[var(--text-3)] font-mono">No runs logged</span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
