import React from "react";

export function Sparkline({
  data = [], // array of numbers e.g. [20, 20, 22.5, 22.5, 25]
  width = 80,
  height = 24,
  className = "",
}) {
  try {
    if (!data || data.length === 0) {
      return (
        <svg width={width} height={height} className={`overflow-visible ${className}`}>
          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="var(--line-strong)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        </svg>
      );
    }

    if (data.length === 1) {
      return (
        <svg width={width} height={height} className={`overflow-visible ${className}`}>
          <circle cx={width / 2} cy={height / 2} r="2.5" fill="var(--accent)" />
        </svg>
      );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 3;
    const drawHeight = height - padding * 2;
    const drawWidth = width - padding * 2;

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * drawWidth;
      const y = height - padding - ((val - min) / range) * drawHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lastPoint = points[points.length - 1].split(",");

    return (
      <svg width={width} height={height} className={`overflow-visible ${className}`}>
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
        <circle
          cx={Number(lastPoint[0])}
          cy={Number(lastPoint[1])}
          r="2"
          fill="var(--accent)"
        />
      </svg>
    );
  } catch {
    return <div className="w-20 h-6 border-b border-dashed border-[var(--line)]" />;
  }
}
