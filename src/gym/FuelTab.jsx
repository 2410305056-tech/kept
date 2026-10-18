import React, { useState } from "react";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { weekNumber } from "../lib/logic.js";
import { Card } from "../components/ui/Card.jsx";
import { ProgressRing } from "../components/ui/ProgressRing.jsx";
import { Stepper } from "../components/ui/Stepper.jsx";
import { Checkbox } from "../components/ui/Checkbox.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PanelBoundary } from "../components/ui/ErrorBoundary.jsx";

export function FuelTab() {
  const [state, setState] = useStore();
  const { today, now } = useNow();

  const curWeek = weekNumber(state.plan, today);
  const rampIndex = Math.min(3, Math.max(0, curWeek - 1));
  const rampStep = state.plan.nutrition.ramp[rampIndex];

  const todayFuel = state.fuelLogs.find((f) => f.date === today) || {
    date: today,
    kcal: 0,
    proteinG: 0,
    waterL: 0,
    postGymMeal: false,
  };

  const [sampleDayOpen, setSampleDayOpen] = useState(false);

  const updateFuel = (field, val) => {
    const updated = { ...todayFuel, [field]: val };
    setState((prev) => {
      const filtered = prev.fuelLogs.filter((f) => f.date !== today);
      return { ...prev, fuelLogs: [...filtered, updated] };
    });
  };

  const addQuick = (field, amount) => {
    const current = Number(todayFuel[field] || 0);
    const updatedVal = Math.round((current + amount) * 100) / 100;
    updateFuel(field, updatedVal);
  };

  // Progress calculations based on week's ramp
  const targetKcal = rampStep ? 2700 + (rampStep.week - 1) * 80 : 2950;
  const targetProtein = 140;
  const targetWater = 3.5;

  const kcalProgress = todayFuel.kcal / targetKcal;
  const proteinProgress = todayFuel.proteinG / targetProtein;
  const waterProgress = todayFuel.waterL / targetWater;

  const isAfter8PM = now.getHours() >= 20;

  return (
    <div className="space-y-6">
      {/* 3 Progress Rings Header */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Daily Targets (Week {curWeek})
          </h3>
          <span className="text-[11px] font-mono text-[var(--accent)]">
            Target: {targetKcal} kcal · {targetProtein}g pro
          </span>
        </div>

        <PanelBoundary>
          <div className="grid grid-cols-3 gap-2 sm:gap-6 py-2">
            <ProgressRing
              size={88}
              progress={kcalProgress}
              valueText={`${todayFuel.kcal}`}
              subText={`/${targetKcal}`}
              label="Calories"
            />
            <ProgressRing
              size={88}
              progress={proteinProgress}
              valueText={`${todayFuel.proteinG}g`}
              subText={`/${targetProtein}g`}
              label="Protein"
            />
            <ProgressRing
              size={88}
              progress={waterProgress}
              valueText={`${todayFuel.waterL}L`}
              subText={`/${targetWater}L`}
              label="Water"
            />
          </div>
        </PanelBoundary>
      </Card>

      {/* Fuel Inputs & Quick Action Chips */}
      <Card className="space-y-5">
        <h3 className="text-sm font-medium text-[var(--text-1)]">Log Fuel & Hydration</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Calories */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-[var(--text-3)]">
                Calories (kcal)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addQuick("kcal", 250)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] hover:bg-[var(--line-strong)] text-[var(--text-2)] transition-colors cursor-pointer"
                >
                  +250
                </button>
                <button
                  type="button"
                  onClick={() => addQuick("kcal", 500)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] hover:bg-[var(--line-strong)] text-[var(--text-2)] transition-colors cursor-pointer"
                >
                  +500
                </button>
              </div>
            </div>
            <Stepper
              step={50}
              min={0}
              max={5000}
              value={todayFuel.kcal || ""}
              placeholder="0"
              onChange={(v) => updateFuel("kcal", v || 0)}
              unit="kcal"
            />
          </div>

          {/* Protein */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-[var(--text-3)]">
                Protein (grams)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addQuick("proteinG", 15)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] hover:bg-[var(--line-strong)] text-[var(--text-2)] transition-colors cursor-pointer"
                >
                  +15g
                </button>
                <button
                  type="button"
                  onClick={() => addQuick("proteinG", 30)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] hover:bg-[var(--line-strong)] text-[var(--text-2)] transition-colors cursor-pointer"
                >
                  +30g
                </button>
              </div>
            </div>
            <Stepper
              step={5}
              min={0}
              max={300}
              value={todayFuel.proteinG || ""}
              placeholder="0"
              onChange={(v) => updateFuel("proteinG", v || 0)}
              unit="g"
            />
          </div>

          {/* Water */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-[var(--text-3)]">
                Water (litres)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addQuick("waterL", 0.25)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] hover:bg-[var(--line-strong)] text-[var(--text-2)] transition-colors cursor-pointer"
                  title="One glass of water"
                >
                  +250ml
                </button>
                <button
                  type="button"
                  onClick={() => addQuick("waterL", 0.5)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] hover:bg-[var(--line-strong)] text-[var(--text-2)] transition-colors cursor-pointer"
                  title="One bottle of water"
                >
                  +500ml
                </button>
              </div>
            </div>
            <Stepper
              step={0.25}
              min={0}
              max={10}
              value={todayFuel.waterL || ""}
              placeholder="0"
              onChange={(v) => updateFuel("waterL", v || 0)}
              unit="L"
            />
          </div>
        </div>

        {/* Post-Gym Meal Checkbox */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-[8px] border transition-colors ${
            !todayFuel.postGymMeal && isAfter8PM
              ? "bg-[var(--warn)]/10 border-[var(--warn)] text-[var(--warn)]"
              : "bg-[var(--surface-2)] border-[var(--line)] text-[var(--text-2)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={todayFuel.postGymMeal}
              onChange={(checked) => updateFuel("postGymMeal", checked)}
            />
            <span className="text-xs font-mono">
              Post-gym meal (50 g peanuts + milk or sattu)
            </span>
          </div>
          {!todayFuel.postGymMeal && isAfter8PM && (
            <span className="text-[10px] font-mono uppercase font-semibold text-[var(--warn)]">
              Pending post 8pm
            </span>
          )}
        </div>
      </Card>

      {/* Week's Ramp Step */}
      {rampStep && (
        <Card className="space-y-2 border-l-2 border-l-[var(--accent)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--accent)] uppercase font-semibold">
              Week {rampStep.week} Food Ramp Milestone
            </span>
            <span className="text-xs font-mono text-[var(--text-3)]">
              +{rampStep.kcal} kcal · +{rampStep.protein}g protein
            </span>
          </div>
          <p className="text-sm text-[var(--text-1)]">{rampStep.item}</p>
        </Card>
      )}

      {/* Static Collapsible Sample Day */}
      <Card className="space-y-3">
        <div
          onClick={() => setSampleDayOpen(!sampleDayOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <h4 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-2)]">
            Reference Day Menu (2850–2950 kcal)
          </h4>
          <span className="text-xs text-[var(--text-3)]">{sampleDayOpen ? "▲" : "▼"}</span>
        </div>

        {sampleDayOpen && (
          <div className="pt-2 border-t border-[var(--line)] space-y-2 text-xs font-mono text-[var(--text-3)]">
            <div>
              <strong className="text-[var(--text-2)]">Breakfast (8:30 am):</strong> Oats / parathas + 2 glasses whole milk (650 kcal, 22g protein)
            </div>
            <div>
              <strong className="text-[var(--text-2)]">Mid-morning (11:30 am):</strong> Peanuts + banana (330 kcal, 11g protein)
            </div>
            <div>
              <strong className="text-[var(--text-2)]">Lunch (1:30 pm):</strong> Dal, rice, roti, sabzi, curd (750 kcal, 25g protein)
            </div>
            <div>
              <strong className="text-[var(--text-2)]">Pre-gym (5:00 pm):</strong> Roasted chana + banana (285 kcal, 11g protein)
            </div>
            <div>
              <strong className="text-[var(--text-2)]">Post-gym (8:30 pm):</strong> Milk with sattu / roasted peanuts (430 kcal, 20g protein)
            </div>
            <div>
              <strong className="text-[var(--text-2)]">Dinner (9:30 pm):</strong> Paneer / egg bhurji, roti, dal (500 kcal, 30g protein)
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
