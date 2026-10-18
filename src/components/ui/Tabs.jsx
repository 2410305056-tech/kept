import React from "react";
import { motion } from "motion/react";

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  layoutId = "activeTabPill",
}) {
  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % tabs.length;
      onChange(tabs[next].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + tabs.length) % tabs.length;
      onChange(tabs[prev].id);
    }
  };

  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-[var(--surface-1)] border border-[var(--line)] rounded-[10px] overflow-x-auto max-w-full ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative px-3.5 py-1.5 text-[11px] font-medium tracking-[0.08em] uppercase select-none transition-colors duration-140 cursor-pointer rounded-[7px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0 ${
              isActive ? "text-[var(--text-1)]" : "text-[var(--text-3)] hover:text-[var(--text-2)]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="absolute inset-0 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded-[7px] -z-10 shadow-[var(--e1)]"
              />
            )}
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge != null && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
