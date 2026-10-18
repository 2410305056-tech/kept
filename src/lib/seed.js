const ex = (name, sets, repLow, repHigh, rir, startWeightKg, incrementKg, opts = {}) => ({
  id: opts.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ex-${Math.random().toString(36).slice(2, 9)}`),
  name,
  sets,
  repLow,
  repHigh,
  rir,
  startWeightKg,
  incrementKg,
  isIsolation: !!opts.iso,
  bump: !!opts.bump,
  note: opts.note || ""
});

export const createSeedSplit = () => [
  { day: "Mon", name: "Push A", rest: false, exercises: [
    ex("Barbell overhead press", 4, 6, 8, 2, 20, 2.5, { note: "Empty bar, +2.5 kg per session" }),
    ex("Flat barbell bench", 3, 6, 8, 2, 45, 2.5, { note: "Expect 40–50 kg; dumbbell bench is your stronger lift" }),
    ex("Incline dumbbell press", 3, 8, 10, 2, 17.5, 2.5, { bump: true, note: "15–20 kg per hand" }),
    ex("Cable lateral raise (single arm)", 4, 12, 15, 1, 5, 1.25, { iso: true, bump: true, note: "Very light stack" }),
    ex("Overhead cable triceps extension", 3, 10, 12, 1, null, 1.25, { iso: true }),
    ex("Rope pushdown", 2, 12, 15, 1, null, 1.25, { iso: true })
  ]},
  { day: "Tue", name: "Pull A", rest: false, exercises: [
    ex("Lat pulldown", 4, 8, 10, 1, 40, 2.5, { note: "Chest high, 1s pause at the bottom" }),
    ex("Chest-supported T-bar row", 4, 8, 10, 1, 20, 2.5),
    ex("Close-grip low row", 3, 10, 12, 1, 35, 2.5),
    ex("Rear-delt fly", 3, 12, 15, 1, 5, 1.25, { iso: true, bump: true }),
    ex("Incline dumbbell curl", 3, 10, 12, 1, 8, 1.25, { iso: true }),
    ex("Hammer curl", 2, 10, 12, 1, 8, 1.25, { iso: true })
  ]},
  { day: "Wed", name: "Legs A", rest: false, exercises: [
    ex("Barbell squat", 4, 6, 8, 2, 20, 5, { note: "Rack safety arms set; bar, +5 kg per session" }),
    ex("45° leg press", 3, 10, 12, 1, 115, 5),
    ex("Romanian deadlift", 3, 8, 10, 2, 50, 5, { note: "Hips back, bar close to legs" }),
    ex("Seated leg curl", 3, 10, 12, 1, 30, 2.5, { iso: true }),
    ex("Leg extension", 3, 12, 12, 1, 25, 2.5, { iso: true }),
    ex("Standing calf raise", 4, 12, 15, 1, 40, 2.5, { iso: true, note: "Stretch bottom, pause top" })
  ]},
  { day: "Thu", name: "Push B", rest: false, exercises: [
    ex("Seated dumbbell overhead press", 4, 8, 10, 2, 9, 1.25),
    ex("Incline dumbbell press", 3, 8, 10, 2, 17.5, 2.5, { bump: true }),
    ex("Chest press machine", 3, 10, 12, 1, 40, 2.5),
    ex("Dumbbell lateral raise", 4, 15, 15, 1, 4.5, 1.25, { iso: true, bump: true }),
    ex("Cable chest fly", 3, 12, 15, 1, 10, 1.25, { iso: true }),
    ex("Triceps pushdown", 3, 10, 12, 1, 15, 1.25, { iso: true })
  ]},
  { day: "Fri", name: "Pull B", rest: false, exercises: [
    ex("Deadlift", 3, 5, 5, 2, 90, 5, { note: "Week 1 = form check, then +5 kg/week" }),
    ex("Neutral-grip lat pulldown", 3, 8, 10, 1, 40, 2.5),
    ex("Chin-up negatives", 3, 3, 5, 1, null, 0, { iso: true, note: "5 seconds to lower" }),
    ex("Wide cable row", 3, 10, 12, 1, 35, 2.5),
    ex("Face pull", 3, 15, 15, 1, 15, 1.25, { iso: true }),
    ex("Preacher curl", 3, 10, 12, 1, 12.5, 1.25, { iso: true }),
    ex("Cable lateral raise", 3, 15, 15, 1, 5, 1.25, { iso: true })
  ]},
  { day: "Sat", name: "Legs B + core", rest: false, exercises: [
    ex("45° leg press (high/wide)", 4, 10, 12, 1, 115, 5),
    ex("Seated leg curl", 3, 10, 12, 1, 30, 2.5, { iso: true }),
    ex("Dumbbell walking lunges", 3, 10, 10, 1, 8, 1.25, { note: "10 per leg" }),
    ex("Hip abductor", 3, 12, 15, 1, 30, 2.5, { iso: true }),
    ex("Hip adductor", 2, 12, 12, 1, 30, 2.5, { iso: true }),
    ex("Standing calf raise", 4, 15, 15, 1, 40, 2.5, { iso: true }),
    ex("45° hyperextension", 3, 12, 12, 1, null, 0, { iso: true }),
    ex("Hanging knee raise / cable crunch", 3, 12, 12, 1, null, 0, { iso: true })
  ]},
  { day: "Sun", name: "Rest", rest: true, exercises: [] }
];

export const createInitialState = () => ({
  version: 1,
  profile: { name: "Yash", heightCm: 183, startWeightKg: 65, startWaistCm: null },
  plan: {
    name: "12-Week Muscle-Building Plan",
    startDate: "2026-10-19",
    endDate: "2027-01-10",
    testDate: "2027-01-11",
    phases: [
      { key: "foundation", name: "Foundation", startWeek: 1, endWeek: 4 },
      { key: "build", name: "Build", startWeek: 5, endWeek: 7 },
      { key: "deload", name: "Deload", startWeek: 8, endWeek: 8 },
      { key: "push", name: "Push", startWeek: 9, endWeek: 12 }
    ],
    split: createSeedSplit(),
    nutrition: {
      kcalLow: 2850,
      kcalHigh: 2950,
      proteinMin: 110,
      proteinMax: 145,
      waterLow: 2.5,
      waterHigh: 3.5,
      ramp: [
        { week: 1, item: "Post-gym meal (50 g peanuts + milk or sattu)", kcal: 430, protein: 20 },
        { week: 2, item: "4 pm snack (roasted chana + banana)", kcal: 285, protein: 11 },
        { week: 3, item: "Mid-morning snack (peanuts + banana)", kcal: 330, protein: 11 },
        { week: 4, item: "Full menu", kcal: 0, protein: 0 }
      ]
    },
    targets: {
      weightKg: [68, 69.5],
      waistGrowthCmMax: 2,
      dbBenchKg: [30, 32.5],
      squatKg: [60, 70],
      deadliftKg: [115, 120],
      ohpKg: [35, 40],
      legPressKg: 150,
      firstChinUp: true
    }
  },
  sessions: [],
  bodyLogs: [],
  fuelLogs: [],
  studySessions: [],
  activeTimer: { startedAt: null },
  cleanLog: [],
  runs: [],
  fees: [],
  settings: {
    studyTargetHours: 2,
    reminders: true,
    reduceMotion: false,
    hadTestDayNotice: false,
    soundEnabled: false,
    cleanExtras: false,
    lastExportAt: null
  }
});
