import React, { useState, useEffect, useRef } from "react";

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 500,
  placeholder = "0",
  className = "",
  ariaLabel = "Value",
  unit = "",
}) {
  const [internalVal, setInternalVal] = useState(value != null ? String(value) : "");
  const repeatTimer = useRef(null);
  const initialDelay = useRef(null);

  useEffect(() => {
    setInternalVal(value != null ? String(value) : "");
  }, [value]);

  const commitValue = (val) => {
    if (val === "" || isNaN(Number(val))) {
      onChange(null);
      setInternalVal("");
      return;
    }
    const num = Math.min(max, Math.max(min, Number(val)));
    const rounded = step < 1 ? Number(num.toFixed(1)) : Math.round(num);
    onChange(rounded);
    setInternalVal(String(rounded));
  };

  const adjust = (direction) => {
    const cur = internalVal === "" ? (direction > 0 ? min : min) : Number(internalVal);
    const next = cur + direction * step;
    commitValue(next);
  };

  const startRepeat = (direction) => {
    adjust(direction);
    initialDelay.current = setTimeout(() => {
      repeatTimer.current = setInterval(() => {
        adjust(direction);
      }, 80);
    }, 400);
  };

  const stopRepeat = () => {
    if (initialDelay.current) clearTimeout(initialDelay.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
  };

  return (
    <div
      className={`h-11 grid grid-cols-[44px_1fr_44px] items-center bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] focus-within:border-[var(--accent)] transition-colors duration-140 ${className}`}
    >
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        onPointerDown={() => startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        className="h-full w-full flex items-center justify-center text-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-3)] active:scale-95 transition-all cursor-pointer rounded-l-[7px] select-none"
      >
        −
      </button>

      <div className="flex items-center justify-center px-1">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={internalVal}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(e) => setInternalVal(e.target.value)}
          onBlur={() => commitValue(internalVal)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitValue(internalVal);
              e.currentTarget.blur();
            }
          }}
          className="w-full text-center bg-transparent text-base mono-num text-[var(--text-1)] placeholder-[var(--text-3)] outline-none"
        />
        {unit && <span className="text-xs text-[var(--text-3)] ml-0.5 select-none">{unit}</span>}
      </div>

      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        onPointerDown={() => startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        className="h-full w-full flex items-center justify-center text-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-3)] active:scale-95 transition-all cursor-pointer rounded-r-[7px] select-none"
      >
        +
      </button>
    </div>
  );
}
