import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { DayCell } from "./DayCell.jsx";
import { parse, addDays, key } from "../../lib/dates.js";
import { useTilt } from "../../hooks/useTilt.js";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthGrid({
  currentDate, // Date object representing the month
  todayStr,
  selectedDate,
  onSelectDate,
  direction = 0, // 1 for next (slide left), -1 for prev (slide right)
  state,
}) {
  const reduced = useReducedMotion();
  const tilt = useTilt(3);

  // Compute 42 calendar cells (6 weeks) starting Monday
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const currentMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Monday = 0 index
  const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startDayOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(key(d));
  }

  // Keyboard navigation for calendar grid
  const handleKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === "ArrowRight") nextIndex = index + 1;
    else if (e.key === "ArrowLeft") nextIndex = index - 1;
    else if (e.key === "ArrowDown") nextIndex = index + 7;
    else if (e.key === "ArrowUp") nextIndex = index - 7;
    else if (e.key === "Home") {
      e.preventDefault();
      onSelectDate(todayStr);
      return;
    }

    if (nextIndex != null && nextIndex >= 0 && nextIndex < days.length) {
      e.preventDefault();
      onSelectDate(days[nextIndex]);
    }
  };

  const variants = {
    enter: (dir) => (reduced ? { opacity: 0 } : { x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => (reduced ? { opacity: 0 } : { x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="flex flex-col w-full"
    >
      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 text-center">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Grid with Directional Slide */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentMonthKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduced ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          role="grid"
          aria-label={`Month of ${firstDayOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
          className="grid grid-cols-7 gap-2 sm:gap-3"
        >
          {days.map((dateStr, idx) => (
            <div key={dateStr} onKeyDown={(e) => handleKeyDown(e, idx)}>
              <DayCell
                dateStr={dateStr}
                currentMonth={currentMonthKey}
                todayStr={todayStr}
                isSelected={selectedDate === dateStr}
                onClick={onSelectDate}
                state={state}
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="hidden sm:flex items-center justify-between text-[11px] font-mono text-[var(--text-3)] pt-3 px-1 border-t border-[var(--line)]/50 mt-4 select-none">
        <span>G: Gym · R: Run · S: Study · C: Clean</span>
        <span>Arrows: Navigate · Home: Today · Click: Detail</span>
      </div>
    </div>
  );
}
