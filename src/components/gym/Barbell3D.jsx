import React, { useState, useRef } from "react";

function getBarbellPlatesArray(weightKg) {
  if (weightKg < 20) return [];
  const perSide = (weightKg - 20) / 2;
  if (perSide <= 0) return [];
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  let rem = Math.round(perSide * 100) / 100;
  const plates = [];
  for (const p of availablePlates) {
    while (rem >= p - 0.01) {
      plates.push(p);
      rem = Math.round((rem - p) * 100) / 100;
    }
  }
  return plates;
}

const PLATE_SPECS = {
  25: { height: 136, width: 24, bg: "#16161D", border: "#353545", color: "#F4F4F6", text: "25", rim: "#22222E" },
  20: { height: 130, width: 22, bg: "#1A1A24", border: "#404052", color: "#F4F4F6", text: "20", rim: "#282836" },
  15: { height: 114, width: 18, bg: "#23232F", border: "#4A4A5E", color: "#E0E0E8", text: "15", rim: "#323242" },
  10: { height: 98,  width: 16, bg: "#2A2A38", border: "#55556A", color: "#D0D0DA", text: "10", rim: "#3A3A4C" },
  5:  { height: 82,  width: 13, bg: "#333344", border: "#62627A", color: "#C0C0CC", text: "5",  rim: "#444458" },
  2.5:{ height: 70,  width: 11, bg: "#424256", border: "#747490", color: "#B0B0BE", text: "2.5",rim: "#525268" },
  1.25:{ height: 58, width: 9,  bg: "#55556D", border: "#8888A4", color: "#A0A0B0", text: "1.25",rim: "#64647E" }
};

export function Barbell3D({ weightKg }) {
  const plates = getBarbellPlatesArray(weightKg);
  const perSideKg = (weightKg - 20) / 2;

  // Interactive 3D Rotation State
  const [rotY, setRotY] = useState(-18);
  const [rotX, setRotX] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0, startRotY: -18, startRotX: 10 });

  const handlePointerDown = (e) => {
    setIsDragging(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      startRotY: rotY,
      startRotX: rotX,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    const newY = Math.max(-50, Math.min(25, startPos.current.startRotY + dx * 0.35));
    const newX = Math.max(-5, Math.min(30, startPos.current.startRotX - dy * 0.25));

    setRotY(newY);
    setRotX(newX);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
  };

  const setViewPreset = (y, x) => {
    setRotY(y);
    setRotX(x);
  };

  return (
    <div className="p-4 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded-[12px] space-y-3 font-mono animate-enter-3d">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[var(--line)]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)] font-semibold uppercase tracking-wider text-[11px]">
            Interactive 3D Barbell Sleeve
          </span>
          <span className="text-[var(--text-3)]">·</span>
          <span className="text-[var(--text-1)] font-medium">{weightKg} kg Total</span>
        </div>

        {/* 3D Angle Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-3)] hidden sm:inline">Angles:</span>
          <button
            type="button"
            onClick={() => setViewPreset(-18, 10)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
              rotY === -18 ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface-1)] border-[var(--line)] text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            Isometric
          </button>
          <button
            type="button"
            onClick={() => setViewPreset(0, 4)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
              rotY === 0 ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface-1)] border-[var(--line)] text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            Side
          </button>
          <button
            type="button"
            onClick={() => setViewPreset(-38, 16)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
              rotY === -38 ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface-1)] border-[var(--line)] text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            Sleeve
          </button>
        </div>
      </div>

      {/* 3D Viewport with Drag Physics */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-44 bg-[var(--surface-1)] border border-[var(--line)] rounded-[8px] flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing card-glare"
        style={{ perspective: "1000px" }}
        title="Drag left/right to rotate barbell in 3D"
      >
        <div
          className="flex items-center transition-transform"
          style={{
            transform: `rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg) scale(0.92)`,
            transformStyle: "preserve-3d",
            transition: isDragging ? "none" : "transform 260ms cubic-bezier(.16,1,.3,1)"
          }}
        >
          {/* Olympic Bar Shaft */}
          <div
            className="w-16 h-7 rounded-l-[4px] relative border-y border-l border-neutral-600 shadow-inner"
            style={{
              background: "linear-gradient(180deg, #5A5A66 0%, #888898 50%, #3A3A44 100%)",
              transform: "translateZ(0px)"
            }}
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] opacity-40" />
          </div>

          {/* Collar Flange Stopper */}
          <div
            className="w-4 h-24 rounded-[3px] border border-neutral-500 shadow-xl relative"
            style={{
              background: "linear-gradient(180deg, #8E8E9E 0%, #D0D0E0 45%, #4A4A56 100%)",
              transform: "translateZ(10px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.7)"
            }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/40" />
          </div>

          {/* Sleeve Shaft */}
          <div className="relative flex items-center min-w-[210px] h-12 bg-gradient-to-b from-[#808090] via-[#E2E2F0] to-[#505060] border-y border-neutral-400 shadow-md">
            <div className="flex items-center pl-1">
              {plates.map((p, idx) => {
                const spec = PLATE_SPECS[p] || { height: 70, width: 10, bg: "#333", border: "#555", color: "#fff", text: p, rim: "#222" };
                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-center rounded-[3px] transition-transform hover:scale-105"
                    style={{
                      height: `${spec.height}px`,
                      width: `${spec.width}px`,
                      backgroundColor: spec.bg,
                      border: `1px solid ${spec.border}`,
                      marginRight: "2px",
                      transform: `translateZ(${idx * 8 + 4}px)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.5), 3px 6px 14px rgba(0,0,0,0.75), 0 0 0 1px ${spec.rim}`
                    }}
                    title={`${p} kg Calibrated Bumper Plate`}
                  >
                    {/* High-Contrast Monospace Weight Stamp */}
                    <span
                      className="text-[9px] font-bold font-mono tracking-tighter transform -rotate-90 select-none pointer-events-none drop-shadow-sm"
                      style={{ color: spec.color }}
                    >
                      {spec.text}
                    </span>
                  </div>
                );
              })}

              {/* Quick Lockjaw Collar Clamp */}
              <div
                className="w-5 h-16 rounded-[4px] ml-1.5 border border-neutral-400 shadow-lg flex items-center justify-center relative"
                style={{
                  background: "linear-gradient(180deg, #A4A4B6 0%, #FFFFFF 50%, #606072 100%)",
                  transform: `translateZ(${plates.length * 8 + 10}px)`,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.6)"
                }}
                title="Lockjaw Quick Clamp"
              >
                <div className="w-1.5 h-6 bg-[var(--accent)] rounded-[1px] shadow-sm animate-pulse" />
              </div>
            </div>

            <div className="flex-1 min-w-[30px] h-full" />
            <div className="w-3 h-12 rounded-r-[4px] bg-gradient-to-r from-neutral-400 to-neutral-600 border-r border-y border-neutral-500" />
          </div>
        </div>

        {/* Drag Hint Overlay */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[var(--text-3)] bg-[var(--surface-1)]/80 px-2 py-0.5 rounded border border-[var(--line)] pointer-events-none">
          Drag to orbit 3D · {rotY > 0 ? `+${rotY.toFixed(0)}` : rotY.toFixed(0)}°
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[var(--text-3)]">
        <div>
          <span className="text-[var(--text-2)] font-medium">Inside → Out:</span>{" "}
          {plates.length > 0 ? (
            <span className="text-[var(--accent)] font-mono font-medium">
              [{plates.join(" kg, ")} kg]
            </span>
          ) : (
            <span className="text-[var(--text-2)]">Bare Olympic Sleeve (20 kg)</span>
          )}
        </div>

        <div className="text-[10px] text-[var(--text-3)]">
          {perSideKg > 0 ? `+${perSideKg} kg / sleeve` : "Unloaded bar"}
        </div>
      </div>
    </div>
  );
}
