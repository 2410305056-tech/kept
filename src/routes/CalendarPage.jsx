import React, { useState } from "react";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { weekNumber, phaseForWeek } from "../lib/logic.js";
import { parse, addDays, key } from "../lib/dates.js";
import { MonthGrid } from "../components/calendar/MonthGrid.jsx";
import { DayPanel } from "../components/calendar/DayPanel.jsx";
import { Sheet } from "../components/ui/Sheet.jsx";
import { IconButton } from "../components/ui/IconButton.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Chip } from "../components/ui/Chip.jsx";

export function CalendarPage() {
  const [state] = useStore();
  const { today } = useNow();

  const [currentDate, setCurrentDate] = useState(() => {
    const [y, m, d] = today.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  const curWeek = weekNumber(state.plan, today);
  const curPhase = phaseForWeek(curWeek);

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const [y, m, d] = today.split("-").map(Number);
    setCurrentDate(new Date(y, m - 1, 1));
    setSelectedDate(today);
  };

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobilePanelOpen(true);
    }
  };

  const monthTitle = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-[var(--text-1)]">
            {monthTitle}
          </h1>
          <Chip variant="accent">
            Week {curWeek} · {curPhase}
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <IconButton onClick={handlePrevMonth} aria-label="Previous month">
            ‹
          </IconButton>
          <Button variant="ghost" size="md" onClick={handleToday}>
            Today
          </Button>
          <IconButton onClick={handleNextMonth} aria-label="Next month">
            ›
          </IconButton>
        </div>
      </div>

      {/* Main Grid + Desktop Right Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Calendar Month Grid */}
        <div className="w-full">
          <MonthGrid
            currentDate={currentDate}
            todayStr={today}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            direction={direction}
            state={state}
          />
        </div>

        {/* Desktop Inline Day Panel */}
        <div className="hidden lg:block sticky top-8">
          <DayPanel
            dateStr={selectedDate}
            state={state}
            todayStr={today}
            onClose={() => setSelectedDate(today)}
          />
        </div>
      </div>

      {/* Mobile Drawer Sheet */}
      <div className="lg:hidden">
        <Sheet
          isOpen={isMobilePanelOpen}
          onClose={() => setIsMobilePanelOpen(false)}
          title="Daily Record"
        >
          <DayPanel
            dateStr={selectedDate}
            state={state}
            todayStr={today}
            onClose={() => setIsMobilePanelOpen(false)}
          />
        </Sheet>
      </div>
    </div>
  );
}
