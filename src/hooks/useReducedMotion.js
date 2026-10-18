import { useEffect, useState } from "react";
import { useStore } from "./useStore.js";

export function useReducedMotion() {
  const [state] = useStore();
  const [systemReduced, setSystemReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setSystemReduced(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const isReduced = Boolean(state?.settings?.reduceMotion || systemReduced);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isReduced) {
        document.documentElement.classList.add("reduced-motion-forced");
      } else {
        document.documentElement.classList.remove("reduced-motion-forced");
      }
    }
  }, [isReduced]);

  return isReduced;
}
