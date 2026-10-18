import React from "react";
import { NavLink } from "react-router-dom";

const MOBILE_ITEMS = [
  {
    to: "/",
    label: "Calendar",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
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
    to: "/progress",
    label: "Progress",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface-1)]/95 backdrop-blur-md border-t border-[var(--line)] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] select-none"
      aria-label="Mobile Navigation"
    >
      {MOBILE_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-12 rounded-[8px] transition-colors ${
              isActive ? "text-[var(--accent)]" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center mb-0.5">{item.icon}</div>
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
