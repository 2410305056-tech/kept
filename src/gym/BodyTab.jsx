import React, { useState } from "react";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Stepper } from "../components/ui/Stepper.jsx";
import { LineChart } from "../components/charts/LineChart.jsx";
import { PanelBoundary } from "../components/ui/ErrorBoundary.jsx";
import { Stat } from "../components/ui/Stat.jsx";
import { formatDisplayDate, weekdayIndex } from "../lib/dates.js";

export function BodyTab() {
  const [state, setState] = useStore();
  const { today } = useNow();

  const isMonday = weekdayIndex(today) === 0;

  const [weightKg, setWeightKg] = useState(65);
  const [waistCm, setWaistCm] = useState("");

  const sortedLogs = [...state.bodyLogs].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate rate of weight gain (kg / week)
  let gainRate = null;
  let verdict = "Weigh in weekly to track calorie calibration";
  if (sortedLogs.length >= 2) {
    const last = sortedLogs[sortedLogs.length - 1];
    const prev = sortedLogs[sortedLogs.length - 2];
    const daysDiff = Math.max(1, Math.round((new Date(last.date) - new Date(prev.date)) / 86400000));
    const weeklyRate = ((last.weightKg - prev.weightKg) / daysDiff) * 7;
    gainRate = Number(weeklyRate.toFixed(2));

    if (gainRate < 0.25) verdict = "Rate < 0.25 kg/wk: add ~200–250 kcal";
    else if (gainRate <= 0.4) verdict = "Rate 0.25–0.4 kg/wk: on track";
    else verdict = "Rate > 0.4 kg/wk: hold calories";
  }

  // Summary figures
  const initialWeight = sortedLogs[0]?.weightKg ?? 65;
  const currentWeight = sortedLogs[sortedLogs.length - 1]?.weightKg ?? 65;
  const netDelta = Number((currentWeight - initialWeight).toFixed(1));
  const toTargetBand = Math.max(0, Number((68.0 - currentWeight).toFixed(1)));

  const handleSaveWeighIn = () => {
    if (!weightKg) return;

    const newLog = {
      date: today,
      weightKg: Number(weightKg),
      waistCm: waistCm ? Number(waistCm) : null,
    };

    setState((prev) => {
      const filtered = prev.bodyLogs.filter((b) => b.date !== today);
      return {
        ...prev,
        bodyLogs: [...filtered, newLog],
      };
    });
  };

  const chartData = sortedLogs.map((b) => ({
    x: formatDisplayDate(b.date),
    y: b.weightKg,
    label: `${b.weightKg} kg`,
  }));

  return (
    <div className="space-y-6">
      {/* Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <Stat label="Current Weight" value={`${currentWeight} kg`} />
        </Card>
        <Card className="p-3.5">
          <Stat
            label="Net Change"
            value={netDelta >= 0 ? `+${netDelta} kg` : `${netDelta} kg`}
          />
        </Card>
        <Card className="p-3.5">
          <Stat
            label="Weekly Rate"
            value={gainRate != null ? `${gainRate > 0 ? "+" : ""}${gainRate} kg/wk` : "—"}
          />
        </Card>
        <Card className="p-3.5">
          <Stat
            label="To Target Band"
            value={toTargetBand > 0 ? `${toTargetBand} kg to 68kg` : "In Band ✓"}
          />
        </Card>
      </div>

      {/* Weigh-in Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--accent)] uppercase font-semibold">
                Weigh-In
              </span>
              {isMonday && (
                <span className="px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-mono rounded">
                  Monday Prompt
                </span>
              )}
            </div>
            <h3 className="text-base font-medium text-[var(--text-1)] mt-0.5">
              Record Measurements
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-3)]">{formatDisplayDate(today)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-mono uppercase text-[var(--text-3)] block mb-1">
              Body Weight (kg) *
            </label>
            <Stepper
              step={0.1}
              min={40}
              max={150}
              value={weightKg}
              onChange={(v) => setWeightKg(v || 65)}
              unit="kg"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-[var(--text-3)] block mb-1">
              Waist (cm, bi-weekly navel)
            </label>
            <Stepper
              step={0.5}
              min={50}
              max={150}
              value={waistCm}
              placeholder="Optional"
              onChange={(v) => setWaistCm(v)}
              unit="cm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={handleSaveWeighIn}>
            Save Weigh-In
          </Button>
        </div>
      </Card>

      {/* Weight Chart & Verdict */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-mono">
              Weight Trajectory (Target: 68–69.5 kg)
            </h3>
            <p className="text-xs font-mono text-[var(--text-2)] mt-1">{verdict}</p>
          </div>
          {gainRate != null && (
            <span className="text-xs font-mono text-[var(--accent)]">
              {gainRate > 0 ? `+${gainRate}` : gainRate} kg/week
            </span>
          )}
        </div>

        <PanelBoundary>
          <LineChart
            data={chartData}
            targetBand={[68, 69.5]}
            height={180}
            emptyMessage="Record 2 weigh-ins to plot trajectory"
            unit="kg"
          />
        </PanelBoundary>
      </Card>
    </div>
  );
}
