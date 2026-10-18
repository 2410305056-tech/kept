import { sound } from "../lib/audio.js";
import { Barbell3D } from "../components/gym/Barbell3D.jsx";
import { WarmupCalculator } from "../components/gym/WarmupCalculator.jsx";
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { weekNumber, phaseForWeek, setsFor, suggestForWeek } from "../lib/logic.js";
import { formatSecondsToTimer, formatDisplayDate } from "../lib/format.js";
import { parse, weekdayIndex } from "../lib/dates.js";
import { Stepper } from "../components/ui/Stepper.jsx";
import { Checkbox } from "../components/ui/Checkbox.jsx";
import { Button } from "../components/ui/Button.jsx";
import { IconButton } from "../components/ui/IconButton.jsx";
import { Chip } from "../components/ui/Chip.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Odometer } from "../components/ui/Odometer.jsx";
import { ToastContext } from "../context/ToastContext.js";

// Standard Olympic 20kg bar plate math helper
function getBarbellPlates(weightKg) {
  if (weightKg < 20) return null;
  const perSide = (weightKg - 20) / 2;
  if (perSide <= 0) return "Bar only (20 kg)";
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  let rem = Math.round(perSide * 100) / 100;
  const plates = [];
  for (const p of availablePlates) {
    while (rem >= p - 0.01) {
      plates.push(p);
      rem = Math.round((rem - p) * 100) / 100;
    }
  }
  return plates.length > 0 ? `${plates.join(" + ")} kg/side` : "Bar only";
}

export function GymToday({ dateOverride }) {
  const [state, setState] = useStore();
  const { today } = useNow();
  const activeDate = dateOverride || today;
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  // Sound is opt-in and stored in settings so it survives reloads.
  const soundEnabled = Boolean(state.settings?.soundEnabled);

  const curWeek = weekNumber(state.plan, activeDate);
  const curPhase = phaseForWeek(curWeek);
  const dayIdx = weekdayIndex(activeDate);
  const plannedDay = state.plan.split[dayIdx] || { day: "Today", name: "Rest", rest: true, exercises: [] };

  // Find existing session for activeDate (idempotent)
  const existingSession = state.sessions.find((s) => s.date === activeDate);

  const [sessionState, setSessionState] = useState(() => {
    if (existingSession) return existingSession;

    // Resolve exercises with planned sets and suggested weights
    const initialExercises = plannedDay.exercises.map((ex) => {
      const numSets = setsFor(ex, curWeek);
      const suggestion = suggestForWeek(ex, state.sessions, curWeek);
      const weight = suggestion.weight ?? ex.startWeightKg;

      const sets = Array.from({ length: numSets }, () => ({
        weightKg: weight,
        reps: 0,
        rir: ex.rir,
        done: false,
      }));

      return {
        exerciseId: ex.id,
        name: ex.name,
        isIsolation: ex.isIsolation,
        note: ex.note,
        suggestion,
        sets,
      };
    });

    return {
      id: crypto.randomUUID(),
      date: activeDate,
      dayName: plannedDay.name,
      week: curWeek,
      phase: curPhase,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      notes: "",
      totalVolume: 0,
      exercises: initialExercises,
    };
  });

  // Track the most recently completed set for ring pulse animation
  const [lastCheckedKey, setLastCheckedKey] = useState(null);
  const [activePlateCalcExId, setActivePlateCalcExId] = useState(null);
  const [activeWarmupExId, setActiveWarmupExId] = useState(null);

  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Elapsed workout timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!sessionState.startedAt || sessionState.finishedAt) return;
    const startMs = new Date(sessionState.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState.startedAt, sessionState.finishedAt]);

  // Rest Countdown Timer HUD
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [lastRestExName, setLastRestExName] = useState("");

  useEffect(() => {
    if (restSeconds <= 0) return;
    const interval = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          // Play vintage precision chronograph chime
          if (soundEnabled) {
            sound.playRestCompleteChime();
          }
          // Micro haptic notification when rest ends
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restSeconds, soundEnabled]);

  // Error state for zero completed sets
  const [finishError, setFinishError] = useState("");

  // Autosave session state to store
  const syncSessionToStore = (updated) => {
    setSessionState(updated);
    setState((prev) => {
      const filtered = prev.sessions.filter((s) => s.date !== activeDate);
      return { ...prev, sessions: [...filtered, updated] };
    });
  };

  const handleSetChange = (exIdx, setIdx, field, val) => {
    const nextExercises = [...sessionState.exercises];
    const targetSet = { ...nextExercises[exIdx].sets[setIdx], [field]: val };
    nextExercises[exIdx].sets[setIdx] = targetSet;

    const updated = { ...sessionState, exercises: nextExercises };
    syncSessionToStore(updated);
  };

  const handleCheckSet = (exIdx, setIdx, done) => {
    const nextExercises = [...sessionState.exercises];
    const targetEx = nextExercises[exIdx];
    const set = targetEx.sets[setIdx];

    // Partial set: reps 0 is not counted as done
    if (done && (!set.reps || set.reps <= 0)) {
      setFinishError("Enter reps before completing set");
      return;
    }
    setFinishError("");

    targetEx.sets[setIdx] = { ...set, done };

    // Trigger signature pulse, haptic and rest timer
    if (done) {
      setLastCheckedKey(`${exIdx}-${setIdx}`);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([12, 35, 18]);
      }
      const restDuration = targetEx.isIsolation ? 75 : 150;
      setRestTotal(restDuration);
      setRestSeconds(restDuration);
      setLastRestExName(targetEx.name);
    }

    const updated = { ...sessionState, exercises: nextExercises };
    syncSessionToStore(updated);
  };

  const handleAddSet = (exIdx) => {
    const nextExercises = [...sessionState.exercises];
    const ex = nextExercises[exIdx];
    const lastSet = ex.sets[ex.sets.length - 1];
    ex.sets.push({
      weightKg: lastSet?.weightKg ?? 20,
      reps: 0,
      rir: 2,
      done: false,
    });
    syncSessionToStore({ ...sessionState, exercises: nextExercises });
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    const nextExercises = [...sessionState.exercises];
    if (nextExercises[exIdx].sets.length <= 1) return;
    nextExercises[exIdx].sets.splice(setIdx, 1);
    syncSessionToStore({ ...sessionState, exercises: nextExercises });
  };

  // Compute live completed sets and volume
  let liveVolume = 0;
  let liveDoneSets = 0;
  let totalSetsCount = 0;

  for (const ex of sessionState.exercises) {
    for (const s of ex.sets) {
      totalSetsCount++;
      if (s.done && s.reps > 0) {
        liveVolume += (s.weightKg || 0) * s.reps;
        liveDoneSets++;
      }
    }
  }

  const completionPct = totalSetsCount > 0 ? Math.round((liveDoneSets / totalSetsCount) * 100) : 0;

  const handleFinish = () => {
    if (liveDoneSets === 0) {
      setFinishError("Cannot finish workout with 0 completed sets.");
      return;
    }

    const finished = {
      ...sessionState,
      finishedAt: new Date().toISOString(),
      totalVolume: liveVolume,
    };

    setState((prev) => {
      const filtered = prev.sessions.filter((s) => s.date !== activeDate);
      return { ...prev, sessions: [...filtered, finished] };
    });

    showToast("Session saved");
    navigate("/");
  };

  if (plannedDay.rest) {
    return (
      <Card className="text-center py-16 space-y-4">
        <span className="text-4xl text-[var(--text-3)] font-mono">☕</span>
        <h2 className="text-xl font-medium text-[var(--text-1)]">Scheduled Rest Day</h2>
        <p className="text-sm text-[var(--text-2)] max-w-sm mx-auto leading-relaxed">
          Muscles synthesize during deep sleep and recovery. Hydrate, hit your protein target, and rest the CNS.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 relative pb-16">
      {/* Printable Workout Sheet for Gym Bag (print-only) */}
      <div className="hidden print-only p-4 font-mono text-black">
        <div className="border-b-2 border-black pb-2 mb-4">
          <h1 className="text-2xl font-bold uppercase">KEPT — {plannedDay.name}</h1>
          <div className="text-sm">
            Date: {formatDisplayDate(activeDate)} · Week {curWeek} · Phase: {curPhase}
          </div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-2">Exercise</th>
              <th>Sets × Reps</th>
              <th>RIR</th>
              <th>Suggested</th>
              <th>Logged (Weight × Reps)</th>
            </tr>
          </thead>
          <tbody>
            {sessionState.exercises.map((ex, i) => (
              <tr key={i} className="border-b border-gray-400">
                <td className="py-3 font-semibold">{ex.name}</td>
                <td>{ex.sets.length} sets</td>
                <td>RIR {ex.rir || 2}</td>
                <td>{ex.suggestion?.weight ? `${ex.suggestion.weight} kg` : "Find wt"}</td>
                <td className="tracking-widest">[   ×   ]  [   ×   ]  [   ×   ]  [   ×   ]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky Session Control Header */}
      <div className="no-print sticky top-14 md:top-11 z-20 bg-[var(--surface-1)]/95 backdrop-blur-md border border-[var(--line)] rounded-[12px] p-4 shadow-[var(--e2)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--accent)] uppercase font-semibold">
                Week {curWeek} of 12 · {curPhase}
              </span>
              <span className="text-xs font-mono text-[var(--text-3)]">·</span>
              <span className="text-xs font-mono text-[var(--text-2)]">{formatDisplayDate(activeDate)}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-[var(--text-1)] mt-0.5">
              {plannedDay.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Print Workout Sheet Button */}
            <IconButton
              onClick={() => window.print()}
              aria-label="Print workout sheet"
              className="hidden sm:inline-flex"
              title="Print Physical Workout Sheet"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" rx="1" />
              </svg>
            </IconButton>

            {/* Elapsed Timer */}
            <div className="font-mono text-xs sm:text-sm text-[var(--text-2)] bg-[var(--surface-2)] px-3 py-1.5 rounded-[8px] border border-[var(--line)] tabular-nums">
              {formatSecondsToTimer(elapsedSeconds)}
            </div>

            {/* Finish Button */}
            <Button variant="primary" size="md" onClick={handleFinish}>
              Finish Workout
            </Button>
          </div>
        </div>

        {/* Live Session Progress Bar & Volume Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--line)]/60 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-3)]">Sets:</span>
            <span className="text-[var(--text-1)] font-medium">
              {liveDoneSets} / {totalSetsCount} ({completionPct}%)
            </span>
            <div className="w-24 sm:w-32 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-3)]">Volume:</span>
            <span className="text-[var(--accent)] font-medium">
              <Odometer value={liveVolume} /> kg
            </span>
          </div>
        </div>
      </div>

      {finishError && (
        <div className="p-3 bg-[var(--danger)]/15 border border-[var(--danger)] rounded-[8px] text-xs text-[var(--danger)] font-mono">
          {finishError}
        </div>
      )}

      {/* Floating Rest Countdown HUD (When rest timer is active) */}
      {restSeconds > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[var(--surface-1)] border border-[var(--accent)] rounded-[16px] px-5 py-3 shadow-[var(--e3)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          {/* Circular Countdown Progress */}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--surface-3)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--accent)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="100.5"
                strokeDashoffset={
                  restTotal > 0 ? (100.5 * (restTotal - restSeconds)) / restTotal : 0
                }
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute text-[10px] font-mono text-[var(--accent)] font-semibold">
              {restSeconds}s
            </span>
          </div>

          <div>
            <div className="text-[10px] font-mono text-[var(--text-3)] uppercase tracking-wider">
              Resting · {lastRestExName || "Set Finished"}
            </div>
            <div className="text-sm font-mono font-medium text-[var(--text-1)] tabular-nums">
              {formatSecondsToTimer(restSeconds)} remaining
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-[var(--line)]">
            <button
              type="button"
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    soundEnabled: !(prev.settings?.soundEnabled ?? false),
                  },
                }));
              }}
              className="px-2 py-1 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] rounded text-[11px] font-mono text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
              title="Toggle audio chime"
            >
              {soundEnabled ? "Sound on" : "Sound off"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRestSeconds((prev) => prev + 30);
                setRestTotal((prev) => prev + 30);
              }}
              className="px-2 py-1 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] rounded text-[11px] font-mono text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
              title="Add 30 seconds rest"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => setRestSeconds(0)}
              className="px-2 py-1 bg-[var(--accent-soft)] hover:bg-[var(--accent)]/20 border border-[var(--accent)]/40 rounded text-[11px] font-mono text-[var(--accent)] transition-colors cursor-pointer"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="no-print space-y-4">
        {sessionState.exercises.map((ex, exIdx) => {
          const suggestion = ex.suggestion || suggestForWeek(ex, state.sessions, curWeek);
          const chipLabel =
            suggestion.reason === "up"
              ? `↑ ${suggestion.weight}`
              : suggestion.reason === "down"
              ? `↓ ${suggestion.weight}`
              : suggestion.reason === "start"
              ? "· start"
              : `= ${suggestion.weight}`;

          // Barbell plate calculation check
          const isBarbellLift = /bench|squat|press|deadlift|row/i.test(ex.name);
          const currentWeight = ex.sets[0]?.weightKg || 20;
          const plateBreakdown = isBarbellLift ? getBarbellPlates(currentWeight) : null;
          const isPlateCalcOpen = activePlateCalcExId === ex.exerciseId;

          return (
            <Card key={ex.exerciseId} className="space-y-4">
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
                <div className="flex items-center flex-wrap gap-2.5">
                  <h3 className="text-[15px] font-medium text-[var(--text-1)]">{ex.name}</h3>
                  <Chip
                    variant={suggestion.reason === "up" ? "accent" : "neutral"}
                    title={
                      suggestion.reason === "up"
                        ? "Target reps achieved across all sets. Adding increment."
                        : suggestion.reason === "down"
                        ? "Bottom rep range missed in last 2 sessions. Reduced weight by 10%."
                        : suggestion.reason === "start"
                        ? "Starting weight"
                        : "Maintaining weight"
                    }
                  >
                    {chipLabel}
                  </Chip>

                  {/* Warmup Ramp Protocol Trigger */}
                  {isBarbellLift && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveWarmupExId(activeWarmupExId === ex.exerciseId ? null : ex.exerciseId)
                      }
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--line)] transition-colors cursor-pointer"
                      title="Toggle warmup ramp protocol"
                    >
                      {activeWarmupExId === ex.exerciseId ? "Hide Warmup" : "⚡ Warmup"}
                    </button>
                  )}

                  {/* Barbell Plate Calculator Trigger */}
                  {plateBreakdown && (
                    <button
                      type="button"
                      onClick={() =>
                        setActivePlateCalcExId(isPlateCalcOpen ? null : ex.exerciseId)
                      }
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--line)] transition-colors cursor-pointer"
                      title="Toggle barbell plate calculator"
                    >
                      {isPlateCalcOpen ? "Hide Plates" : "🪪 Plates"}
                    </button>
                  )}
                </div>

                <span className="text-xs font-mono text-[var(--text-2)]">
                  {ex.sets.length} sets · RIR {ex.rir ?? 2}
                </span>
              </div>

              {/* Warmup Ramp Protocol Drawer */}
              {activeWarmupExId === ex.exerciseId && isBarbellLift && (
                <WarmupCalculator
                  exerciseName={ex.name}
                  targetWeightKg={currentWeight}
                />
              )}

              {/* Barbell Plate Loading Breakdown Drawer with 3D Visualizer */}
              {isPlateCalcOpen && plateBreakdown && (
                <Barbell3D weightKg={currentWeight} />
              )}

              {ex.note && <p className="text-xs text-[var(--text-3)] font-mono">{ex.note}</p>}

              {/* Set Rows Header */}
              <div className="grid grid-cols-[44px_1fr_1fr_44px] gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] text-center px-1">
                <span>Set</span>
                <span>Kg</span>
                <span>Reps</span>
                <span>Done</span>
              </div>

              {/* Sets List */}
              <div className="space-y-2">
                {ex.sets.map((set, setIdx) => {
                  const setKey = `${exIdx}-${setIdx}`;
                  const isJustChecked = lastCheckedKey === setKey;

                  return (
                    <div
                      key={setIdx}
                      className={`grid grid-cols-[44px_1fr_1fr_44px] gap-2 items-center p-1 rounded-[8px] transition-all duration-140 ${
                        isJustChecked
                          ? "set-row-checked"
                          : set.done
                          ? "bg-[var(--accent-soft)]/20"
                          : "hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      {/* Set Number & Remove */}
                      <div className="relative group flex items-center justify-center font-mono text-xs text-[var(--text-2)]">
                        <span>{setIdx + 1}</span>
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="absolute inset-0 bg-[var(--surface-3)] text-[var(--text-3)] hover:text-[var(--danger)] rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            title="Remove set"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Weight Stepper */}
                      <Stepper
                        step={0.5}
                        min={0}
                        max={500}
                        value={set.weightKg}
                        onChange={(v) => handleSetChange(exIdx, setIdx, "weightKg", v)}
                      />

                      {/* Reps Stepper */}
                      <Stepper
                        step={1}
                        min={0}
                        max={50}
                        value={set.reps || ""}
                        placeholder="0"
                        onChange={(v) => handleSetChange(exIdx, setIdx, "reps", v)}
                      />

                      {/* Checkbox with micro-haptic and pulse */}
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={set.done}
                          onChange={(done) => handleCheckSet(exIdx, setIdx, done)}
                          aria-label={`Mark set ${setIdx + 1} done`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Set Button */}
              <div className="pt-2">
                <Button variant="ghost" size="md" onClick={() => handleAddSet(exIdx)}>
                  + Add Set
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Session Notes */}
      <Card className="no-print space-y-2">
        <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--text-3)]">
          Session Notes
        </label>
        <textarea
          rows={3}
          value={sessionState.notes || ""}
          onChange={(e) => syncSessionToStore({ ...sessionState, notes: e.target.value })}
          placeholder="RPE, energy level, bar speed, rack settings..."
          className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] p-3 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[var(--accent)] resize-y font-mono text-xs"
        />
      </Card>
    </div>
  );
}
