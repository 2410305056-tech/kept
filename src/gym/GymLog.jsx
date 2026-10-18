import React, { useState } from "react";
import { useStore } from "../hooks/useStore.js";
import { formatDisplayDate } from "../lib/dates.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Odometer } from "../components/ui/Odometer.jsx";

// Epley & Brzycki formula for estimated 1 Rep Max
function calculate1RM(weightKg, reps) {
  if (!weightKg || !reps || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  // Brzycki: weight / (1.0278 - 0.0278 * reps)
  const brzycki = weightKg / (1.0278 - 0.0278 * reps);
  return Math.round(brzycki * 10) / 10;
}

export function GymLog() {
  const [state, setState] = useStore();
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const sortedSessions = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = (id) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }));
    setDeleteConfirmId(null);
  };

  // Cumulative Lifetime Tonnage Math
  const totalLifetimeVolume = state.sessions.reduce(
    (acc, s) => acc + (s.totalVolume || 0),
    0
  );
  const avgSessionVolume = state.sessions.length > 0
    ? Math.round(totalLifetimeVolume / state.sessions.length)
    : 0;

  // Best Estimated 1RM for major compound lifts
  const compoundLifts = ["overhead press", "bench press", "squat", "barbell row", "deadlift"];
  const bestCompoundRecords = {};

  state.sessions.forEach((session) => {
    session.exercises?.forEach((ex) => {
      const match = compoundLifts.find((l) => ex.name?.toLowerCase().includes(l));
      if (match) {
        ex.sets?.forEach((set) => {
          if (set.done && set.reps > 0 && set.weightKg > 0) {
            const e1rm = calculate1RM(set.weightKg, set.reps);
            if (!bestCompoundRecords[match] || e1rm > bestCompoundRecords[match].e1rm) {
              bestCompoundRecords[match] = {
                exerciseName: ex.name,
                e1rm,
                weight: set.weightKg,
                reps: set.reps,
                date: session.date,
              };
            }
          }
        });
      }
    });
  });

  return (
    <div className="space-y-4">
      {/* Lifetime Tonnage & Volume Telemetry Strip */}
      <Card tilt={true} className="space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold">
            Iron Telemetry · Progressive Overload
          </span>
          <span className="text-xs text-[var(--text-3)]">
            {state.sessions.length} Logged Sessions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider block">
              Cumulative Tonnage
            </span>
            <div className="text-2xl font-semibold text-[var(--text-1)] tabular-nums mt-0.5">
              <Odometer value={totalLifetimeVolume} /> <span className="text-sm font-normal text-[var(--accent)]">kg</span>
            </div>
            <span className="text-[10px] text-[var(--text-3)]">
              {(totalLifetimeVolume / 1000).toFixed(2)} metric tons moved
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider block">
              Mean Session Volume
            </span>
            <div className="text-2xl font-semibold text-[var(--text-1)] tabular-nums mt-0.5">
              <Odometer value={avgSessionVolume} /> <span className="text-sm font-normal text-[var(--text-2)]">kg</span>
            </div>
            <span className="text-[10px] text-[var(--text-3)]">Per completed workout</span>
          </div>

          <div>
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider block">
              Cycle Projection (12W)
            </span>
            <div className="text-2xl font-semibold text-[var(--accent)] tabular-nums mt-0.5">
              {Math.round(avgSessionVolume * 48 / 1000)} <span className="text-sm font-normal">tons</span>
            </div>
            <span className="text-[10px] text-[var(--text-3)]">Based on 4 workouts / week</span>
          </div>
        </div>

        {/* Estimated 1RM Compound Badges */}
        {Object.keys(bestCompoundRecords).length > 0 && (
          <div className="pt-3 border-t border-[var(--line)]/60">
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider block mb-2">
              Estimated 1-Rep Max (Brzycki Formula)
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(bestCompoundRecords).map(([key, data]) => (
                <div
                  key={key}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] text-xs flex items-center gap-2"
                >
                  <span className="text-[var(--text-2)] font-medium capitalize">{key}:</span>
                  <span className="text-[var(--accent)] font-semibold">{data.e1rm} kg</span>
                  <span className="text-[10px] text-[var(--text-3)]">({data.weight}kg × {data.reps})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Session History List */}
      {sortedSessions.length === 0 ? (
        <EmptyState message="No workout sessions logged yet" icon="dumbbell" />
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const totalSets = session.exercises?.reduce(
              (acc, ex) => acc + (ex.sets?.filter((s) => s.done)?.length || 0),
              0
            );

            return (
              <Card key={session.id} className="p-4 space-y-3">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--accent)] font-medium">
                      {formatDisplayDate(session.date)}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-1)]">
                      {session.dayName}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-3)] hidden sm:inline">
                      Week {session.week}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-2)]">
                    <span>{totalSets} sets</span>
                    <span>{session.totalVolume || 0} kg</span>
                    <span className="text-[var(--text-3)] text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-[var(--line)] space-y-3 text-xs font-mono animate-in fade-in duration-140">
                    <div className="space-y-2">
                      {session.exercises?.map((ex, i) => {
                        const doneSets = ex.sets?.filter((s) => s.done) || [];
                        if (doneSets.length === 0) return null;

                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-1 border-b border-[var(--line)]/40 last:border-0">
                            <span className="text-[var(--text-1)] font-medium">{ex.name}</span>
                            <div className="flex flex-wrap gap-2 text-[var(--text-2)]">
                              {doneSets.map((s, idx) => (
                                <span key={idx} className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                                  {s.weightKg}kg × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-2">
                      {deleteConfirmId === session.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[var(--danger)]">Delete session?</span>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(session.id)}>
                            Confirm
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(session.id)}>
                          Delete Log
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
