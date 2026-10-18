import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  side = "right", // "right" (desktop) or "bottom" (mobile default)
}) {
  const reduced = useReducedMotion();
  const prevFocusRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement;
      panelRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        prevFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-[2px]"
          />

          {/* Desktop right drawer / Mobile bottom sheet */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={
              reduced
                ? { opacity: 0 }
                : {
                    x: "100%",
                    y: 0,
                  }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : {
                    x: 0,
                    y: 0,
                  }
            }
            exit={
              reduced
                ? { opacity: 0 }
                : {
                    x: "100%",
                    y: 0,
                  }
            }
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative z-10 w-full sm:max-w-[400px] h-full bg-[var(--surface-1)] border-l border-[var(--line)] shadow-[var(--e3)] flex flex-col focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <h2 className="text-base font-medium tracking-tight text-[var(--text-1)]">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
