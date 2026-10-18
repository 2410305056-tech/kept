import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio.js";
import { Button } from "../ui/Button.jsx";

export function FrictionHoldModal({ isOpen, onClose, onCompleted }) {
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [breathSecond, setBreathSecond] = useState(4);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(120);
      setBreathPhase("Inhale");
      setBreathSecond(4);
      return;
    }

    sound.playZenBowlChime();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playZenBowlChime();
          if (onCompleted) onCompleted();
          return 0;
        }
        return prev - 1;
      });

      setBreathSecond((prevSec) => {
        if (prevSec <= 1) {
          setBreathPhase((prevPhase) => {
            if (prevPhase === "Inhale") return "Hold";
            if (prevPhase === "Hold") return "Exhale";
            if (prevPhase === "Exhale") return "Rest";
            return "Inhale";
          });
          return 4;
        }
        return prevSec - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const ringScale =
    breathPhase === "Inhale"
      ? 1 + (4 - breathSecond) * 0.08
      : breathPhase === "Hold"
      ? 1.32
      : breathPhase === "Exhale"
      ? 1.32 - (4 - breathSecond) * 0.08
      : 1.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--line-strong)] rounded-[16px] p-6 text-center space-y-6 shadow-[var(--e3)]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold">
            Tactical Delay Protocol · 120 Seconds
          </span>
          <h2 className="text-xl font-medium text-[var(--text-1)]">
            Friction Hold
          </h2>
        </div>

        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/50 transition-transform duration-1000 ease-in-out"
            style={{
              transform: `scale(${ringScale})`,
              boxShadow: "0 0 24px rgba(200, 246, 92, 0.15)"
            }}
          />

          <div
            className="absolute w-36 h-36 rounded-full bg-[var(--accent-soft)]/20 transition-transform duration-1000 ease-in-out"
            style={{ transform: `scale(${ringScale * 0.9})` }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-semibold tabular-nums text-[var(--text-1)]">
              {timeFormatted}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-medium mt-1">
              {breathPhase} ({breathSecond}s)
            </span>
          </div>
        </div>

        <p className="text-xs font-mono text-[var(--text-2)] leading-relaxed max-w-sm mx-auto">
          Urges are transient neurochemical spikes. Delaying by 120 seconds of rhythmic breathing lowers amygdala arousal and drops craving intensity by up to 80%.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="text-xs font-mono text-[var(--text-3)] hover:text-[var(--text-1)]"
          >
            Cancel Hold
          </Button>

          {secondsRemaining === 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={onClose}
              className="text-xs font-mono"
            >
              Impulse Cleared · Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
