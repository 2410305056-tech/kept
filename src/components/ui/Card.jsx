import React from "react";
import { useTilt } from "../../hooks/useTilt.js";

export function Card({
  children,
  clickable = false,
  tilt = false,
  maxTilt = 4.5,
  onClick,
  className = "",
  innerRef,
  style = {},
  ...props
}) {
  const tiltHook = useTilt(maxTilt);
  const ref = innerRef || (tilt ? tiltHook.ref : undefined);
  const combinedStyle = tilt ? { ...style, ...tiltHook.style } : style;

  const interactiveClass = clickable
    ? "cursor-pointer keycap-3d hover:border-[var(--line-strong)]"
    : "";

  const glareClass = tilt ? "card-glare depth" : "";

  return (
    <div
      ref={ref}
      onClick={clickable ? onClick : undefined}
      onPointerMove={tilt ? tiltHook.onPointerMove : undefined}
      onPointerLeave={tilt ? tiltHook.onPointerLeave : undefined}
      style={combinedStyle}
      className={`bg-[var(--surface-1)] border border-[var(--line)] rounded-[12px] p-5 shadow-[var(--e1)] transition-colors duration-140 ${interactiveClass} ${glareClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
