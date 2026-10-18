import React, { useState } from "react";
import { useStore } from "../hooks/useStore.js";
import { resetToSeed } from "../lib/store.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Stepper } from "../components/ui/Stepper.jsx";
import { Checkbox } from "../components/ui/Checkbox.jsx";
import { Chip } from "../components/ui/Chip.jsx";

export function GymPlan() {
  const [state, setState] = useStore();
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const split = state.plan.split || [];
  const activeDay = split[activeDayIdx];

  const updateSplit = (newSplit) => {
    setState((prev) => ({
      ...prev,
      plan: { ...prev.plan, split: newSplit },
    }));
  };

  const handleExerciseChange = (exIdx, field, val) => {
    const newSplit = [...split];
    const newDay = { ...newSplit[activeDayIdx] };
    const newExercises = [...newDay.exercises];
    newExercises[exIdx] = { ...newExercises[exIdx], [field]: val };
    newDay.exercises = newExercises;
    newSplit[activeDayIdx] = newDay;
    updateSplit(newSplit);
  };

  const handleAddExercise = () => {
    const newSplit = [...split];
    const newDay = { ...newSplit[activeDayIdx] };
    newDay.exercises.push({
      id: crypto.randomUUID(),
      name: "New Exercise",
      sets: 3,
      repLow: 8,
      repHigh: 10,
      rir: 2,
      startWeightKg: 20,
      incrementKg: 2.5,
      isIsolation: false,
      bump: false,
      note: "",
    });
    newSplit[activeDayIdx] = newDay;
    updateSplit(newSplit);
  };

  const handleRemoveExercise = (exIdx) => {
    const newSplit = [...split];
    const newDay = { ...newSplit[activeDayIdx] };
    newDay.exercises.splice(exIdx, 1);
    newSplit[activeDayIdx] = newDay;
    updateSplit(newSplit);
  };

  const handleMoveExercise = (exIdx, direction) => {
    const newSplit = [...split];
    const newDay = { ...newSplit[activeDayIdx] };
    const targetIdx = exIdx + direction;
    if (targetIdx < 0 || targetIdx >= newDay.exercises.length) return;

    const temp = newDay.exercises[exIdx];
    newDay.exercises[exIdx] = newDay.exercises[targetIdx];
    newDay.exercises[targetIdx] = temp;

    newSplit[activeDayIdx] = newDay;
    updateSplit(newSplit);
  };

  const handleReset = () => {
    resetToSeed();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Split Days Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {split.map((day, idx) => (
          <button
            key={day.day}
            type="button"
            onClick={() => setActiveDayIdx(idx)}
            className={`px-3.5 py-2 rounded-[8px] border text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              activeDayIdx === idx
                ? "bg-[var(--surface-2)] border-[var(--accent)] text-[var(--accent)]"
                : "bg-[var(--surface-1)] border-[var(--line)] text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            {day.day}: {day.name}
          </button>
        ))}
      </div>

      {/* Active Day Detail */}
      {activeDay && (
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
            <div>
              <span className="text-xs font-mono text-[var(--accent)] uppercase">
                {activeDay.day} Workout
              </span>
              <h3 className="text-lg font-medium text-[var(--text-1)]">{activeDay.name}</h3>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-mono text-[var(--text-2)] cursor-pointer">
                <Checkbox
                  checked={activeDay.rest}
                  onChange={(checked) => {
                    const newSplit = [...split];
                    newSplit[activeDayIdx] = { ...activeDay, rest: checked };
                    updateSplit(newSplit);
                  }}
                />
                Rest Day
              </label>
              {!activeDay.rest && (
                <Button variant="ghost" size="md" onClick={handleAddExercise}>
                  + Add Lift
                </Button>
              )}
            </div>
          </div>

          {!activeDay.rest && (
            <div className="space-y-4">
              {activeDay.exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => handleExerciseChange(exIdx, "name", e.target.value)}
                      className="bg-transparent text-sm font-medium text-[var(--text-1)] border-b border-transparent hover:border-[var(--line)] focus:border-[var(--accent)] outline-none flex-1 py-1"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={exIdx === 0}
                        onClick={() => handleMoveExercise(exIdx, -1)}
                        className="px-2 py-1 text-xs text-[var(--text-3)] hover:text-[var(--text-1)] disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={exIdx === activeDay.exercises.length - 1}
                        onClick={() => handleMoveExercise(exIdx, 1)}
                        className="px-2 py-1 text-xs text-[var(--text-3)] hover:text-[var(--text-1)] disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="px-2 py-1 text-xs text-[var(--danger)] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Config fields grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[var(--text-3)] block mb-1">
                        Sets
                      </label>
                      <Stepper
                        min={1}
                        max={10}
                        value={ex.sets}
                        onChange={(v) => handleExerciseChange(exIdx, "sets", v || 1)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[var(--text-3)] block mb-1">
                        Rep Low
                      </label>
                      <Stepper
                        min={1}
                        max={30}
                        value={ex.repLow}
                        onChange={(v) => handleExerciseChange(exIdx, "repLow", v || 6)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[var(--text-3)] block mb-1">
                        Rep High
                      </label>
                      <Stepper
                        min={1}
                        max={30}
                        value={ex.repHigh}
                        onChange={(v) => handleExerciseChange(exIdx, "repHigh", v || 8)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[var(--text-3)] block mb-1">
                        Start (kg)
                      </label>
                      <Stepper
                        step={0.5}
                        min={0}
                        max={500}
                        value={ex.startWeightKg}
                        onChange={(v) => handleExerciseChange(exIdx, "startWeightKg", v)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[var(--text-3)] block mb-1">
                        Increment
                      </label>
                      <Stepper
                        step={1.25}
                        min={0}
                        max={20}
                        value={ex.incrementKg}
                        onChange={(v) => handleExerciseChange(exIdx, "incrementKg", v || 2.5)}
                      />
                    </div>
                  </div>

                  {/* Bump & Isolation flags */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-[var(--text-2)]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ex.bump}
                        onChange={(checked) => handleExerciseChange(exIdx, "bump", checked)}
                      />
                      <span>Volume Bump (+1 set in Build/Push)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ex.isIsolation}
                        onChange={(checked) => handleExerciseChange(exIdx, "isIsolation", checked)}
                      />
                      <span>Isolation (75s rest)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Destructive Reset Confirmation - Inline per Correction #2 */}
      <Card className="border-[var(--line-strong)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-medium text-[var(--text-1)]">Reset to Original Plan</h4>
            <p className="text-xs text-[var(--text-3)]">
              Restores the default 12-week split and progression parameters. Past logged sessions will not be lost.
            </p>
          </div>
          {!showResetConfirm ? (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowResetConfirm(true)}
              className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/10"
            >
              Reset Plan
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="md" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleReset}
                className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
              >
                Confirm Reset
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
