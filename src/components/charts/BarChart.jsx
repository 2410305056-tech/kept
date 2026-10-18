import React, { useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function BarChart({
  data = [], // [{ label: "Oct 19", value: 120, display: "2h" }]
  height = 160,
  emptyMessage = "No data yet",
  unit = "m",
  className = "",
}) {
  const reduced = useReducedMotion();
  const [hoverIndex, setHoverIndex] = useState(null);

  try {
    if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
      return (
        <div
          style={{ height }}
          className={`flex flex-col items-center justify-center border-b border-dashed border-[var(--line-strong)] text-[var(--text-3)] text-xs font-mono select-none ${className}`}
        >
          <span>{emptyMessage}</span>
        </div>
      );
    }

    const padding = { top: 20, right: 12, bottom: 24, left: 12 };
    const svgWidth = 400;
    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const barWidth = Math.max(3, Math.min(24, (plotWidth / data.length) * 0.7));
    const step = plotWidth / data.length;

    return (
      <div className={`relative w-full ${className}`}>
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Baseline */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={svgWidth - padding.right}
            y2={height - padding.bottom}
            stroke="var(--line-strong)"
            strokeWidth="1"
          />

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = d.value > 0 ? Math.max(2, (d.value / maxVal) * plotHeight) : 0;
            const x = padding.left + i * step + (step - barWidth) / 2;
            const y = height - padding.bottom - barHeight;
            const isHovered = hoverIndex === i;

            return (
              <g key={i} onMouseEnter={() => setHoverIndex(i)} className="cursor-pointer">
                {d.value > 0 && (
                  <motion.rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill={isHovered ? "var(--text-1)" : "var(--accent)"}
                    initial={reduced ? { height: barHeight, y } : { height: 0, y: height - padding.bottom }}
                    animate={{ height: barHeight, y }}
                    transition={{ duration: reduced ? 0.01 : 0.35, delay: reduced ? 0 : i * 0.01 }}
                  />
                )}
                {/* Hit area */}
                <rect
                  x={padding.left + i * step}
                  y={padding.top}
                  width={step}
                  height={plotHeight}
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* Time ticks */}
          {data.length > 0 && (
            <g className="fill-[var(--text-3)] text-[10px] font-mono select-none">
              <text x={padding.left} y={height - 6} textAnchor="start">
                {data[0]?.label}
              </text>
              {data.length > 2 && (
                <text x={svgWidth / 2} y={height - 6} textAnchor="middle">
                  {data[Math.floor(data.length / 2)]?.label}
                </text>
              )}
              {data.length > 1 && (
                <text x={svgWidth - padding.right} y={height - 6} textAnchor="end">
                  {data[data.length - 1]?.label}
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoverIndex != null && data[hoverIndex] && (
          <div
            className="absolute top-0 pointer-events-none transform -translate-x-1/2 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded px-2 py-1 text-[11px] font-mono text-[var(--text-1)] shadow-md"
            style={{
              left: `${
                ((padding.left + hoverIndex * step + step / 2) / svgWidth) * 100
              }%`,
            }}
          >
            {data[hoverIndex].label}: {data[hoverIndex].display || `${data[hoverIndex].value} ${unit}`}
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error("BarChart error:", err);
    return <div className="h-32 flex items-center justify-center text-xs text-[var(--text-3)]">Chart unavailable</div>;
  }
}
