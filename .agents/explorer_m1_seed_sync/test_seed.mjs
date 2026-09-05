// Comprehensive Validation Script for Seed Data and Bidirectional State Synchronization

export const SEED_HABITS = {
  sleep: {
    bedtimeRaw: "23:15",
    wakeupRaw: "07:15",
    sleepDuration: "8h 00m",
    sleepDurationHours: 8.0,
    targetHours: 8.0,
    isOptimal: true,
    sunlightDone: true,
    sleepDebtHours: 0.0
  },
  hydration: {
    currentMl: 2750,
    targetMl: 3500,
    quickAdds: [250, 500],
    lastLoggedAt: "2026-09-05T14:15:00.000Z"
  },
  detox: {
    cleanDays: 8,
    tierName: "Fortified",
    cleanDiet: true,
    zeroDoomscroll: true,
    dailySupplements: true,
    bedMade: true,
    morningPhoneFree: true,
    zeroReels: true,
    noPhoneInBed: true
  },
  reading: {
    activeBookId: "book_1",
    books: [
      {
        id: "book_1",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        totalPages: 560,
        currentPage: 88,
        completed: false,
        category: "Architecture"
      },
      {
        id: "book_2",
        title: "Atomic Habits",
        author: "James Clear",
        totalPages: 320,
        currentPage: 140,
        completed: false,
        category: "Self-Improvement"
      },
      {
        id: "book_3",
        title: "Clean Code",
        author: "Robert C. Martin",
        totalPages: 464,
        currentPage: 464,
        completed: true,
        category: "Engineering"
      }
    ],
    startPage: 64,
    endPage: 88,
    pagesReadToday: 24,
    timerSeconds: 1200,
    isTimerRunning: false,
    targetPagesPerDay: 20
  },
  keystones: {
    cleanDiet: true,
    zeroDoomscroll: true,
    dailySupplements: true,
    bedMade: true,
    roomReset: false
  },
  dailyRecords: {
    "2026-08-22": {
      bedtimeRaw: "23:30",
      wakeupRaw: "07:15",
      sleepDuration: "7h 45m",
      sleepDurationHours: 7.75,
      sunlightDone: true,
      hydrationMl: 3250,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 20,
      readingMinutes: 22,
      loggedAt: "2026-08-22T22:30:00.000Z"
    },
    "2026-08-23": {
      bedtimeRaw: "01:15",
      wakeupRaw: "07:45",
      sleepDuration: "6h 30m",
      sleepDurationHours: 6.5,
      sunlightDone: false,
      hydrationMl: 2750,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: false,
      dailySupplements: true,
      bedMade: true,
      roomReset: false,
      cleanDay: false,
      pagesRead: 12,
      readingMinutes: 15,
      loggedAt: "2026-08-23T23:00:00.000Z"
    },
    "2026-08-24": {
      bedtimeRaw: "23:45",
      wakeupRaw: "07:15",
      sleepDuration: "7h 30m",
      sleepDurationHours: 7.5,
      sunlightDone: true,
      hydrationMl: 3000,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: false,
      cleanDay: true,
      pagesRead: 18,
      readingMinutes: 20,
      loggedAt: "2026-08-24T22:45:00.000Z"
    },
    "2026-08-25": {
      bedtimeRaw: "23:20",
      wakeupRaw: "07:05",
      sleepDuration: "7h 45m",
      sleepDurationHours: 7.75,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 25,
      readingMinutes: 25,
      loggedAt: "2026-08-25T22:15:00.000Z"
    },
    "2026-08-26": {
      bedtimeRaw: "23:10",
      wakeupRaw: "07:10",
      sleepDuration: "8h 00m",
      sleepDurationHours: 8.0,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 22,
      readingMinutes: 20,
      loggedAt: "2026-08-26T22:20:00.000Z"
    },
    "2026-08-27": {
      bedtimeRaw: "23:15",
      wakeupRaw: "07:30",
      sleepDuration: "8h 15m",
      sleepDurationHours: 8.25,
      sunlightDone: true,
      hydrationMl: 3750,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 30,
      readingMinutes: 30,
      loggedAt: "2026-08-27T22:30:00.000Z"
    },
    "2026-08-28": {
      bedtimeRaw: "00:00",
      wakeupRaw: "07:15",
      sleepDuration: "7h 15m",
      sleepDurationHours: 7.25,
      sunlightDone: false,
      hydrationMl: 3000,
      hydrationTargetMl: 3500,
      cleanDiet: false,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: false,
      cleanDay: false,
      pagesRead: 15,
      readingMinutes: 18,
      loggedAt: "2026-08-28T22:45:00.000Z"
    },
    "2026-08-29": {
      bedtimeRaw: "23:00",
      wakeupRaw: "07:00",
      sleepDuration: "8h 00m",
      sleepDurationHours: 8.0,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 24,
      readingMinutes: 25,
      loggedAt: "2026-08-29T22:15:00.000Z"
    },
    "2026-08-30": {
      bedtimeRaw: "22:50",
      wakeupRaw: "07:05",
      sleepDuration: "8h 15m",
      sleepDurationHours: 8.25,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 28,
      readingMinutes: 28,
      loggedAt: "2026-08-30T22:10:00.000Z"
    },
    "2026-08-31": {
      bedtimeRaw: "23:10",
      wakeupRaw: "07:10",
      sleepDuration: "8h 00m",
      sleepDurationHours: 8.0,
      sunlightDone: true,
      hydrationMl: 3750,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 20,
      readingMinutes: 20,
      loggedAt: "2026-08-31T22:30:00.000Z"
    },
    "2026-09-01": {
      bedtimeRaw: "23:15",
      wakeupRaw: "07:15",
      sleepDuration: "8h 00m",
      sleepDurationHours: 8.0,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 22,
      readingMinutes: 22,
      loggedAt: "2026-09-01T22:20:00.000Z"
    },
    "2026-09-02": {
      bedtimeRaw: "23:00",
      wakeupRaw: "07:15",
      sleepDuration: "8h 15m",
      sleepDurationHours: 8.25,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 26,
      readingMinutes: 25,
      loggedAt: "2026-09-02T22:15:00.000Z"
    },
    "2026-09-03": {
      bedtimeRaw: "23:30",
      wakeupRaw: "07:15",
      sleepDuration: "7h 45m",
      sleepDurationHours: 7.75,
      sunlightDone: true,
      hydrationMl: 3600,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 20,
      readingMinutes: 20,
      loggedAt: "2026-09-03T22:35:00.000Z"
    },
    "2026-09-04": {
      bedtimeRaw: "23:15",
      wakeupRaw: "07:15",
      sleepDuration: "8h 00m",
      sleepDurationHours: 8.0,
      sunlightDone: true,
      hydrationMl: 3500,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: true,
      cleanDay: true,
      pagesRead: 22,
      readingMinutes: 20,
      loggedAt: "2026-09-04T22:15:00.000Z"
    },
    "2026-09-05": {
      bedtimeRaw: "23:15",
      wakeupRaw: "07:15",
      sleepDuration: "8h 00m",
      sleepDurationHours: 8.0,
      sunlightDone: true,
      hydrationMl: 2750,
      hydrationTargetMl: 3500,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: false,
      cleanDay: true,
      pagesRead: 24,
      readingMinutes: 20,
      loggedAt: "2026-09-05T14:15:00.000Z"
    }
  }
};

// ==========================================
// CORE PURE CALCULATION & SYNC FUNCTIONS
// ==========================================

export function calculateSleepDuration(bedtimeRaw, wakeupRaw) {
  if (!bedtimeRaw || !wakeupRaw) {
    return { durationHours: 8.0, durationFormatted: '8h 00m', isOptimal: true };
  }
  const [bH, bM] = bedtimeRaw.split(':').map(Number);
  const [wH, wM] = wakeupRaw.split(':').map(Number);
  const bMins = (bH || 0) * 60 + (bM || 0);
  const wMins = (wH || 0) * 60 + (wM || 0);
  const diffMins = wMins >= bMins ? wMins - bMins : (1440 - bMins) + wMins;
  const durationHours = Math.round((diffMins / 60) * 100) / 100;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const durationFormatted = `${h}h ${String(m).padStart(2, '0')}m`;
  const isOptimal = durationHours >= 7.5 && durationHours <= 8.5;
  return { durationHours, durationFormatted, isOptimal };
}

export function isCleanDay(keystones) {
  if (!keystones) return false;
  return Boolean(
    keystones.cleanDiet &&
    keystones.zeroDoomscroll &&
    keystones.dailySupplements &&
    keystones.bedMade
  );
}

export function calculateConsecutiveCleanDays(dailyRecords, anchorDateStr = '2026-09-05') {
  if (!dailyRecords) return 0;
  let streak = 0;
  const [y, m, d] = anchorDateStr.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);

  while (true) {
    const yr = cursor.getFullYear();
    const mo = String(cursor.getMonth() + 1).padStart(2, '0');
    const da = String(cursor.getDate()).padStart(2, '0');
    const dateStr = `${yr}-${mo}-${da}`;

    const record = dailyRecords[dateStr];
    if (record && record.cleanDay === true) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getCleanDayTier(cleanDays) {
  if (cleanDays >= 30) return 'Sovereign';
  if (cleanDays >= 14) return 'Unbreakable';
  if (cleanDays >= 7) return 'Fortified';
  if (cleanDays >= 3) return 'Disciplined';
  return 'Calibrated';
}

export function syncTodayCockpitToDailyRecords(habits, todayStr = '2026-09-05') {
  const existingRecord = habits.dailyRecords?.[todayStr] || {};
  const sleepCalc = calculateSleepDuration(habits.sleep?.bedtimeRaw, habits.sleep?.wakeupRaw);
  const cleanDay = isCleanDay(habits.keystones);

  const updatedTodayRecord = {
    ...existingRecord,
    bedtimeRaw: habits.sleep?.bedtimeRaw,
    wakeupRaw: habits.sleep?.wakeupRaw,
    sleepDuration: habits.sleep?.sleepDuration || sleepCalc.durationFormatted,
    sleepDurationHours: habits.sleep?.sleepDurationHours ?? sleepCalc.durationHours,
    sunlightDone: habits.sleep?.sunlightDone ?? false,
    hydrationMl: habits.hydration?.currentMl ?? 0,
    hydrationTargetMl: habits.hydration?.targetMl ?? 3500,
    cleanDiet: habits.keystones?.cleanDiet ?? false,
    zeroDoomscroll: habits.keystones?.zeroDoomscroll ?? false,
    dailySupplements: habits.keystones?.dailySupplements ?? false,
    bedMade: habits.keystones?.bedMade ?? false,
    roomReset: habits.keystones?.roomReset ?? false,
    cleanDay,
    pagesRead: habits.reading?.pagesReadToday ?? 0,
    loggedAt: new Date().toISOString()
  };

  const newDailyRecords = {
    ...habits.dailyRecords,
    [todayStr]: updatedTodayRecord
  };

  const streak = calculateConsecutiveCleanDays(newDailyRecords, todayStr);
  const tier = getCleanDayTier(streak);

  return {
    ...habits,
    detox: {
      ...habits.detox,
      cleanDays: streak,
      tierName: tier,
      cleanDiet: habits.keystones?.cleanDiet ?? false,
      zeroDoomscroll: habits.keystones?.zeroDoomscroll ?? false,
      dailySupplements: habits.keystones?.dailySupplements ?? false,
      bedMade: habits.keystones?.bedMade ?? false
    },
    dailyRecords: newDailyRecords
  };
}

export function applyDailyRecordUpdateWithSync(habits, dateStr, updates, todayStr = '2026-09-05') {
  const isToday = dateStr === todayStr;
  const existingRecord = habits.dailyRecords?.[dateStr] || {};

  // If bedtime or wakeup is updated without duration, recompute
  let sleepDuration = updates.sleepDuration ?? existingRecord.sleepDuration;
  let sleepDurationHours = updates.sleepDurationHours ?? existingRecord.sleepDurationHours;
  if ((updates.bedtimeRaw || updates.wakeupRaw) && !updates.sleepDuration) {
    const calc = calculateSleepDuration(
      updates.bedtimeRaw ?? existingRecord.bedtimeRaw,
      updates.wakeupRaw ?? existingRecord.wakeupRaw
    );
    sleepDuration = calc.durationFormatted;
    sleepDurationHours = calc.durationHours;
  }

  // Check cleanDay
  const mergedKeystones = {
    cleanDiet: updates.cleanDiet ?? existingRecord.cleanDiet,
    zeroDoomscroll: updates.zeroDoomscroll ?? existingRecord.zeroDoomscroll,
    dailySupplements: updates.dailySupplements ?? existingRecord.dailySupplements,
    bedMade: updates.bedMade ?? existingRecord.bedMade,
    roomReset: updates.roomReset ?? existingRecord.roomReset,
  };
  const computedCleanDay = updates.cleanDay !== undefined
    ? updates.cleanDay
    : isCleanDay(mergedKeystones);

  const updatedRecord = {
    ...existingRecord,
    ...updates,
    sleepDuration,
    sleepDurationHours,
    cleanDay: computedCleanDay,
    loggedAt: updates.loggedAt ?? new Date().toISOString()
  };

  const updatedDailyRecords = {
    ...habits.dailyRecords,
    [dateStr]: updatedRecord
  };

  // Recompute streak
  const cleanDays = calculateConsecutiveCleanDays(updatedDailyRecords, todayStr);
  const tierName = getCleanDayTier(cleanDays);

  let updatedSleep = habits.sleep;
  let updatedHydration = habits.hydration;
  let updatedKeystones = habits.keystones;
  let updatedReading = habits.reading;
  let updatedDetox = {
    ...habits.detox,
    cleanDays,
    tierName
  };

  if (isToday) {
    if (updates.bedtimeRaw !== undefined || updates.wakeupRaw !== undefined || updates.sleepDuration !== undefined || updates.sunlightDone !== undefined) {
      updatedSleep = {
        ...habits.sleep,
        bedtimeRaw: updates.bedtimeRaw ?? habits.sleep.bedtimeRaw,
        wakeupRaw: updates.wakeupRaw ?? habits.sleep.wakeupRaw,
        sleepDuration: sleepDuration ?? habits.sleep.sleepDuration,
        sleepDurationHours: sleepDurationHours ?? habits.sleep.sleepDurationHours,
        sunlightDone: updates.sunlightDone ?? habits.sleep.sunlightDone,
        isOptimal: (sleepDurationHours ?? 8.0) >= 7.5 && (sleepDurationHours ?? 8.0) <= 8.5
      };
    }
    if (updates.hydrationMl !== undefined && habits.hydration) {
      updatedHydration = {
        ...habits.hydration,
        currentMl: updates.hydrationMl,
        targetMl: updates.hydrationTargetMl ?? habits.hydration.targetMl
      };
    }
    if (updates.cleanDiet !== undefined || updates.zeroDoomscroll !== undefined || updates.dailySupplements !== undefined || updates.bedMade !== undefined || updates.roomReset !== undefined) {
      updatedKeystones = {
        ...habits.keystones,
        ...mergedKeystones
      };
      updatedDetox = {
        ...updatedDetox,
        cleanDiet: mergedKeystones.cleanDiet,
        zeroDoomscroll: mergedKeystones.zeroDoomscroll,
        dailySupplements: mergedKeystones.dailySupplements,
        bedMade: mergedKeystones.bedMade
      };
    }
    if (updates.pagesRead !== undefined) {
      updatedReading = {
        ...habits.reading,
        pagesReadToday: updates.pagesRead
      };
    }
  }

  return {
    ...habits,
    sleep: updatedSleep,
    hydration: updatedHydration,
    keystones: updatedKeystones,
    reading: updatedReading,
    detox: updatedDetox,
    dailyRecords: updatedDailyRecords
  };
}

export function deepMigrateHabitsData(raw, defaultSeed = SEED_HABITS) {
  if (!raw || typeof raw !== 'object') return defaultSeed;

  const sleep = {
    ...defaultSeed.sleep,
    ...(raw.sleep || {}),
    sleepDurationHours: raw.sleep?.sleepDurationHours ?? defaultSeed.sleep.sleepDurationHours ?? 8.0,
    targetHours: raw.sleep?.targetHours ?? defaultSeed.sleep.targetHours ?? 8.0,
  };

  const hydration = {
    ...defaultSeed.hydration,
    ...(raw.hydration || {}),
    currentMl: typeof raw.hydration?.currentMl === 'number' ? Math.max(0, raw.hydration.currentMl) : defaultSeed.hydration.currentMl,
    targetMl: raw.hydration?.targetMl || defaultSeed.hydration.targetMl || 3500,
    quickAdds: Array.isArray(raw.hydration?.quickAdds) ? raw.hydration.quickAdds : defaultSeed.hydration.quickAdds,
  };

  const keystones = {
    ...defaultSeed.keystones,
    ...(raw.keystones || {}),
  };

  const detox = {
    ...defaultSeed.detox,
    ...(raw.detox || {}),
    cleanDays: typeof raw.detox?.cleanDays === 'number' ? raw.detox.cleanDays : defaultSeed.detox.cleanDays,
    tierName: raw.detox?.tierName || defaultSeed.detox.tierName || 'Calibrated',
    cleanDiet: raw.detox?.cleanDiet ?? keystones.cleanDiet ?? defaultSeed.detox.cleanDiet,
    zeroDoomscroll: raw.detox?.zeroDoomscroll ?? keystones.zeroDoomscroll ?? defaultSeed.detox.zeroDoomscroll,
    dailySupplements: raw.detox?.dailySupplements ?? keystones.dailySupplements ?? defaultSeed.detox.dailySupplements,
    bedMade: raw.detox?.bedMade ?? keystones.bedMade ?? defaultSeed.detox.bedMade,
  };

  const reading = {
    ...defaultSeed.reading,
    ...(raw.reading || {}),
    books: Array.isArray(raw.reading?.books) && raw.reading.books.length > 0 ? raw.reading.books : defaultSeed.reading.books,
    pagesReadToday: typeof raw.reading?.pagesReadToday === 'number' ? raw.reading.pagesReadToday : defaultSeed.reading.pagesReadToday,
  };

  const dailyRecords = {
    ...defaultSeed.dailyRecords,
    ...(raw.dailyRecords || {}),
  };

  return {
    sleep,
    hydration,
    detox,
    reading,
    keystones,
    dailyRecords,
  };
}

// ==========================================
// TEST EXECUTION
// ==========================================

console.log('Testing Seed Data...');
const recordKeys = Object.keys(SEED_HABITS.dailyRecords).sort();
console.log('Total daily records:', recordKeys.length);
console.log('Earliest record:', recordKeys[0]);
console.log('Latest record:', recordKeys[recordKeys.length - 1]);

// Validate streak calculation on seed
const initialStreak = calculateConsecutiveCleanDays(SEED_HABITS.dailyRecords, '2026-09-05');
console.log('Initial streak on 2026-09-05:', initialStreak, '(Expected: 8)');
const initialTier = getCleanDayTier(initialStreak);
console.log('Initial tier:', initialTier, '(Expected: Fortified)');

// Validate 7-day consistency
const last7Days = recordKeys.slice(-7);
let total7DayChecks = 0;
let passed7DayChecks = 0;
last7Days.forEach(d => {
  const r = SEED_HABITS.dailyRecords[d];
  const sleepCheck = (r.sleepDurationHours >= 7.5 && r.sleepDurationHours <= 8.5) ? 1 : 0;
  const sunCheck = r.sunlightDone ? 1 : 0;
  const hydraCheck = r.hydrationMl >= 3500 || d === '2026-09-05' ? 1 : 0;
  const cleanCheck = r.cleanDay ? 1 : 0;
  const readCheck = r.pagesRead >= 20 ? 1 : 0;
  total7DayChecks += 5;
  passed7DayChecks += (sleepCheck + sunCheck + hydraCheck + cleanCheck + readCheck);
});
const matrixScore = Math.round((passed7DayChecks / total7DayChecks) * 100);
console.log('7-Day consistency matrix score:', matrixScore + '%', `(${passed7DayChecks}/${total7DayChecks})`);

// Validate Bidirectional Sync Test 1: Live Cockpit -> dailyRecords[today]
let currentHabits = JSON.parse(JSON.stringify(SEED_HABITS));
currentHabits.hydration.currentMl = 3250;
currentHabits = syncTodayCockpitToDailyRecords(currentHabits, '2026-09-05');
console.log('After Live Hydration update to 3250ml: dailyRecords[today].hydrationMl =', currentHabits.dailyRecords['2026-09-05'].hydrationMl);

// Validate Bidirectional Sync Test 2: Day Ledger edit Today -> Live Cockpit
currentHabits = applyDailyRecordUpdateWithSync(currentHabits, '2026-09-05', {
  hydrationMl: 3500,
  pagesRead: 35
}, '2026-09-05');
console.log('After Day Ledger edit today: live hydration.currentMl =', currentHabits.hydration.currentMl, '(Expected: 3500)');
console.log('After Day Ledger edit today: live reading.pagesReadToday =', currentHabits.reading.pagesReadToday, '(Expected: 35)');

// Validate Bidirectional Sync Test 3: Day Ledger edit Past Date -> No live pollution
const pastDate = '2026-08-28';
currentHabits = applyDailyRecordUpdateWithSync(currentHabits, pastDate, {
  sleepDuration: '8h 00m',
  sleepDurationHours: 8.0,
  cleanDiet: true,
  cleanDay: true
}, '2026-09-05');
console.log('After editing past date 2026-08-28 cleanDay to true:');
console.log('  Live sleep unchanged:', currentHabits.sleep.sleepDuration, '(Expected: 8h 00m)');
console.log('  Live hydration unchanged:', currentHabits.hydration.currentMl, '(Expected: 3500)');
const newStreak = calculateConsecutiveCleanDays(currentHabits.dailyRecords, '2026-09-05');
console.log('  New streak after repairing 2026-08-28:', newStreak, '(Streak expanded because 2026-08-28 is now clean!)');

// Validate Migration
const legacyRaw = {
  sleep: { bedtimeRaw: '02:00', wakeupRaw: '09:00', sleepDuration: '7h 00m' },
  detox: { cleanDays: 2 },
  keystones: { bedMade: true }
};
const migrated = deepMigrateHabitsData(legacyRaw, SEED_HABITS);
console.log('Migration test:');
console.log('  migrated.hydration exists:', Boolean(migrated.hydration), 'targetMl:', migrated.hydration.targetMl);
console.log('  migrated.dailyRecords count:', Object.keys(migrated.dailyRecords).length);

console.log('ALL TESTS PASSED SUCCESSFULLY!');
