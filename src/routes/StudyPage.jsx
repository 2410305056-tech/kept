import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { sound } from "../lib/audio.js";
import { formatMinutes, formatSecondsToTimer } from "../lib/format.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Stepper } from "../components/ui/Stepper.jsx";
import { BarChart } from "../components/charts/BarChart.jsx";
import { PanelBoundary } from "../components/ui/ErrorBoundary.jsx";

const AVAILABLE_TAGS = ["#code", "#reading", "#math", "#research", "#writing"];

export function StudyPage() {
  const [state, setState] = useStore();
  const { today } = useNow();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || today;

  // Active Timer Persistence
  const activeStartedAt = state.activeTimer?.startedAt;
  const activeTag = state.activeTimer?.tag || "#code";
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTag, setSelectedTag] = useState(activeTag);
  const [filterTag, setFilterTag] = useState("all");

  // Timer Protocol Mode: "free" | "90m" (Ultradian) | "50m"
  const [protocolMode, setProtocolMode] = useState("90m");

  // Stale timer check (> 12h)
  const [showDiscardStale, setShowDiscardStale] = useState(false);
  const [staleAccepted, setStaleAccepted] = useState(false);

  useEffect(() => {
    if (!activeStartedAt) {
      setElapsed(0);
      return;
    }

    const startMs = new Date(activeStartedAt).getTime();
    const nowMs = Date.now();
    const diffHours = (nowMs - startMs) / (1000 * 60 * 60);

    if (diffHours > 12 && !staleAccepted) {
      setShowDiscardStale(true);
      return;
    }

    const interval = setInterval(() => {
      if (!isPaused) {
        const sec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setElapsed(sec);

        // Ultradian halfway audio notification (at 45:00 = 2700s)
        if (protocolMode === "90m" && sec === 2700) {
          sound.playMidpointChime();
        }
        // Ultradian target finish audio notification (at 90:00 = 5400s)
        if (protocolMode === "90m" && sec === 5400) {
          sound.playZenBowlChime();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStartedAt, isPaused, protocolMode, staleAccepted]);

  const handleStartTimer = () => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      activeTimer: { startedAt: nowIso, tag: selectedTag },
    }));
    setIsPaused(false);
    sound.playZenBowlChime();
  };

  const handleStopAndLog = () => {
    if (elapsed < 60) {
      setState((prev) => ({ ...prev, activeTimer: null }));
      setElapsed(0);
      return;
    }

    const durationMins = Math.max(1, Math.round(elapsed / 60));
    const newSession = {
      id: crypto.randomUUID(),
      date: dateParam,
      minutes: durationMins,
      source: "timer",
      tag: selectedTag,
    };

    setState((prev) => ({
      ...prev,
      studySessions: [...(prev.studySessions || []), newSession],
      activeTimer: null,
    }));
    setElapsed(0);
    sound.playRestCompleteChime();
  };

  // Manual entry fields
  const [manualMinutes, setManualMinutes] = useState(45);

  const handleDiscardStale = () => {
    setState((prev) => ({ ...prev, activeTimer: null }));
    setShowDiscardStale(false);
    setStaleAccepted(false);
    setElapsed(0);
  };

  const handleKeepStale = () => {
    setShowDiscardStale(false);
    setStaleAccepted(true);
  };
  const handleAddManual = (mins) => {
    const duration = mins || manualMinutes;
    if (!duration || duration <= 0) return;

    const newSession = {
      id: crypto.randomUUID(),
      date: dateParam,
      minutes: Number(duration),
      source: "manual",
      tag: selectedTag,
    };

    setState((prev) => ({
      ...prev,
      studySessions: [...(prev.studySessions || []), newSession],
    }));
    sound.playKeycapClick();
  };

  const studySessions = state.studySessions || [];
  const todaySessions = studySessions.filter((s) => s.date === dateParam);
  const todayMins = todaySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  const changeTarget = (delta) => {
    setState((prev) => {
      const next = Math.min(8, Math.max(0.5, (prev.settings?.studyTargetHours ?? 2) + delta));
      return { ...prev, settings: { ...prev.settings, studyTargetHours: next } };
    });
  };

  // Filtered Sessions for chart
  const filteredSessions = filterTag === "all"
    ? studySessions
    : studySessions.filter((s) => s.tag === filterTag);

  // 30-Day Activity Bar Chart
  const past30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayMins = filteredSessions
      .filter((s) => s.date === k)
      .reduce((acc, s) => acc + (s.minutes || 0), 0);

    return {
      label: d.getDate().toString(),
      value: dayMins,
      display: `${(dayMins / 60).toFixed(1)} hrs`,
    };
  });

  // Calculate target progress from the editable setting (default 2.0h)
  const targetHours = state.settings?.studyTargetHours ?? 2;
  const targetMins = Math.max(30, Math.round(targetHours * 60));
  const progressPct = Math.min(100, Math.round((todayMins / targetMins) * 100));

  // Ultradian countdown math
  const targetSeconds = protocolMode === "90m" ? 5400 : protocolMode === "50m" ? 3000 : null;
  const remainingSeconds = targetSeconds ? Math.max(0, targetSeconds - elapsed) : null;

  return (
    <div className="space-y-6">
      {showDiscardStale && (
        <Card className="space-y-3">
          <p className="text-sm text-[var(--text-2)]">
            This timer has been running for more than 12 hours. Discard it, or keep it and log the full time.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={handleDiscardStale}>
              Discard
            </Button>
            <Button variant="primary" size="md" onClick={handleKeepStale}>
              Keep running
            </Button>
          </div>
        </Card>
      )}
      {/* Hero Focus Timer Card */}
      <Card tilt={true} className="flex flex-col items-center justify-center py-10 space-y-5 text-center relative overflow-hidden">
        {/* Protocol Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] text-xs font-mono">
          <button
            type="button"
            onClick={() => setProtocolMode("90m")}
            className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
              protocolMode === "90m" ? "bg-[var(--surface-1)] text-[var(--accent)] font-semibold shadow-sm" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            90m Ultradian
          </button>
          <button
            type="button"
            onClick={() => setProtocolMode("50m")}
            className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
              protocolMode === "50m" ? "bg-[var(--surface-1)] text-[var(--accent)] font-semibold shadow-sm" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            50/10 Focus
          </button>
          <button
            type="button"
            onClick={() => setProtocolMode("free")}
            className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
              protocolMode === "free" ? "bg-[var(--surface-1)] text-[var(--accent)] font-semibold shadow-sm" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            Stopwatch
          </button>
        </div>

        {/* Display-XL Monospace Timer */}
        <div className="text-6xl sm:text-8xl md:text-9xl font-mono tabular-nums font-semibold tracking-tight text-[var(--accent)] select-none leading-none drop-shadow-[0_0_24px_rgba(200,246,92,0.15)]">
          {targetSeconds && remainingSeconds !== null
            ? formatSecondsToTimer(remainingSeconds)
            : formatSecondsToTimer(elapsed)}
        </div>

        {/* Cognitive Context Tags */}
        <div className="flex items-center gap-2 flex-wrap justify-center pt-1 font-mono text-xs">
          <span className="text-[var(--text-3)] text-[11px]">Domain:</span>
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-0.5 rounded-[4px] border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-medium"
                  : "bg-[var(--surface-2)] border-[var(--line)] text-[var(--text-3)] hover:text-[var(--text-1)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 pt-3">
          {!activeStartedAt ? (
            <Button variant="primary" size="lg" onClick={handleStartTimer} className="min-w-[140px] keycap">
              Begin Focus
            </Button>
          ) : (
            <>
              <Button
                variant={isPaused ? "primary" : "ghost"}
                size="md"
                onClick={() => setIsPaused((prev) => !prev)}
                className="font-mono text-xs"
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="danger" size="md" onClick={handleStopAndLog} className="font-mono text-xs">
                Log Session ({Math.max(1, Math.round(elapsed / 60))}m)
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Target Progress Bar & Manual Increments */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent)] font-semibold uppercase tracking-wider text-[11px]">
              Daily Focus Target
            </span>
            <span className="text-[var(--text-3)]">·</span>
            <span className="text-[var(--text-1)] font-medium">{formatMinutes(todayMins)} logged</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-3)]">
            <span>{progressPct}%</span>
            <button
              type="button"
              aria-label="Decrease study target"
              onClick={() => changeTarget(-0.5)}
              className="w-6 h-6 rounded-[4px] border border-[var(--line)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              −
            </button>
            <span className="tabular-nums">{targetHours.toFixed(1)}h goal</span>
            <button
              type="button"
              aria-label="Increase study target"
              onClick={() => changeTarget(0.5)}
              className="w-6 h-6 rounded-[4px] border border-[var(--line)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs font-mono text-[var(--text-3)]">Quick Add:</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleAddManual(m)}
                className="px-2.5 py-1 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] rounded-[6px] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>

        {/* Exact manual entry */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs font-mono text-[var(--text-3)]">Exact minutes:</span>
          <Stepper
            value={manualMinutes}
            onChange={(v) => setManualMinutes(v ?? 0)}
            min={1}
            max={1440}
            step={5}
            ariaLabel="Manual study minutes"
            unit="m"
            className="w-[168px]"
          />
          <Button
            variant="ghost"
            size="md"
            onClick={() => handleAddManual(manualMinutes)}
            className="font-mono text-xs"
          >
            Add to today
          </Button>
        </div>
      </Card>

      {/* 30-Day Activity Chart with Domain Tag Filter */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            30-Day Cognitive Cadence
          </h3>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="text-[var(--text-3)]">Filter:</span>
            {["all", ...AVAILABLE_TAGS].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterTag(t)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  filterTag === t ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface-2)] border-[var(--line)] text-[var(--text-3)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <PanelBoundary>
          <BarChart data={past30Days} height={140} unit="hrs" />
        </PanelBoundary>
      </Card>
    </div>
  );
}
