import { Logo } from "../ui/Logo.jsx";
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Rail } from "./Rail.jsx";
import { BottomNav } from "./BottomNav.jsx";
import { Toast } from "../ui/Toast.jsx";
import { Sheet } from "../ui/Sheet.jsx";
import { useStore } from "../../hooks/useStore.js";
import { useNow } from "../../hooks/useNow.js";
import { weekNumber, phaseForWeek } from "../../lib/logic.js";
import { formatDisplayDate } from "../../lib/format.js";
import { ToastContext } from "../../context/ToastContext.js";


export function AppShell() {
  const [state, , storageError] = useStore();
  const { today } = useNow();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Live ticking clock (seconds precision)
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTimeStr(d.toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input, textarea or contentEditable
      const tag = e.target.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        navigate("/");
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        navigate("/gym");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        navigate("/study");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        navigate("/clean");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        navigate("/running");
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        navigate("/progress");
      } else if (e.key === "Escape") {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const showToast = (message, action = null) => {
    setToast({ message, action });
  };

  const isCycleComplete = today > "2027-01-10";
  const isTestDay = today === "2027-01-11";
  const curWeek = weekNumber(state.plan, today);
  const curPhase = phaseForWeek(curWeek);
  const cyclePercent = Math.min(100, Math.max(0, Math.round((curWeek / 12) * 100)));

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] flex relative selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]">
        {/* Grain Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay"
        >
          <svg className="w-full h-full">
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>

        {/* Radial Vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_50%_40%,transparent_55%,rgba(0,0,0,0.35)_100%)]"
        />

        {/* Desktop / Tablet Left Rail */}
        <div className="no-print">
          <Rail />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8 relative">
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center justify-between h-14 px-4 bg-[var(--surface-1)] border-b border-[var(--line)] sticky top-0 z-30 select-none no-print">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showWordmark={true} />
              <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded">
                W{curWeek}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-[var(--text-2)] tabular-nums">{timeStr}</span>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs border border-[var(--line)] text-[var(--text-3)]"
                aria-label="Keyboard shortcuts"
              >
                ?
              </button>
            </div>
          </div>

          {/* Desktop Top Telemetry Strip */}
          <header className="hidden md:flex items-center justify-between h-11 px-8 border-b border-[var(--line)]/60 bg-[var(--bg)]/40 backdrop-blur-sm sticky top-0 z-20 no-print select-none">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[var(--text-3)] uppercase tracking-wider text-[10px]">Cycle 01</span>
              <span className="text-[var(--line-strong)]">/</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-[var(--text-1)] font-medium">Week {curWeek} of 12</span>
                <span className="text-[var(--text-3)]">({curPhase})</span>
              </div>
              <span className="text-[var(--line-strong)]">/</span>
              <span className="text-[var(--text-3)]">{cyclePercent}% Completed</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[var(--text-2)]">{formatDisplayDate(today)}</span>
              <span className="text-[var(--line-strong)]">|</span>
              <span className="tabular-nums text-[var(--text-1)] font-medium tracking-tight">
                {timeStr}
              </span>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="px-1.5 py-0.5 rounded border border-[var(--line)] hover:border-[var(--line-strong)] text-[10px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
                title="Press ? for shortcuts"
              >
                ? keys
              </button>
            </div>
          </header>

          {/* Storage Error Warning */}
          {storageError && (
            <div className="bg-[var(--warn)]/15 border-b border-[var(--warn)] px-4 py-2 text-xs font-mono text-[var(--warn)] flex items-center justify-between no-print">
              <span>Storage unavailable — export your data now.</span>
            </div>
          )}

          {/* Cycle Complete / Test Day Notice */}
          {isTestDay ? (
            <div className="bg-[var(--accent-soft)] border-b border-[var(--accent)] px-4 py-2 text-xs font-mono text-[var(--accent)] flex items-center justify-between no-print">
              <span>TEST DAY: 12-Week Cycle Finished. Test your lift targets today!</span>
            </div>
          ) : isCycleComplete ? (
            <div className="bg-[var(--surface-2)] border-b border-[var(--line-strong)] px-4 py-1.5 text-xs font-mono text-[var(--text-2)] flex items-center justify-between no-print">
              <span>12-Week cycle complete. Continuing in maintenance/push mode.</span>
            </div>
          ) : null}

          {/* The Logbook Spine Motif (DESIGN.md §2) with 4 pillar ticks */}
          <div
            aria-hidden="true"
            className="hidden xl:block absolute left-8 top-16 bottom-12 w-[1px] bg-[var(--line)] pointer-events-none"
          >
            {/* 4 Pillar tick marks */}
            <div className="absolute top-12 -left-1 w-2.5 h-[1px] bg-[var(--line-strong)]" title="Gym" />
            <div className="absolute top-24 -left-1 w-2.5 h-[1px] bg-[var(--line-strong)]" title="Run" />
            <div className="absolute top-36 -left-1 w-2.5 h-[1px] bg-[var(--line-strong)]" title="Study" />
            <div className="absolute top-48 -left-1 w-2.5 h-[1px] bg-[var(--line-strong)]" title="Clean" />
          </div>

          {/* Page Outlet */}
          <main className="flex-1 max-w-[1080px] w-full mx-auto p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="no-print">
          <BottomNav />
        </div>

        {/* Toast Container */}
        <Toast toast={toast} onDismiss={() => setToast(null)} />

        {/* Keyboard Shortcuts Drawer */}
        <Sheet
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          title="Keyboard Navigation"
        >
          <div className="space-y-4 font-mono text-xs">
            <p className="text-[var(--text-2)]">
              Antigravity Kept is designed for keyboard-driven velocity.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)]">
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[var(--text-2)]">Calendar / Today</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--accent)] font-semibold border border-[var(--line-strong)]">
                  T
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[var(--text-2)]">Gym Routine</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--accent)] font-semibold border border-[var(--line-strong)]">
                  G
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[var(--text-2)]">Deep Study</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--accent)] font-semibold border border-[var(--line-strong)]">
                  S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[var(--text-2)]">Clean Habit</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--accent)] font-semibold border border-[var(--line-strong)]">
                  C
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[var(--text-2)]">Running Protocol</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--accent)] font-semibold border border-[var(--line-strong)]">
                  R
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[var(--text-2)]">12-Week Progress</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--accent)] font-semibold border border-[var(--line-strong)]">
                  P
                </kbd>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-[var(--text-3)] flex items-center justify-between">
              <span>Press <kbd className="text-[var(--text-2)]">?</kbd> anytime to toggle</span>
              <span><kbd className="text-[var(--text-2)]">ESC</kbd> to close</span>
            </div>
          </div>
        </Sheet>
      </div>
    </ToastContext.Provider>
  );
}
