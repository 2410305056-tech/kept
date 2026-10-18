import { useState } from "react";
import { FrictionHoldModal } from "../components/clean/FrictionHoldModal.jsx";
import { VulnerabilityClock } from "../components/clean/VulnerabilityClock.jsx";
import React, { useContext } from "react";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { cleanStats } from "../lib/logic.js";
import { parse, addDays, key } from "../lib/dates.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Odometer } from "../components/ui/Odometer.jsx";
import { ToastContext } from "../context/ToastContext.js";

export function CleanPage() {
  const [state, setState] = useStore();
  const { today } = useNow();
  const { showToast } = useContext(ToastContext);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  const cleanLog = state.cleanLog || [];
  const stats = cleanStats(cleanLog, today);

  const currentEntry = cleanLog.find((c) => c.date === today);

  const handleSetStatus = (status) => {
    const prevStatus = currentEntry?.status || null;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 30]);
    }

    setState((prev) => {
      const filtered = (prev.cleanLog || []).filter((c) => c.date !== today);
      return {
        ...prev,
        cleanLog: [...filtered, { date: today, status, timestamp: new Date().toISOString() }],
      };
    });

    // Provide 5-second undo toast
    showToast(`Marked ${status} today`, {
      label: "Undo",
      onClick: () => {
        setState((prev) => {
          const filtered = (prev.cleanLog || []).filter((c) => c.date !== today);
          if (prevStatus) {
            return { ...prev, cleanLog: [...filtered, { date: today, status: prevStatus }] };
          }
          return { ...prev, cleanLog: filtered };
        });
      },
    });
  };

  // Month grid of past 35 days
  const gridDays = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = key(d);
    const entry = cleanLog.find((c) => c.date === dateKey);
    gridDays.push({
      date: dateKey,
      dayNum: d.getDate(),
      status: entry?.status || "unmarked",
      isToday: dateKey === today,
    });
  }

  // Stoic Assessment
  const assessment =
    stats.current >= 30
      ? "Mastery. The habit is second nature."
      : stats.current >= 14
      ? "Two full weeks unbroken. Momentum is established."
      : stats.current >= 7
      ? "One full week clean. Keep the chain intact."
      : stats.current > 0
      ? `${stats.current} consecutive days. One day at a time.`
      : "The slate is wiped clean. Day 1 starts right now.";

  return (
    <div className="space-y-6">
      {/* Hero Streak Card */}
      <Card className="flex flex-col items-center justify-center py-12 space-y-4 text-center relative overflow-hidden">
        <span className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-3)]">
          Current Clean Streak
        </span>

        {/* Display-XL Monospace Number with Odometer */}
        <div className="text-6xl sm:text-8xl md:text-9xl font-mono tabular-nums font-semibold tracking-tight text-[var(--accent)] select-none leading-none">
          <Odometer value={stats.current} />
        </div>

        <p className="text-xs font-mono text-[var(--text-2)] max-w-sm">
          {assessment}
        </p>

        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-3)] pt-1">
          <span>Best: <strong className="text-[var(--text-1)]">{stats.best} days</strong></span>
          <span>·</span>
          <span>Monthly Consistency: <strong className="text-[var(--accent)]">{stats.monthlyPct}%</strong></span>
        </div>

        {/* Two 48px Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleSetStatus("clean")}
            className="w-full h-12 text-sm font-semibold keycap"
          >
            Clean today
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleSetStatus("slip")}
            className="w-full h-12 text-sm font-semibold keycap"
          >
            I slipped
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsHoldModalOpen(true)}
            className="w-full h-12 text-sm font-semibold keycap border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            🛡 Friction Hold (120s)
          </Button>
        </div>
      </Card>

      {/* Month Grid of Marks */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Recent Consistency (35 Days)
          </h3>
          <span className="text-xs font-mono text-[var(--text-2)]">{stats.monthlyPct}% Clean</span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
          {gridDays.map((item) => {
            const isClean = item.status === "clean";
            const isSlip = item.status === "slip";

            return (
              <div
                key={item.date}
                className={`relative aspect-square rounded-[8px] border flex flex-col items-center justify-center p-1 select-none transition-all duration-140 keycap ${
                  item.isToday
                    ? "border-[var(--accent)] shadow-[0_0_12px_rgba(200,246,92,0.15)]"
                    : "border-[var(--line)] bg-[var(--surface-2)]"
                }`}
              >
                <span className="text-[10px] font-mono text-[var(--text-3)] mb-1 leading-none">
                  {item.dayNum}
                </span>

                {isClean ? (
                  <div className="w-4 h-4 rounded-[2px] bg-[var(--accent)] flex items-center justify-center text-[var(--accent-ink)] font-bold text-[10px]">
                    ✓
                  </div>
                ) : isSlip ? (
                  <div className="relative w-4 h-4 rounded-[2px] border border-[var(--text-3)] bg-[var(--surface-3)]">
                    <svg className="w-full h-full stroke-[var(--text-2)] stroke-[1.5]" viewBox="0 0 14 14">
                      <line x1="2" y1="12" x2="12" y2="2" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-[2px] border border-dashed border-[var(--line-strong)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-[var(--line)]/50 text-[11px] font-mono text-[var(--text-3)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[var(--accent)] inline-block" />
            <span>Clean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] border border-[var(--text-3)] bg-[var(--surface-3)] inline-block" />
            <span>Slip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] border border-dashed border-[var(--line-strong)] inline-block" />
            <span>Unmarked</span>
          </div>
        </div>
      </Card>

      {/* 24-Hour Vulnerability Radial Clock */}
      <VulnerabilityClock
        cleanLog={cleanLog}
        frictionHolds={state.cleanFrictionHolds || []}
      />

      {/* 120-Second Friction Hold Modal */}
      <FrictionHoldModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        onCompleted={() => {
          setState((prev) => ({
            ...prev,
            cleanFrictionHolds: [
              ...(prev.cleanFrictionHolds || []),
              { timestamp: new Date().toISOString() }
            ]
          }));
          showToast("120s Friction Hold completed. Impulse cleared.");
        }}
      />
    </div>
  );
}
