import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { sound } from "../lib/audio.js";
import { runningUnlocked } from "../lib/logic.js";
import { formatPace, formatMinutes, formatDisplayDate } from "../lib/format.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Stepper } from "../components/ui/Stepper.jsx";
import { BarChart } from "../components/charts/BarChart.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { PanelBoundary } from "../components/ui/ErrorBoundary.jsx";

export function RunningPage() {
  const [state, setState] = useStore();
  const { today } = useNow();

  const isUnlocked = runningUnlocked(state.bodyLogs || [], today);

  // Form fields for logging a run
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(25);
  const [km, setKm] = useState(3.5);

  // Cadence Metronome State (165 to 185 BPM)
  const [metronomeBpm, setMetronomeBpm] = useState(172);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const metronomeRef = useRef(null);

  useEffect(() => {
    if (!isMetronomeActive) {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
      return;
    }

    const intervalMs = (60 / metronomeBpm) * 1000;
    let tickCount = 0;

    metronomeRef.current = setInterval(() => {
      sound.playMetronomeTick(tickCount % 4 === 0);
      tickCount++;
    }, intervalMs);

    return () => clearInterval(metronomeRef.current);
  }, [isMetronomeActive, metronomeBpm]);

  const calculatedPace = formatPace(minutes, km);
  const speedKmh = km > 0 && minutes > 0 ? ((km / minutes) * 60).toFixed(1) : "0.0";
  const projected5kMins = km > 0 && minutes > 0 ? Math.round((minutes / km) * 5) : 0;
  const projected10kMins = km > 0 && minutes > 0 ? Math.round((minutes / km) * 10) : 0;

  const handleAddRun = () => {
    if (!minutes || minutes <= 0) return;

    const newRun = {
      id: crypto.randomUUID(),
      date,
      minutes: Number(minutes),
      km: km ? Number(km) : 0,
    };

    setState((prev) => ({
      ...prev,
      runs: [...(prev.runs || []), newRun],
    }));
  };

  const runs = state.runs || [];
  const sortedRuns = [...runs].sort((a, b) => b.date.localeCompare(a.date));

  // Running Shoes Mileage Math (500 km replacement threshold)
  const totalLifetimeKm = runs.reduce((acc, r) => acc + (r.km || 0), 0);
  const shoeLimitKm = 500;
  const shoeWearPct = Math.min(100, Math.round((totalLifetimeKm / shoeLimitKm) * 100));

  // Weekly runs bar chart
  const weeklyData = sortedRuns.slice(0, 10).reverse().map((r) => ({
    label: formatDisplayDate(r.date),
    value: r.km || 0,
    display: `${r.km} km (${formatMinutes(r.minutes)})`,
  }));

  // Countdown to Nov 16, 2026
  const targetUnlockDate = new Date("2026-11-16");
  const todayDate = new Date(today);
  const daysUntilUnlock = Math.max(0, Math.ceil((targetUnlockDate - todayDate) / 86400000));
  const planStartDate = new Date("2026-10-19");
  const totalDays = Math.ceil((targetUnlockDate - planStartDate) / 86400000);
  const countdownPct = Math.min(100, Math.max(0, Math.round(((totalDays - daysUntilUnlock) / totalDays) * 100)));

  return (
    <div className="space-y-6">
      {/* Locked Status Banner */}
      {!isUnlocked && (
        <Card className="border-[var(--line-strong)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)] font-semibold">
                Anabolic Protection Protocol
              </span>
              <h2 className="text-lg font-medium text-[var(--text-1)]">
                Running is Locked until Week 5
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-[6px]">
              {daysUntilUnlock} Days Until Unlock
            </span>
          </div>

          <p className="text-xs font-mono text-[var(--text-2)] leading-relaxed">
            Running introduces systemic cardiovascular and joint fatigue that competes with myofibrillar protein synthesis during the Week 1–4 Foundation Phase. Running unlocks on <strong>16 Nov 2026</strong> provided body weight has climbed above the 66.8 kg baseline.
          </p>

          <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${countdownPct}%` }}
            />
          </div>
        </Card>
      )}

      {/* Cadence Metronome & Shoe Mileage Odometer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audio Cadence Metronome */}
        <Card tilt={true} className="space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold">
              Stride Frequency Metronome
            </span>
            <span className="text-xs text-[var(--text-2)]">{metronomeBpm} BPM</span>
          </div>

          <p className="text-xs text-[var(--text-3)] leading-relaxed">
            A cadence of 170–180 steps/min minimizes heel striking, lowers ground contact time, and protects the patellar tendon.
          </p>

          <div className="flex items-center justify-between pt-1">
            <Stepper
              label="Cadence"
              value={metronomeBpm}
              step={2}
              min={150}
              max={200}
              unit="BPM"
              onChange={(val) => setMetronomeBpm(val)}
            />

            <Button
              variant={isMetronomeActive ? "danger" : "primary"}
              size="md"
              onClick={() => setIsMetronomeActive((prev) => !prev)}
              className="keycap"
            >
              {isMetronomeActive ? "Stop Click" : "Start Cadence"}
            </Button>
          </div>
        </Card>

        {/* Shoe Wear Odometer */}
        <Card tilt={true} className="space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold">
              Shoe Mileage Ledger
            </span>
            <span className="text-xs text-[var(--text-2)]">{totalLifetimeKm.toFixed(1)} / {shoeLimitKm} km</span>
          </div>

          <p className="text-xs text-[var(--text-3)] leading-relaxed">
            Midsole EVA foam degrades after 500 km, increasing shock transfer to the tibia. Track accumulated wear below.
          </p>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-[var(--text-2)]">
              <span>Primary Road Trainers:</span>
              <span className="text-[var(--accent)] font-semibold">{shoeWearPct}% Wear</span>
            </div>
            <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  shoeWearPct > 80 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
                }`}
                style={{ width: `${shoeWearPct}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Manual Run Log Form */}
      <Card className="space-y-4 font-mono">
        <h3 className="text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
          Record Running Session
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Stepper
            label="Distance"
            value={km}
            step={0.5}
            min={0.5}
            max={42}
            unit="km"
            onChange={(val) => setKm(val)}
          />

          <Stepper
            label="Duration"
            value={minutes}
            step={1}
            min={1}
            max={300}
            unit="mins"
            onChange={(val) => setMinutes(val)}
          />
        </div>

        {/* Pace & Split Projections */}
        <div className="p-3 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[var(--text-3)]">Pace: </span>
            <span className="text-[var(--accent)] font-semibold">{calculatedPace}</span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Speed: </span>
            <span className="text-[var(--text-1)] font-medium">{speedKmh} km/h</span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Est. 5K: </span>
            <span className="text-[var(--text-1)] font-medium">{projected5kMins}m</span>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="primary" size="md" onClick={handleAddRun} className="keycap">
            Save Run
          </Button>
        </div>
      </Card>

      {/* History */}
      {runs.length > 0 && (
        <Card className="space-y-3 font-mono">
          <h3 className="text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
            Past Runs (10 Sessions)
          </h3>
          <PanelBoundary>
            <BarChart data={weeklyData} height={130} unit="km" />
          </PanelBoundary>
        </Card>
      )}
    </div>
  );
}
