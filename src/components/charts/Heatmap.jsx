import React, { useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function Heatmap({
  rows = [], // [{ label: "Gym", days: [{ date: "2026-10-19", active: true, value: "Push A" }] }]
  cellSize = 11,
  gap = 3,
  className = "",
}) {
  const reduced = useReducedMotion();
  const [hoveredCell, setHoveredCell] = useState(null);

  try {
    if (!rows || rows.length === 0) {
      return (
        <div className="p-4 text-center text-xs font-mono text-[var(--text-3)] border border-dashed border-[var(--line)] rounded">
          No activity records
        </div>
      );
    }

    const numCols = Math.max(...rows.map((r) => r.days?.length || 0), 1);
    const labelWidth = 56;
    const totalWidth = labelWidth + numCols * (cellSize + gap);
    const totalHeight = rows.length * (cellSize + gap) + 10;

    return (
      <div className={`overflow-x-auto pb-2 ${className}`}>
        <div className="relative inline-block min-w-full">
          <svg width={totalWidth} height={totalHeight} className="overflow-visible">
            {rows.map((row, rIdx) => {
              const y = rIdx * (cellSize + gap);

              return (
                <g key={row.label || rIdx}>
                  {/* Row label */}
                  <text
                    x="0"
                    y={y + cellSize - 1}
                    className="fill-[var(--text-3)] text-[10px] font-mono select-none"
                  >
                    {row.label}
                  </text>

                  {/* Day cells */}
                  {row.days?.map((day, cIdx) => {
                    const x = labelWidth + cIdx * (cellSize + gap);
                    const isActive = day.active;
                    const isSlip = day.slip;
                    const isToday = day.today;

                    let fill = "var(--surface-3)";
                    let stroke = "none";
                    if (isActive) fill = "var(--accent)";
                    if (isToday && !isActive) stroke = "var(--accent)";

                    return (
                      <g
                        key={day.date || cIdx}
                        onMouseEnter={() => setHoveredCell({ ...day, row: row.label, x, y })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className="cursor-pointer"
                      >
                        <motion.rect
                          x={x}
                          y={y}
                          width={cellSize}
                          height={cellSize}
                          rx="3"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth="1"
                          initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: reduced ? 0.01 : 0.2,
                            delay: reduced ? 0 : Math.min(0.35, rIdx * 0.02 + cIdx * 0.003),
                          }}
                        />
                        {/* Slip diagonal strike */}
                        {isSlip && (
                          <line
                            x1={x + 2}
                            y1={y + cellSize - 2}
                            x2={x + cellSize - 2}
                            y2={y + 2}
                            stroke="var(--text-2)"
                            strokeWidth="1.2"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredCell && (
            <div
              className="absolute pointer-events-none -top-7 transform -translate-x-1/2 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded px-2 py-0.5 text-[10px] font-mono text-[var(--text-1)] whitespace-nowrap z-20 shadow-lg"
              style={{ left: hoveredCell.x + cellSize / 2, top: Math.max(0, hoveredCell.y - 24) }}
            >
              {hoveredCell.date}: {hoveredCell.row} {hoveredCell.value || (hoveredCell.active ? "Done" : "None")}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error("Heatmap error:", err);
    return <div className="text-xs text-[var(--text-3)]">Heatmap unavailable</div>;
  }
}
