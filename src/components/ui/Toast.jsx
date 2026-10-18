import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function Toast({
  toast,
  onDismiss,
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduced ? 0.01 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded-[10px] shadow-[var(--e2)] text-[13px] text-[var(--text-1)]"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  onDismiss();
                }}
                className="text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer ml-auto"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
