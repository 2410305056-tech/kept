import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function Odometer({
  value,
  className = "",
  unit = "",
}) {
  const reduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  if (reduced) {
    return (
      <span className={`mono-num inline-flex items-baseline ${className}`}>
        {value}
        {unit && <span className="ml-1 text-xs opacity-70">{unit}</span>}
      </span>
    );
  }

  const str = String(displayValue);

  return (
    <span className={`mono-num inline-flex items-baseline overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={str}
          initial={{ y: "30%", opacity: 0, filter: "blur(2px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-30%", opacity: 0, filter: "blur(2px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {str}
        </motion.span>
      </AnimatePresence>
      {unit && <span className="ml-1 text-xs opacity-70 select-none">{unit}</span>}
    </span>
  );
}
