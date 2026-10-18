import { Logo } from "../ui/Logo.jsx";
import React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Calendar",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </svg>
    ),
  },
  {
    to: "/gym",
    label: "Gym",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
      </svg>
    ),
  },
  {
    to: "/study",
    label: "Study",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    to: "/clean",
    label: "Clean",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>
    ),
  },
  {
    to: "/running",
    label: "Running",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    to: "/progress",
    label: "Progress",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export function Rail() {
  return (
    <aside className="hidden md:flex flex-col items-center w-[72px] shrink-0 h-screen sticky top-0 bg-[var(--surface-1)] border-r border-[var(--line)] py-6 z-40 select-none">
      {/* Brand logo: wordmark in mono + accent dot */}
      <div className="mb-8 flex justify-center">
        <Logo size="sm" showWordmark={false} />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-2 w-full px-2" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative group flex flex-col items-center justify-center py-2.5 rounded-[8px] transition-all duration-140 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isActive
                  ? "text-[var(--accent)] bg-[var(--surface-2)]"
                  : "text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* 2px left active tick */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--accent)] rounded-r" />
                )}
                <div className="w-5 h-5 flex items-center justify-center mb-1">{item.icon}</div>
                <span className="text-[10px] font-medium tracking-tight font-sans">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
