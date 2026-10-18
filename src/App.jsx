import React, { Suspense, lazy } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AppShell } from "./components/layout/AppShell.jsx";
import { useReducedMotion } from "./hooks/useReducedMotion.js";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";

const CalendarPage = lazy(() => import("./routes/CalendarPage.jsx").then((m) => ({ default: m.CalendarPage })));
const GymPage = lazy(() => import("./routes/GymPage.jsx").then((m) => ({ default: m.GymPage })));
const StudyPage = lazy(() => import("./routes/StudyPage.jsx").then((m) => ({ default: m.StudyPage })));
const CleanPage = lazy(() => import("./routes/CleanPage.jsx").then((m) => ({ default: m.CleanPage })));
const RunningPage = lazy(() => import("./routes/RunningPage.jsx").then((m) => ({ default: m.RunningPage })));
const ProgressPage = lazy(() => import("./routes/ProgressPage.jsx").then((m) => ({ default: m.ProgressPage })));

function AnimatedRoutes() {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: 12, rotateX: 2.5 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: -8, rotateX: -1.5 }}
        transition={{
          duration: reduced ? 0.01 : 0.28,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ perspective: 1200, transformStyle: "preserve-3d" }}
      >
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs font-mono text-[var(--text-3)]">·</div>}>
            <Routes location={location}>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/gym" element={<GymPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/clean" element={<CleanPage />} />
              <Route path="/running" element={<RunningPage />} />
              <Route path="/progress" element={<ProgressPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/*" element={<AnimatedRoutes />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
