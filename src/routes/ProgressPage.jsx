import React, { useState, useContext } from "react";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { useTilt } from "../hooks/useTilt.js";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { weekNumber, phaseForWeek } from "../lib/logic.js";
import { exportData, validateImportData } from "../lib/exportImport.js";
import { resetToSeed, replaceState } from "../lib/store.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Checkbox } from "../components/ui/Checkbox.jsx";
import { Input } from "../components/ui/Input.jsx";
import { BarChart } from "../components/charts/BarChart.jsx";
import { Heatmap } from "../components/charts/Heatmap.jsx";
import { PanelBoundary } from "../components/ui/ErrorBoundary.jsx";
import { ToastContext } from "../context/ToastContext.js";

export function ProgressPage() {
  const [state, setState] = useStore();
  const { today } = useNow();
  const reduced = useReducedMotion();
  const tilt = useTilt(5);
  const { showToast } = useContext(ToastContext);

  const curWeek = weekNumber(state.plan, today);

  // Clear data double confirmation state
  const [clearInput, setClearInput] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Import state
  const [importSummary, setImportSummary] = useState(null);
  const [pendingImportData, setPendingImportData] = useState(null);

  const handleExport = () => {
    exportData(state);
    showToast("Data exported successfully");
  };

  // Obsidian / Local Markdown Ledger Exporter
  const handleCopyMarkdownLedger = () => {
    const totalVolume = state.sessions?.reduce((acc, s) => acc + (s.totalVolume || 0), 0) || 0;
    const totalRuns = state.runs?.length || 0;
    const totalKm = state.runs?.reduce((acc, r) => acc + (r.km || 0), 0) || 0;
    const totalStudyHours = ((state.studySessions?.reduce((acc, s) => acc + (s.minutes || 0), 0) || 0) / 60).toFixed(1);
    const cleanDays = state.cleanLog?.filter((c) => c.status === "clean")?.length || 0;

    const md = `---
title: Kept Training Ledger
cycle: 1
exported_at: ${new Date().toISOString()}
total_workouts: ${state.sessions?.length || 0}
total_tonnage_kg: ${totalVolume}
total_running_km: ${totalKm.toFixed(1)}
total_study_hours: ${totalStudyHours}
clean_days: ${cleanDays}
---

# Kept · 12-Week Private Training Ledger

## 1. Executive Summary
- **Workouts Logged:** ${state.sessions?.length || 0} sessions
- **Lifetime Tonnage Moved:** ${totalVolume.toLocaleString()} kg (${(totalVolume / 1000).toFixed(2)} metric tons)
- **Deep Cognitive Focus:** ${totalStudyHours} hours
- **Clean Living Consistency:** ${cleanDays} clean marks recorded
- **Running Distance:** ${totalKm.toFixed(1)} km across ${totalRuns} runs

## 2. Recent Workout Ledger
${state.sessions?.slice(-10)?.reverse()?.map((s) => `- **${s.date}** (${s.dayName}): ${s.totalVolume} kg volume across ${s.exercises?.length || 0} exercises`).join("\n") || "No sessions logged"}

## 3. Cognitive Sessions
${state.studySessions?.slice(-10)?.reverse()?.map((s) => `- **${s.date}**: ${s.minutes} mins [${s.tag || "#focus"}]`).join("\n") || "No study logged"}
`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(md).then(() => {
        showToast("Obsidian Markdown Ledger copied to clipboard!");
      });
    } else {
      showToast("Clipboard access unavailable in this context.");
    }
  };


  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        const res = validateImportData(parsed);
        if (!res.valid) {
          showToast(`Import error: ${res.error}`);
          return;
        }
        setImportSummary(res.summary);
        setPendingImportData(res.data);
      } catch (err) {
        showToast("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = () => {
    if (!pendingImportData) return;
    replaceState(pendingImportData);
    setPendingImportData(null);
    setImportSummary(null);
    showToast("Import restored successfully");
  };

  const handleClear = () => {
    if (clearInput !== "CLEAR") return;
    resetToSeed();
    setShowClearConfirm(false);
    setClearInput("");
    showToast("Database cleared and reset to seed plan");
  };

  // Reduce Motion Toggle (Correction #5)
  const handleToggleReducedMotion = (enabled) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, reduceMotion: enabled },
    }));
  };

  // 12 Weeks Calculations for 2x2 Charts
  const weeklySessions = Array.from({ length: 12 }, (_, i) => {
    const w = i + 1;
    const count = (state.sessions || []).filter((s) => s.week === w).length;
    return { label: `W${w}`, value: count, display: `${count} workouts` };
  });

  const weeklyStudy = Array.from({ length: 12 }, (_, i) => {
    const w = i + 1;
    // Map study sessions by week
    const mins = (state.studySessions || [])
      .filter((s) => weekNumber(state.plan, s.date) === w)
      .reduce((acc, s) => acc + (s.minutes || 0), 0);
    const hrs = Number((mins / 60).toFixed(1));
    return { label: `W${w}`, value: hrs, display: `${hrs} hrs` };
  });

  const weeklyClean = Array.from({ length: 12 }, (_, i) => {
    const w = i + 1;
    const cleanDays = (state.cleanLog || []).filter(
      (c) => weekNumber(state.plan, c.date) === w && c.status === "clean"
    ).length;
    const pct = Math.round((cleanDays / 7) * 100);
    return { label: `W${w}`, value: pct, display: `${pct}%` };
  });

  const weeklyRuns = Array.from({ length: 12 }, (_, i) => {
    const w = i + 1;
    const km = (state.runs || [])
      .filter((r) => weekNumber(state.plan, r.date) === w)
      .reduce((acc, r) => acc + (r.km || 0), 0);
    return { label: `W${w}`, value: km, display: `${km} km` };
  });

  // Year Heatmap: 4 rows (Gym, Run, Study, Clean)
  const allDaysYear = [];
  const startPlanDate = new Date(state.plan.startDate);
  for (let i = 0; i < 84; i++) {
    // 12 weeks = 84 days
    const d = new Date(startPlanDate);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    allDaysYear.push(key);
  }

  const heatmapRows = [
    {
      label: "Gym",
      days: allDaysYear.map((d) => ({
        date: d,
        active: state.sessions?.some((s) => s.date === d),
      })),
    },
    {
      label: "Run",
      days: allDaysYear.map((d) => ({
        date: d,
        active: state.runs?.some((r) => r.date === d),
      })),
    },
    {
      label: "Study",
      days: allDaysYear.map((d) => ({
        date: d,
        active: state.studySessions?.some((s) => s.date === d),
      })),
    },
    {
      label: "Clean",
      days: allDaysYear.map((d) => {
        const entry = state.cleanLog?.find((c) => c.date === d);
        return {
          date: d,
          active: entry?.status === "clean",
          slip: entry?.status === "slip",
        };
      }),
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Week Tablets in 3D Perspective Continuum */}
      <Card tilt={true} maxTilt={3} className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)]/60 pb-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            12-Week Continuum · 3D Spatial Progression
          </h3>
          <span className="text-xs font-mono text-[var(--accent)]">
            Week {curWeek} of 12 Active
          </span>
        </div>

        <div
          ref={tilt.ref}
          style={{ ...tilt.style, perspective: "1200px" }}
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          className="depth grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 py-4"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const w = i + 1;
            const isCurrent = w === curWeek;
            const isPast = w < curWeek;
            const isFuture = w > curWeek;
            const phase = phaseForWeek(w);

            const zDepth = isCurrent ? 36 : isPast ? 14 : 0;
            const elevationShadow = isCurrent
              ? "0 16px 28px -6px rgba(0,0,0,0.8), 0 0 16px rgba(200,246,92,0.22), inset 0 1px 0 rgba(255,255,255,0.18)"
              : isPast
              ? "0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "none";

            return (
              <div
                key={w}
                style={{
                  transform: `translateZ(${zDepth}px)`,
                  boxShadow: elevationShadow,
                }}
                className={`p-3.5 rounded-[10px] border text-center transition-all duration-200 select-none cursor-pointer group hover:-translate-y-1 hover:!transform hover:!scale-105 ${
                  isCurrent
                    ? "bg-[var(--surface-2)] border-[var(--accent)] shadow-[var(--e3)] z-10"
                    : isPast
                    ? "bg-[var(--surface-1)] border-[var(--line-strong)] opacity-85 hover:opacity-100"
                    : "bg-transparent border border-dashed border-[var(--line)] opacity-35 hover:opacity-70"
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-[var(--text-3)] block leading-none font-medium">
                  {phase}
                </span>
                <span
                  className={`text-lg font-mono font-bold mt-1.5 block tracking-tight ${
                    isCurrent ? "text-[var(--accent)] drop-shadow-[0_0_8px_rgba(200,246,92,0.4)]" : "text-[var(--text-1)]"
                  }`}
                >
                  W{w}
                </span>
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mx-auto mt-2 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. 2×2 Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Gym Workouts / Week
          </h4>
          <PanelBoundary>
            <BarChart data={weeklySessions} height={140} unit="workouts" />
          </PanelBoundary>
        </Card>

        <Card className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Study Hours / Week
          </h4>
          <PanelBoundary>
            <BarChart data={weeklyStudy} height={140} unit="hrs" />
          </PanelBoundary>
        </Card>

        <Card className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Clean Consistency (%)
          </h4>
          <PanelBoundary>
            <BarChart data={weeklyClean} height={140} unit="%" />
          </PanelBoundary>
        </Card>

        <Card className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Running Distance (km)
          </h4>
          <PanelBoundary>
            <BarChart data={weeklyRuns} height={140} unit="km" />
          </PanelBoundary>
        </Card>
      </div>

      {/* 3. 12-Week 4-Pillar Heatmap */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Pillar Matrix (12 Weeks)
          </h3>
          <span className="text-xs font-mono text-[var(--text-3)]">84 Days</span>
        </div>
        <PanelBoundary>
          <Heatmap rows={heatmapRows} cellSize={11} gap={3} />
        </PanelBoundary>
      </Card>

      {/* 4. Data & Preferences Management */}
      <Card className="space-y-6">
        <h3 className="text-sm font-medium text-[var(--text-1)]">Data & Preferences</h3>

        {/* Reduce Motion Setting (Correction #5) */}
        <div className="flex items-center justify-between p-3.5 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)]">
          <div>
            <span className="text-xs font-mono text-[var(--text-1)] font-medium block">
              Reduce Motion
            </span>
            <span className="text-[11px] text-[var(--text-3)] font-mono">
              Disable 3D tilt, spring FLIP, and digit roll animations.
            </span>
          </div>
          <Checkbox
            checked={Boolean(state.settings?.reduceMotion)}
            onChange={handleToggleReducedMotion}
            aria-label="Toggle reduced motion"
          />
        </div>

        {/* Backup / Export / Import */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] space-y-2">
            <h4 className="text-xs font-mono uppercase text-[var(--text-2)]">Export Local Backup</h4>
            <p className="text-xs text-[var(--text-3)]">
              Download your entire dataset as pretty-printed JSON file.
            </p>
            <div className="pt-2">
              <Button variant="ghost" size="md" onClick={handleExport}>
                Export JSON
              </Button>
            </div>
          </div>

          <div className="p-4 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] space-y-2">
            <h4 className="text-xs font-mono uppercase text-[var(--text-2)]">Restore Backup</h4>
            <p className="text-xs text-[var(--text-3)]">
              Import a valid Kept backup file (deep-equal state verification).
            </p>
            <div className="pt-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center h-11 px-4 text-[13px] font-medium tracking-[0.04em] rounded-[10px] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)] transition-colors">
                  Choose JSON File
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Pending Import Modal / Confirmation */}
        {importSummary && (
          <div className="p-4 bg-[var(--accent-soft)] border border-[var(--accent)] rounded-[8px] space-y-3">
            <h4 className="text-xs font-mono uppercase text-[var(--accent)] font-semibold">
              Confirm Backup Restoration
            </h4>
            <div className="text-xs font-mono text-[var(--text-1)] space-y-1">
              <div>Sessions: {importSummary.sessions}</div>
              <div>Study Sessions: {importSummary.studySessions}</div>
              <div>Clean Days: {importSummary.cleanDays}</div>
              <div>Runs: {importSummary.runs}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setImportSummary(null);
                  setPendingImportData(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={confirmImport}>
                Replace State
              </Button>
            </div>
          </div>
        )}

        {/* Clear Data (Type CLEAR) */}
        <div className="p-4 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] space-y-3">
          <h4 className="text-xs font-mono uppercase text-[var(--danger)]">
            Reset All Application Data
          </h4>
          <p className="text-xs text-[var(--text-3)]">
            This permanently deletes all logged sessions, study hours, habits, and runs, restoring the original empty plan.
          </p>

          {!showClearConfirm ? (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowClearConfirm(true)}
              className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/10"
            >
              Clear Data...
            </Button>
          ) : (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono text-[var(--text-2)] block">
                Type <strong className="text-[var(--text-1)]">CLEAR</strong> to confirm:
              </span>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="text"
                  value={clearInput}
                  onChange={(e) => setClearInput(e.target.value)}
                  placeholder="CLEAR"
                  className="h-11 px-3 bg-[var(--surface-1)] border border-[var(--line)] text-sm font-mono text-[var(--text-1)] rounded-[8px] outline-none focus:border-[var(--danger)]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setShowClearConfirm(false);
                      setClearInput("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={clearInput !== "CLEAR"}
                    onClick={handleClear}
                    className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                  >
                    Confirm Permanent Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
