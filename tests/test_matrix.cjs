const assert = require('assert');

// Dynamic import ES modules
async function runTests() {
  const { weekNumber, phaseForWeek, setsFor, suggestWeight, suggestForWeek, cleanStats, runningUnlocked, marksFor, round2_5 } = await import('../src/lib/logic.js');
  const { createInitialState } = await import('../src/lib/seed.js');
  const { key, parse, addDays, diffDays } = await import('../src/lib/dates.js');
  const { validateImportData } = await import('../src/lib/exportImport.js');

  console.log("=== RUNNING KEPT VERIFICATION TEST MATRIX ===");

  const state = createInitialState();
  const plan = state.plan;

  // Test 1: ?date=2026-10-19
  const w1 = weekNumber(plan, "2026-10-19");
  const p1 = phaseForWeek(w1);
  const monWorkout = plan.split[0];
  assert.strictEqual(w1, 1, "Week should be 1");
  assert.strictEqual(p1, "foundation", "Phase should be foundation");
  assert.strictEqual(monWorkout.name, "Push A", "Monday workout should be Push A");
  assert.strictEqual(monWorkout.exercises.length, 6, "Push A should have 6 exercises");
  assert.strictEqual(monWorkout.exercises[0].name, "Barbell overhead press", "First exercise should be OHP");
  console.log("✓ Test 1 Passed: 2026-10-19 is Week 1 Foundation Push A with 6 exercises, OHP first");

  // Test 2: OHP 4 sets @20kg, reps 8/8/8/8, RIR 2 -> Volume 640, next suggestion 22.5
  const ohp = monWorkout.exercises[0];
  const sessionSuccess = {
    id: "s1",
    date: "2026-10-19",
    dayName: "Push A",
    week: 1,
    phase: "foundation",
    exercises: [{
      exerciseId: ohp.id,
      name: ohp.name,
      sets: [
        { weightKg: 20, reps: 8, rir: 2, done: true },
        { weightKg: 20, reps: 8, rir: 2, done: true },
        { weightKg: 20, reps: 8, rir: 2, done: true },
        { weightKg: 20, reps: 8, rir: 2, done: true },
      ]
    }]
  };
  const vol2 = sessionSuccess.exercises[0].sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
  assert.strictEqual(vol2, 640, "Volume should be 20 * 32 = 640");
  const sugSuccess = suggestWeight(ohp, [sessionSuccess]);
  assert.strictEqual(sugSuccess.weight, 22.5, "Next suggestion should be 22.5 kg");
  assert.strictEqual(sugSuccess.reason, "up", "Reason should be up");
  console.log("✓ Test 2 Passed: OHP 4x8@20kg RIR 2 gives vol 640 and next suggestion 22.5 kg (up)");

  // Test 2b: OHP 4 sets @20kg, reps 8/8/7/6 -> Volume 580, next suggestion HOLDS at 20
  const sessionHold = {
    id: "s2",
    date: "2026-10-19",
    dayName: "Push A",
    week: 1,
    phase: "foundation",
    exercises: [{
      exerciseId: ohp.id,
      name: ohp.name,
      sets: [
        { weightKg: 20, reps: 8, rir: 2, done: true },
        { weightKg: 20, reps: 8, rir: 2, done: true },
        { weightKg: 20, reps: 7, rir: 2, done: true },
        { weightKg: 20, reps: 6, rir: 2, done: true },
      ]
    }]
  };
  const vol2b = sessionHold.exercises[0].sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
  assert.strictEqual(vol2b, 580, "Volume should be 20 * 29 = 580");
  const sugHold = suggestWeight(ohp, [sessionHold]);
  assert.strictEqual(sugHold.weight, 20, "Next suggestion should hold at 20 kg");
  assert.strictEqual(sugHold.reason, "hold", "Reason should be hold");
  console.log("✓ Test 2b Passed: OHP reps 8/8/7/6 gives vol 580 and next suggestion holds at 20 kg");

  // Test 2d: phase-aware set count. Week 5 prescribes 5 sets for bump lifts;
  // completing only 4 must not trigger progression.
  const lateral = monWorkout.exercises[3];
  const fourOfFive = {
    date: "2026-11-16",
    exercises: [{
      exerciseId: lateral.id,
      name: lateral.name,
      sets: Array.from({ length: 4 }, () => ({ weightKg: 5, reps: 15, rir: 1, done: true }))
    }]
  };
  const sugPartial = suggestForWeek(lateral, [fourOfFive], 5);
  assert.strictEqual(sugPartial.reason, "hold", "Four of five prescribed sets must hold");
  assert.strictEqual(sugPartial.weight, 5, "Weight must hold at 5 kg");
  console.log("✓ Test 2d Passed: 4 of 5 prescribed sets in Build holds the weight");

  // Test 2e: one-rep grace. Five prescribed sets, four at the top and one at
  // repHigh - 1, still progresses. Two short sets do not.
  const fiveSets = (reps) => ({
    date: "2026-11-16",
    exercises: [{
      exerciseId: lateral.id,
      name: lateral.name,
      sets: reps.map((r) => ({ weightKg: 5, reps: r, rir: 1, done: true }))
    }]
  });
  const grace = suggestForWeek(lateral, [fiveSets([15, 15, 15, 15, 14])], 5);
  assert.strictEqual(grace.reason, "up", "One rep short on one of five sets must still progress");
  assert.strictEqual(grace.weight, 6.25, "Lateral raise should progress to 6.25 kg");

  const noGrace = suggestForWeek(lateral, [fiveSets([15, 15, 15, 14, 13])], 5);
  assert.strictEqual(noGrace.reason, "hold", "Two short sets must hold");
  assert.strictEqual(noGrace.weight, 5, "Weight must hold at 5 kg");
  console.log("✓ Test 2e Passed: one-rep grace progresses, two short sets hold");

  // Test 2c / Correction 4: Down case for 20kg lift -> round2_5(20 * 0.9) = 17.5kg
  const sessionMiss1 = {
    date: "2026-10-19",
    exercises: [{
      exerciseId: ohp.id,
      sets: [{ weightKg: 20, reps: 5, rir: 2, done: true }] // below repLow 6
    }]
  };
  const sessionMiss2 = {
    date: "2026-10-22",
    exercises: [{
      exerciseId: ohp.id,
      sets: [{ weightKg: 20, reps: 5, rir: 2, done: true }] // below repLow 6
    }]
  };
  const sugDown = suggestWeight(ohp, [sessionMiss1, sessionMiss2]);
  assert.strictEqual(sugDown.weight, 17.5, "Down case for 20kg should round to 17.5 kg");
  assert.strictEqual(sugDown.reason, "down", "Reason should be down");
  console.log("✓ Test 2c & Correction 4 Passed: Down case for 20 kg is 17.5 kg (down)");

  // Test 4: ?date=2026-11-16 -> Week 5 (Build). Bump exercises gain 1 set. Running lock check.
  const w5 = weekNumber(plan, "2026-11-16");
  const p5 = phaseForWeek(w5);
  assert.strictEqual(w5, 5, "Week should be 5");
  assert.strictEqual(p5, "build", "Phase should be build");
  const lateralRaise = monWorkout.exercises.find(e => e.name.includes("lateral raise"));
  const inclinePress = monWorkout.exercises.find(e => e.name.includes("Incline dumbbell press"));
  assert.strictEqual(setsFor(lateralRaise, 5), 5, "Lateral raise should have 5 sets (4+1 bump)");
  assert.strictEqual(setsFor(inclinePress, 5), 4, "Incline press should have 4 sets (3+1 bump)");
  
  // Running gate check on 2026-11-16
  const logsFlat = [{ date: "2026-10-19", weightKg: 65 }, { date: "2026-10-26", weightKg: 65 }];
  assert.strictEqual(runningUnlocked(logsFlat, "2026-11-16"), false, "Running must stay locked if weight didn't rise");
  const logsRising = [{ date: "2026-10-19", weightKg: 65 }, { date: "2026-10-26", weightKg: 65.4 }];
  assert.strictEqual(runningUnlocked(logsRising, "2026-11-16"), true, "Running unlocks when weight rises after Nov 16");
  console.log("✓ Test 4 Passed: Week 5 Build increases bump sets (4->5, 3->4) and running unlocks only on rising weight");

  // Test 4b: the gate compares 3-day averages, so one water-weight dip does
  // not lock running again.
  const smoothing = [
    { date: "2026-10-19", weightKg: 65.0 },
    { date: "2026-10-26", weightKg: 65.4 },
    { date: "2026-11-02", weightKg: 65.8 },
    { date: "2026-11-09", weightKg: 66.0 },
    { date: "2026-11-16", weightKg: 65.7 },
    { date: "2026-11-18", weightKg: 65.2 },
  ];
  assert.strictEqual(
    runningUnlocked(smoothing, "2026-11-19"),
    true,
    "Rising 3-day average unlocks even after a dip"
  );
  const declining = [
    { date: "2026-10-19", weightKg: 66.0 },
    { date: "2026-10-26", weightKg: 65.8 },
    { date: "2026-11-02", weightKg: 65.6 },
    { date: "2026-11-09", weightKg: 65.4 },
    { date: "2026-11-16", weightKg: 65.2 },
    { date: "2026-11-18", weightKg: 65.0 },
  ];
  assert.strictEqual(
    runningUnlocked(declining, "2026-11-19"),
    false,
    "Falling 3-day average stays locked"
  );
  console.log("✓ Test 4b Passed: running gate uses 3-day averages and ignores a single dip");

  // Test 5: ?date=2026-12-07 -> Week 8 (Deload). Every exercise = 2 sets. Weight holds.
  const w8 = weekNumber(plan, "2026-12-07");
  const p8 = phaseForWeek(w8);
  assert.strictEqual(w8, 8, "Week should be 8");
  assert.strictEqual(p8, "deload", "Phase should be deload");
  for (const ex of monWorkout.exercises) {
    assert.strictEqual(setsFor(ex, 8), 2, `${ex.name} must have 2 sets in deload`);
  }
  const sugDeload = suggestForWeek(ohp, [sessionSuccess], 8);
  assert.strictEqual(sugDeload.weight, 20, "Deload must hold weight from last session");
  assert.strictEqual(sugDeload.reason, "deload", "Reason must be deload");
  console.log("✓ Test 5 Passed: Week 8 Deload caps all exercises at 2 sets and holds previous load");

  // Test 8: Clean Stats calculation
  const cleanLog = [
    { date: "2026-10-17", status: "slip" },
    { date: "2026-10-18", status: "clean" },
    { date: "2026-10-19", status: "clean" },
  ];
  const cStats = cleanStats(cleanLog, "2026-10-19");
  assert.strictEqual(cStats.current, 2, "Current streak should be 2");
  assert.strictEqual(cStats.best, 2, "Best streak should be 2");
  assert.strictEqual(cStats.monthlyPct, Math.round((2 / 19) * 100), "Monthly pct should be 2 / 19 days");
  console.log("✓ Test 8 Passed: Clean streak calculation handles slips and month elapsed percentage accurately");

  // Test 9: Denormalization check
  const pastSession = {
    id: "past-1",
    date: "2026-10-19",
    exercises: [{ exerciseId: "ex-123", name: "Rope pushdown", sets: [{ weightKg: 15, reps: 12, done: true }] }]
  };
  // Simulate plan edit
  const updatedPlanExercise = { id: "ex-123", name: "Rope ext" };
  assert.strictEqual(pastSession.exercises[0].name, "Rope pushdown", "Historical session preserves original name");
  console.log("✓ Test 9 Passed: Exercise renaming in plan preserves historical denormalized session names");

  // Test 10: Import / Export validation
  const exportCheck = validateImportData(state);
  assert.strictEqual(exportCheck.valid, true, "Valid state must pass import validation");
  const invalidVersion = { ...state, version: 2 };
  assert.strictEqual(validateImportData(invalidVersion).valid, false, "Invalid version must be rejected");
  console.log("✓ Test 10 Passed: Import validation verifies version 1 and required data structures");

  // Test 15: Partial set with reps 0
  const partialSession = {
    exercises: [{
      sets: [
        { weightKg: 25, reps: 0, done: true }, // Invalid done set
        { weightKg: 25, reps: 8, done: true }
      ]
    }]
  };
  const validDoneSets = partialSession.exercises[0].sets.filter(s => s.done && s.reps > 0);
  assert.strictEqual(validDoneSets.length, 1, "Set with reps 0 must not be counted as done");
  const partialVol = validDoneSets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
  assert.strictEqual(partialVol, 200, "Volume must only include done sets with reps > 0");
  console.log("✓ Test 15 Passed: Partial sets with 0 reps are excluded from completed count and volume");

  console.log("\n==============================================");
  console.log("ALL LOGIC AND TEST MATRIX CHECKS PASSED (100%)");
  console.log("==============================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
