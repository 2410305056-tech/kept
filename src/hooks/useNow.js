import { useState, useEffect } from "react";
import { getTodayKey } from "../lib/store.js";

export function useNow() {
  const [today, setToday] = useState(getTodayKey());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      const curToday = getTodayKey();
      setToday((prev) => (prev !== curToday ? curToday : prev));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { today, now };
}
