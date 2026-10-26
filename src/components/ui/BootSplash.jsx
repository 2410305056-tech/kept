import React, { useEffect, useState } from "react";

function Car({ spin }) {
  return (
    <svg viewBox="0 0 320 100" width="280" height="88" aria-hidden="true">
      <defs>
        <linearGradient id="k-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34343C" />
          <stop offset="38%" stopColor="#1D1D22" />
          <stop offset="100%" stopColor="#101013" />
        </linearGradient>
        <linearGradient id="k-flank" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16161A" />
          <stop offset="55%" stopColor="#1D1D22" />
          <stop offset="100%" stopColor="#101013" />
        </linearGradient>
        <linearGradient id="k-glass" x1="0.15" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ECECEF" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#A0A0A8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#08080A" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="k-spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ECECEF" stopOpacity="0" />
          <stop offset="40%" stopColor="#ECECEF" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ECECEF" stopOpacity="0" />
        </linearGradient>
        <filter id="k-soft" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b" />
          <feOffset dy="1" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="158" cy="92" rx="78" ry="3.5" fill="#08080A" opacity="0.7" />

      <path d="M42 74.5 C70 76 250 76 278 74.5 L268 79 C240 81 80 81 52 79 Z" fill="#101013" />
      <path d="M58 73.2 H262" stroke="#C8F65C" strokeWidth="1.15" strokeLinecap="round" />

      <g filter="url(#k-soft)">
        <path
          d="M36 68
             C40 58 48 50 62 44
             C78 36 96 30 118 26.5
             C138 23.5 156 18 176 17.5
             C198 17 218 22 236 30
             C252 38 268 50 280 62
             C284 66 284 70 278 72.5
             L44 73.5
             C36 73 34 71 36 68 Z"
          fill="url(#k-body)"
        />
        <path
          d="M70 52 C96 40 130 36 168 34 C200 33 228 40 248 50 C230 56 120 58 70 52 Z"
          fill="url(#k-flank)"
        />
        <path d="M108 28.5 C128 22 154 20 178 22 C196 24 210 30 218 36 L200 40 C178 32 140 32 118 36 Z" fill="url(#k-glass)" />
        <path d="M112 30 C140 26 176 26 204 34" fill="none" stroke="url(#k-spec)" strokeWidth="1.4" />
        <path d="M78 48 C92 44 104 48 108 58 L88 60 C80 56 76 52 78 48 Z" fill="#08080A" />
        <path d="M196 46 C214 42 232 46 242 56 L226 60 C214 54 200 52 196 46 Z" fill="#08080A" />
        <path d="M248 32 L276 33.5 C280 35 280 38 276 40 L250 38.5 Z" fill="#101013" stroke="#26262C" strokeWidth="0.6" />
        <path d="M252 32.2 H274" stroke="#C8F65C" strokeWidth="1" strokeLinecap="round" />
      </g>

      <circle cx="48" cy="64.5" r="2.6" fill="#C8F65C" />
      <circle cx="48" cy="64.5" r="5" fill="#C8F65C" opacity="0.18" />
      <rect x="268" y="58" width="7" height="3.2" rx="0.7" fill="#ECECEF" opacity="0.8" />
      <rect x="250" y="68.5" width="9" height="2" rx="0.5" fill="#F2C14E" opacity="0.9" />
      <rect x="261" y="68.5" width="8" height="2" rx="0.5" fill="#F2C14E" opacity="0.9" />

      <Wheel cx={92} cy={74} spin={spin} />
      <Wheel cx={226} cy={74} spin={spin} />
    </svg>
  );
}

function Wheel({ cx, cy, spin }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="15.2" fill="#08080A" />
      <g transform={`rotate(${spin} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r="13.4" fill="#101013" stroke="#34343C" strokeWidth="1.6" />
        {[0, 72, 144, 216, 288].map((a) => (
          <path
            key={a}
            d={`M ${cx} ${cy - 2.2} L ${cx - 1.15} ${cy - 10.4} Q ${cx} ${cy - 11.2} ${cx + 1.15} ${cy - 10.4} Z`}
            fill="#C8F65C"
            transform={`rotate(${a} ${cx} ${cy})`}
            opacity="0.85"
          />
        ))}
        <circle cx={cx} cy={cy} r="3.1" fill="#1D1D22" stroke="#C8F65C" strokeWidth="0.65" />
      </g>
    </g>
  );
}

export function BootSplash({ onDone }) {
  const [p, setP] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setP(1);
      const t = setTimeout(onDone, 120);
      return () => clearTimeout(t);
    }

    const duration = 2800;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 4;
      setP(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setP(1);
        setLeaving(true);
        setTimeout(onDone, 420);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  const pct = Math.round(p * 100);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: "var(--bg)",
        opacity: leaving ? 0 : 1,
        transition: "opacity 420ms cubic-bezier(.16,1,.3,1)",
      }}
      role="status"
      aria-label={`Loading ${pct} percent`}
    >
      <div className="w-[min(92vw,400px)]" style={{ perspective: "1400px" }}>
        <div
          className="relative mb-10 h-[104px] overflow-hidden rounded-[16px]"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--line)",
            boxShadow: "var(--e2)",
            transform: "rotateX(16deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 22px, var(--line) 22px 23px)",
              opacity: 0.45,
              transform: `translate3d(${-p * 180}px, 0, 0)`,
              willChange: "transform",
            }}
          />
          <div
            className="absolute left-[-18%] bottom-[6px] will-change-transform"
            style={{
              transform: `translate3d(${p * 112}%, 0, 36px) rotateX(4deg)`,
            }}
          >
            <Car spin={p * 720} />
          </div>
        </div>

        <div
          className="h-[2px] overflow-hidden rounded-full"
          style={{ background: "var(--surface-3)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${p * 100}%`,
              background: "var(--accent)",
              boxShadow: "0 0 12px rgba(200,246,92,0.25)",
            }}
          />
        </div>
        <div
          className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.24em]"
          style={{ color: "var(--text-3)" }}
        >
          <span>Kept</span>
          <span style={{ color: "var(--text-1)" }}>{String(pct).padStart(3, "0")}</span>
        </div>
      </div>
    </div>
  );
}
