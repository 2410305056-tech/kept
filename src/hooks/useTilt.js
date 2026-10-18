import { useState, useCallback, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion.js";

export function useTilt(maxTilt = 5) {
  const reduced = useReducedMotion();
  const [style, setStyle] = useState({});
  const cardRef = useRef(null);

  const onPointerMove = useCallback((e) => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // Never tilt if target is input, textarea, table, or editing
    const targetTag = e.target?.tagName?.toLowerCase();
    if (
      targetTag === "input" ||
      targetTag === "textarea" ||
      targetTag === "select" ||
      e.target?.isContentEditable ||
      e.target?.closest("table")
    ) {
      return;
    }

    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotY = Math.max(-maxTilt, Math.min(maxTilt, ((x - midX) / midX) * maxTilt));
    const rotX = Math.max(-maxTilt, Math.min(maxTilt, -((y - midY) / midY) * maxTilt));

    setStyle({
      transform: `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`,
      transition: "transform 90ms cubic-bezier(.16,1,.3,1)",
      "--mx": `${x}px`,
      "--my": `${y}px`,
    });
  }, [reduced, maxTilt]);

  const onPointerLeave = useCallback(() => {
    setStyle({
      transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 320ms cubic-bezier(.16,1,.3,1)",
    });
  }, []);

  return { ref: cardRef, style, onPointerMove, onPointerLeave };
}
