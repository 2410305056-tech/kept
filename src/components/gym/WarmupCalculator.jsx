import React, { useState } from "react";

function getBarbellPlatesList(weightKg) {
  if (weightKg < 20) return [];
  const perSide = (weightKg - 20) / 2;
  if (perSide <= 0) return [];
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  let rem = Math.round(perSide * 100) / 100;
  const plates = [];
  for (const p of availablePlates) {
    while (rem >= p - 0.01) {
      plates.push(p);
      rem = Math.round((rem - p) * 100) / 100;
    }
  }
  return plates;
}

export function WarmupCalculator({ exerciseName, targetWeightKg }) {
  const [completedSteps, setCompletedSteps] = useState({});

  if (targetWeightKg <= 20) {
    return (
      <div className="p-3 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] text-xs font-mono text-[var(--text-3)]">
        Working weight is 20 kg (empty bar). Ramp-up sets not required.
      </div>
    );
  }

  const round2_5 = (val) => Math.max(20, Math.round(val / 2.5) * 2.5);

  const steps = [
    { label: "Empty Bar", weight: 20, reps: 10, pct: "Bar" },
    { label: "Ramp 1", weight: round2_5(targetWeightKg * 0.5), reps: 5, pct: "50%" },
    { label: "Ramp 2", weight: round2_5(targetWeightKg * 0.7), reps: 3, pct: "70%" },
    { label: "Ramp 3", weight: round2_5(targetWeightKg * 0.85), reps: 1, pct: "85%" },
  ];

  const uniqueSteps = [];
  const seenWeights = new Set();
  for (const s of steps) {
    if (!seenWeights.has(s.weight) && s.weight < targetWeightKg) {
      seenWeights.add(s.weight);
      uniqueSteps.push(s);
    }
  }

  const toggleStep = (idx) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[10px] space-y-3 font-mono text-xs animate-in fade-in duration-140">
      <div className="flex items-center justify-between border-b border-[var(--line)]/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)] font-semibold uppercase tracking-wider text-[11px]">
            Warm-Up Ramp Protocol
          </span>
          <span className="text-[var(--text-3)]">→</span>
          <span className="text-[var(--text-2)]">{targetWeightKg} kg Working Sets</span>
        </div>
        <span className="text-[10px] text-[var(--text-3)]">
          {Object.values(completedSteps).filter(Boolean).length} / {uniqueSteps.length} ready
        </span>
      </div>

      <div className="space-y-1.5">
        {uniqueSteps.map((step, idx) => {
          const isDone = !!completedSteps[idx];
          const plates = getBarbellPlatesList(step.weight);
          const platesStr = plates.length > 0 ? `${plates.join(" + ")} kg/side` : "Bar only";

          return (
            <div
              key={idx}
              onClick={() => toggleStep(idx)}
              className={`flex items-center justify-between p-2 rounded-[6px] border transition-all cursor-pointer select-none ${
                isDone
                  ? "bg-[var(--accent-soft)]/20 border-[var(--accent)]/40 text-[var(--text-1)]"
                  : "bg-[var(--surface-1)] border-[var(--line)] text-[var(--text-2)] hover:border-[var(--line-strong)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}}
                  className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-[var(--text-1)]">{step.weight} kg</span>
                  <span className="text-[var(--text-3)] ml-2">× {step.reps} reps</span>
                  <span className="text-[10px] text-[var(--accent)]/80 ml-2">({step.pct})</span>
                </div>
              </div>

              <div className="text-[11px] text-[var(--text-3)] font-medium">
                {platesStr}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--text-3)] leading-relaxed">
        Ramp sets prime the central nervous system without accumulating metabolic fatigue. Rest 60s between ramps.
      </p>
    </div>
  );
}
