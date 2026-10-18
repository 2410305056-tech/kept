import React from "react";
import { useStore } from "../hooks/useStore.js";
import { Card } from "../components/ui/Card.jsx";
import { Sparkline } from "../components/charts/Sparkline.jsx";
import { PanelBoundary } from "../components/ui/ErrorBoundary.jsx";

const TARGETS = [
  { key: "weight", label: "Body Weight", target: "68–69.5 kg", min: 65, max: 69.5 },
  { key: "dbBench", label: "DB Bench", target: "30–32.5 kg × 3 × 10", min: 15, max: 32.5 },
  { key: "squat", label: "Barbell Squat", target: "60–70 kg × 3 × 8", min: 20, max: 70 },
  { key: "deadlift", label: "Deadlift", target: "115–120 kg × 3 × 5", min: 50, max: 120 },
  { key: "ohp", label: "Overhead Press", target: "35–40 kg × 3 × 8", min: 20, max: 40 },
  { key: "legPress", label: "Leg Press", target: "≥ 150 kg × 3 × 12", min: 100, max: 150 },
  { key: "chinUp", label: "First Chin-Up", target: "1 rep", min: 0, max: 1 },
];

export function GymProgress() {
  const [state] = useStore();

  // Extract all unique exercises from the plan and past sessions
  const exerciseMap = new Map();
  for (const day of state.plan.split) {
    for (const ex of day.exercises) {
      if (!exerciseMap.has(ex.id)) {
        exerciseMap.set(ex.id, { id: ex.id, name: ex.name, history: [] });
      }
    }
  }

  // Populate history from sessions
  const sortedSessions = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));
  for (const s of sortedSessions) {
    for (const ex of s.exercises) {
      if (exerciseMap.has(ex.exerciseId)) {
        const doneSets = ex.sets?.filter((x) => x.done && x.reps > 0) || [];
        if (doneSets.length > 0) {
          const maxWeight = Math.max(...doneSets.map((x) => x.weightKg));
          const bestSet = doneSets.reduce((prev, cur) =>
            cur.weightKg * cur.reps > prev.weightKg * prev.reps ? cur : prev
          );
          exerciseMap.get(ex.exerciseId).history.push({
            date: s.date,
            maxWeight,
            bestSet,
          });
        }
      }
    }
  }

  const exerciseList = Array.from(exerciseMap.values());

  // Get current body weight
  const latestWeight =
    state.bodyLogs.length > 0
      ? [...state.bodyLogs].sort((a, b) => a.date.localeCompare(b.date))[state.bodyLogs.length - 1].weightKg
      : state.profile.startWeightKg;

  return (
    <div className="space-y-6">
      {/* Target Progress Bars */}
      <Card className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-mono">
          Cycle Targets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TARGETS.map((t) => {
            let cur = 0;
            if (t.key === "weight") cur = latestWeight;
            else if (t.key === "chinUp") cur = 0;
            else {
              // match exercise name
              const ex = exerciseList.find((e) =>
                e.name.toLowerCase().includes(t.key.toLowerCase()) ||
                (t.key === "dbBench" && e.name.toLowerCase().includes("incline dumbbell press")) ||
                (t.key === "ohp" && e.name.toLowerCase().includes("overhead press")) ||
                (t.key === "squat" && e.name.toLowerCase().includes("squat")) ||
                (t.key === "deadlift" && e.name.toLowerCase().includes("deadlift")) ||
                (t.key === "legPress" && e.name.toLowerCase().includes("leg press"))
              );
              const lastHist = ex?.history[ex.history.length - 1];
              cur = lastHist ? lastHist.maxWeight : t.min;
            }

            const pct = Math.min(100, Math.max(0, Math.round(((cur - t.min) / (t.max - t.min)) * 100)));

            return (
              <div key={t.key} className="p-3 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-1)] font-medium">{t.label}</span>
                  <span className="text-[var(--text-3)]">{t.target}</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-3)]">
                  <span>Current: {cur}</span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Per-Exercise History Cards */}
      <Card className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-mono">
          Exercise Progression
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exerciseList.map((ex) => {
            const hist = ex.history.slice(-6);
            const sparkData = hist.map((h) => h.maxWeight);
            const lastSession = hist[hist.length - 1];

            return (
              <div
                key={ex.id}
                className="p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] flex items-center justify-between gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[var(--text-1)] truncate">
                    {ex.name}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-3)] mt-0.5">
                    {lastSession
                      ? `Working: ${lastSession.maxWeight} kg · Best: ${lastSession.bestSet?.weightKg}×${lastSession.bestSet?.reps}`
                      : "No recorded sets"}
                  </span>
                </div>

                <div className="shrink-0">
                  <PanelBoundary>
                    <Sparkline data={sparkData} width={80} height={24} />
                  </PanelBoundary>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
