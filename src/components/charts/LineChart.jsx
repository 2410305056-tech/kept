import React, { useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function LineChart({
  data = [], // [{ x: "Oct 19", y: 65, label: "65.0 kg" }]
  targetBand = null, // [min, max] e.g. [68, 69.5]
  height = 180,
  emptyMessage = "No data yet",
  className = "",
  unit = "kg",
}) {
  const reduced = useReducedMotion();
  const [hoverIndex, setHoverIndex] = useState(null);

  try {
    if (!data || data.length === 0) {
      return (
        <div
          style={{ height }}
          className={`flex flex-col items-center justify-center border-b border-dashed border-[var(--line-strong)] text-[var(--text-3)] text-xs font-mono select-none ${className}`}
        >
          <span>{emptyMessage}</span>
        </div>
      );
    }

    const padding = { top: 20, right: 16, bottom: 28, left: 32 };
    const svgWidth = 400; // viewBox width
    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const yValues = data.map((d) => d.y);
    if (targetBand) {
      yValues.push(targetBand[0], targetBand[1]);
    }
    const minY = Math.floor(Math.min(...yValues) * 0.98);
    const maxY = Math.ceil(Math.max(...yValues) * 1.02);
    const yRange = maxY - minY || 1;

    const getX = (i) => {
      if (data.length === 1) return padding.left + plotWidth / 2;
      return padding.left + (i / (data.length - 1)) * plotWidth;
    };
    const getY = (val) => {
      return padding.top + plotHeight - ((val - minY) / yRange) * plotHeight;
    };

    const points = data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.y).toFixed(1)}`);
    const pathD = `M ${points.join(" L ")}`;

    const areaD =
      data.length > 1
        ? `${pathD} L ${getX(data.length - 1)},${height - padding.bottom} L ${getX(0)},${height - padding.bottom} Z`
        : "";

    // Target band polygon
    let targetBandD = null;
    if (targetBand) {
      const yTop = getY(targetBand[1]);
      const yBottom = getY(targetBand[0]);
      targetBandD = `M ${padding.left},${yTop} L ${svgWidth - padding.right},${yTop} L ${
        svgWidth - padding.right
      },${yBottom} L ${padding.left},${yBottom} Z`;
    }

    // Grid lines (3 horizontal lines)
    const gridTicks = [
      minY,
      Math.round((minY + maxY) / 2),
      maxY,
    ];

    return (
      <div className={`relative w-full ${className}`}>
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <pattern id="targetHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-strong)" strokeWidth="1" opacity="0.6" />
            </pattern>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--text-3)] text-[9px] font-mono select-none hidden sm:block"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Target band */}
          {targetBandD && (
            <path d={targetBandD} fill="url(#targetHatch)" />
          )}

          {/* Area gradient */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {/* Line path */}
          {data.length > 1 && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0.01 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Points & hover triggers */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.y);
            const isHovered = hoverIndex === i;

            return (
              <g key={i} onMouseEnter={() => setHoverIndex(i)} className="cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4 : 2.5}
                  fill={isHovered ? "var(--text-1)" : "var(--accent)"}
                  stroke="var(--bg)"
                  strokeWidth="1"
                />
                {/* Expand hit target */}
                <rect
                  x={cx - 16}
                  y={padding.top}
                  width={32}
                  height={plotHeight}
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* Hover Crosshair & Tooltip */}
          {hoverIndex != null && (
            <g pointerEvents="none">
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="var(--line-strong)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            </g>
          )}

          {/* X-axis time ticks (3 ticks) */}
          {data.length > 0 && (
            <g className="fill-[var(--text-3)] text-[10px] font-mono select-none">
              <text x={padding.left} y={height - 8} textAnchor="start">
                {data[0]?.x}
              </text>
              {data.length > 2 && (
                <text x={padding.left + plotWidth / 2} y={height - 8} textAnchor="middle">
                  {data[Math.floor(data.length / 2)]?.x}
                </text>
              )}
              {data.length > 1 && (
                <text x={svgWidth - padding.right} y={height - 8} textAnchor="end">
                  {data[data.length - 1]?.x}
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex != null && data[hoverIndex] && (
          <div
            className="absolute top-1 pointer-events-none transform -translate-x-1/2 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded px-2 py-1 text-[11px] font-mono text-[var(--text-1)] shadow-md"
            style={{ left: `${(getX(hoverIndex) / svgWidth) * 100}%` }}
          >
            {data[hoverIndex].x}: {data[hoverIndex].y} {unit}
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error("LineChart render error:", err);
    return (
      <div className="h-40 flex items-center justify-center text-xs text-[var(--text-3)]">
        Chart unavailable
      </div>
    );
  }
}
