import type { 
  HabitsData, 
  DailyHabitRecord, 
  SleepRecord, 
  HydrationRecord, 
  KeystonesState, 
  DetoxState, 
  ReadingState 
} from '../types';

/**
 * Computes cross-midnight duration between bedtime and wakeup timestamps in 24h format.
 */
export function calculateSleepDuration(
  bedtimeRaw: string, 
  wakeupRaw: string
): { durationHours: number; durationFormatted: string; isOptimal: boolean } {
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

/**
 * Evaluates binary Clean Day status from the 4 immutable keystone discipline markers.
 */
export function isCleanDay(keystones?: Partial<KeystonesState>): boolean {
  if (!keystones) return false;
  return Boolean(
    keystones.cleanDiet &&
    keystones.zeroDoomscroll &&
    keystones.dailySupplements &&
    keystones.bedMade
  );
}

/**
 * Traverses backwards day-by-day from anchor date to compute unbroken consecutive clean days.
 */
export function calculateConsecutiveCleanDays(
  dailyRecords: Record<string, DailyHabitRecord>,
  anchorDateStr: string
): number {
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
    if (record && (record.cleanDay === true || isCleanDay(record))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Returns tier classification based on consecutive clean days streak.
 */
export function getCleanDayTier(cleanDays: number): string {
  const s = Math.max(0, cleanDays || 0);
  if (s >= 90) return 'Sovereign';
  if (s >= 30) return 'Unbreakable';
  if (s >= 14) return 'Fortified';
  if (s >= 7)  return 'Disciplined';
  return 'Calibrated';
}

/**
 * CONTRACT A: Synchronizes live cockpit state to dailyRecords[todayStr].
 * Invoked whenever live Sleep, Hydration, Keystones, or Reading state is modified in HabitsEngine.
 */
export function syncTodayCockpitToDailyRecords(
  habits: HabitsData,
  todayStr: string
): HabitsData {
  const existingRecord = habits.dailyRecords?.[todayStr] || {};
  const sleepCalc = calculateSleepDuration(habits.sleep?.bedtimeRaw, habits.sleep?.wakeupRaw);
  const cleanDay = isCleanDay(habits.keystones);

  const updatedTodayRecord: DailyHabitRecord = {
    ...existingRecord,
    bedtimeRaw: habits.sleep?.bedtimeRaw ?? existingRecord.bedtimeRaw,
    wakeupRaw: habits.sleep?.wakeupRaw ?? existingRecord.wakeupRaw,
    sleepDuration: habits.sleep?.sleepDuration || sleepCalc.durationFormatted,
    sleepDurationHours: habits.sleep?.sleepDurationHours ?? sleepCalc.durationHours,
    sunlightDone: habits.sleep?.sunlightDone ?? existingRecord.sunlightDone ?? false,
    hydrationMl: habits.hydration?.currentMl ?? existingRecord.hydrationMl ?? 0,
    hydrationTargetMl: habits.hydration?.targetMl ?? existingRecord.hydrationTargetMl ?? 3500,
    cleanDiet: habits.keystones?.cleanDiet ?? existingRecord.cleanDiet ?? false,
    zeroDoomscroll: habits.keystones?.zeroDoomscroll ?? existingRecord.zeroDoomscroll ?? false,
    dailySupplements: habits.keystones?.dailySupplements ?? existingRecord.dailySupplements ?? false,
    bedMade: habits.keystones?.bedMade ?? existingRecord.bedMade ?? false,
    roomReset: habits.keystones?.roomReset ?? existingRecord.roomReset ?? false,
    cleanDay,
    pagesRead: habits.reading?.pagesReadToday ?? existingRecord.pagesRead ?? 0,
    loggedAt: new Date().toISOString(),
  };

  const newDailyRecords = {
    ...habits.dailyRecords,
    [todayStr]: updatedTodayRecord,
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
      bedMade: habits.keystones?.bedMade ?? false,
    },
    dailyRecords: newDailyRecords,
  };
}

/**
 * CONTRACT B: Applies an edit from Day Ledger (EditHabitsModal) to dailyRecords[dateStr].
 * If dateStr === todayStr, atomically propagates the updates to live top-level cockpit state.
 * If dateStr !== todayStr, updates only dailyRecords[dateStr] and recalculates backward streaks.
 */
export function applyDailyRecordUpdateWithSync(
  habits: HabitsData,
  dateStr: string,
  updates: Partial<DailyHabitRecord>,
  todayStr: string
): HabitsData {
  const isToday = dateStr === todayStr;
  const existingRecord = habits.dailyRecords?.[dateStr] || {};

  // Recompute sleep duration if bedtime/wakeup updated without duration string
  let sleepDuration = updates.sleepDuration ?? existingRecord.sleepDuration;
  let sleepDurationHours = updates.sleepDurationHours ?? existingRecord.sleepDurationHours;
  if ((updates.bedtimeRaw || updates.wakeupRaw) && !updates.sleepDuration) {
    const calc = calculateSleepDuration(
      updates.bedtimeRaw ?? existingRecord.bedtimeRaw ?? '23:15',
      updates.wakeupRaw ?? existingRecord.wakeupRaw ?? '07:15'
    );
    sleepDuration = calc.durationFormatted;
    sleepDurationHours = calc.durationHours;
  }

  // Merge keystones & determine clean day
  const mergedKeystones: KeystonesState = {
    cleanDiet: updates.cleanDiet ?? existingRecord.cleanDiet ?? false,
    zeroDoomscroll: updates.zeroDoomscroll ?? existingRecord.zeroDoomscroll ?? false,
    dailySupplements: updates.dailySupplements ?? existingRecord.dailySupplements ?? false,
    bedMade: updates.bedMade ?? existingRecord.bedMade ?? false,
    roomReset: updates.roomReset ?? existingRecord.roomReset ?? false,
  };
  const computedCleanDay = updates.cleanDay !== undefined 
    ? updates.cleanDay 
    : isCleanDay(mergedKeystones);

  const updatedRecord: DailyHabitRecord = {
    ...existingRecord,
    ...updates,
    sleepDuration,
    sleepDurationHours,
    cleanDay: computedCleanDay,
    loggedAt: updates.loggedAt ?? new Date().toISOString(),
  };

  const updatedDailyRecords = {
    ...habits.dailyRecords,
    [dateStr]: updatedRecord,
  };

  // Re-evaluate consecutive streak ending today
  const cleanDays = calculateConsecutiveCleanDays(updatedDailyRecords, todayStr);
  const tierName = getCleanDayTier(cleanDays);

  let updatedSleep = habits.sleep;
  let updatedHydration = habits.hydration;
  let updatedKeystones = habits.keystones;
  let updatedReading = habits.reading;
  let updatedDetox: DetoxState = {
    ...habits.detox,
    cleanDays,
    tierName,
  };

  if (isToday) {
    // Atomically propagate to live cockpit
    if (updates.bedtimeRaw !== undefined || updates.wakeupRaw !== undefined || updates.sleepDuration !== undefined || updates.sunlightDone !== undefined) {
      updatedSleep = {
        ...habits.sleep,
        bedtimeRaw: updates.bedtimeRaw ?? habits.sleep.bedtimeRaw,
        wakeupRaw: updates.wakeupRaw ?? habits.sleep.wakeupRaw,
        sleepDuration: sleepDuration ?? habits.sleep.sleepDuration,
        sleepDurationHours: sleepDurationHours ?? habits.sleep.sleepDurationHours,
        sunlightDone: updates.sunlightDone ?? habits.sleep.sunlightDone,
        isOptimal: (sleepDurationHours ?? 8.0) >= 7.5 && (sleepDurationHours ?? 8.0) <= 8.5,
        sleepDebtHours: Math.round(((habits.sleep.targetHours || 8.0) - (sleepDurationHours ?? 8.0)) * 100) / 100,
      };
    }

    if (updates.hydrationMl !== undefined && habits.hydration) {
      updatedHydration = {
        ...habits.hydration,
        currentMl: Math.max(0, updates.hydrationMl),
        targetMl: updates.hydrationTargetMl ?? habits.hydration.targetMl,
        lastLoggedAt: new Date().toISOString(),
      };
    }

    if (updates.cleanDiet !== undefined || updates.zeroDoomscroll !== undefined || updates.dailySupplements !== undefined || updates.bedMade !== undefined || updates.roomReset !== undefined) {
      updatedKeystones = {
        ...habits.keystones,
        ...mergedKeystones,
      };
      updatedDetox = {
        ...updatedDetox,
        cleanDiet: mergedKeystones.cleanDiet,
        zeroDoomscroll: mergedKeystones.zeroDoomscroll,
        dailySupplements: mergedKeystones.dailySupplements,
        bedMade: mergedKeystones.bedMade,
      };
    }

    if (updates.pagesRead !== undefined) {
      updatedReading = {
        ...habits.reading,
        pagesReadToday: updates.pagesRead,
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
    dailyRecords: updatedDailyRecords,
  };
}

/**
 * CONTRACT C: Safe deep migration for localStorage payloads.
 * Merges legacy blobs over default seed objects to guarantee all properties are initialized.
 */
export function deepMigrateHabitsData(raw: any, defaultSeed: HabitsData): HabitsData {
  if (!raw || typeof raw !== 'object') return defaultSeed;

  const sleep: SleepRecord = {
    ...defaultSeed.sleep,
    ...(raw.sleep || {}),
    sleepDurationHours: raw.sleep?.sleepDurationHours ?? defaultSeed.sleep.sleepDurationHours ?? 8.0,
    targetHours: raw.sleep?.targetHours ?? defaultSeed.sleep.targetHours ?? 8.0,
    isOptimal: raw.sleep?.isOptimal ?? defaultSeed.sleep.isOptimal ?? true,
    sunlightDone: raw.sleep?.sunlightDone ?? defaultSeed.sleep.sunlightDone ?? false,
  };

  const hydration: HydrationRecord = {
    ...defaultSeed.hydration,
    ...(raw.hydration || {}),
    currentMl: typeof raw.hydration?.currentMl === 'number' ? Math.max(0, raw.hydration.currentMl) : defaultSeed.hydration.currentMl,
    targetMl: raw.hydration?.targetMl || defaultSeed.hydration.targetMl || 3500,
    quickAdds: Array.isArray(raw.hydration?.quickAdds) ? raw.hydration.quickAdds : defaultSeed.hydration.quickAdds,
  };

  const keystones: KeystonesState = {
    ...defaultSeed.keystones,
    ...(raw.keystones || {}),
  };

  const detox: DetoxState = {
    ...defaultSeed.detox,
    ...(raw.detox || {}),
    cleanDays: typeof raw.detox?.cleanDays === 'number' ? raw.detox.cleanDays : defaultSeed.detox.cleanDays,
    tierName: raw.detox?.tierName || defaultSeed.detox.tierName || 'Calibrated',
    cleanDiet: raw.detox?.cleanDiet ?? keystones.cleanDiet ?? defaultSeed.detox.cleanDiet,
    zeroDoomscroll: raw.detox?.zeroDoomscroll ?? keystones.zeroDoomscroll ?? defaultSeed.detox.zeroDoomscroll,
    dailySupplements: raw.detox?.dailySupplements ?? keystones.dailySupplements ?? defaultSeed.detox.dailySupplements,
    bedMade: raw.detox?.bedMade ?? keystones.bedMade ?? defaultSeed.detox.bedMade,
  };

  const reading: ReadingState = {
    ...defaultSeed.reading,
    ...(raw.reading || {}),
    books: Array.isArray(raw.reading?.books) && raw.reading.books.length > 0 ? raw.reading.books : defaultSeed.reading.books,
    pagesReadToday: typeof raw.reading?.pagesReadToday === 'number' ? raw.reading.pagesReadToday : defaultSeed.reading.pagesReadToday,
  };

  const dailyRecords: Record<string, DailyHabitRecord> = {
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

/**
 * CONTRACT D: Accurate circadian sleep derivation for DayBalanceRibbon.
 * Eliminates false past-day fallbacks to today's live sleep.
 */
export function getDayBalanceSleepHours(
  habits: HabitsData, 
  selectedDate: string, 
  todayStr: string
): number {
  const isToday = selectedDate === todayStr;
  const record = habits.dailyRecords?.[selectedDate];

  if (record?.sleepDurationHours != null) {
    return record.sleepDurationHours;
  }
  if (record?.sleepDuration) {
    const m = record.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
    if (m) return (parseInt(m[1], 10) || 0) + (parseInt(m[2], 10) || 0) / 60;
  }
  if (isToday) {
    if (habits.sleep?.sleepDurationHours != null) return habits.sleep.sleepDurationHours;
    if (habits.sleep?.sleepDuration) {
      const m = habits.sleep.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
      if (m) return (parseInt(m[1], 10) || 0) + (parseInt(m[2], 10) || 0) / 60;
    }
    return 8.0;
  }
  return 0;
}

/**
 * CONTRACT E: Safely retrieves or synthesizes habit record for DayLedgerFeed.
 */
export function getHabitRecordForDate(
  habits: HabitsData, 
  dateStr: string, 
  todayStr: string
): DailyHabitRecord | null {
  const isToday = dateStr === todayStr;
  const existing = habits.dailyRecords?.[dateStr];
  if (existing) return existing;
  if (isToday) {
    return {
      sleepDurationHours: habits.sleep?.sleepDurationHours ?? 8.0,
      sleepDuration: habits.sleep?.sleepDuration ?? '8h 00m',
      bedtimeRaw: habits.sleep?.bedtimeRaw ?? '23:15',
      wakeupRaw: habits.sleep?.wakeupRaw ?? '07:15',
      sunlightDone: habits.sleep?.sunlightDone ?? false,
      hydrationMl: habits.hydration?.currentMl ?? 0,
      hydrationTargetMl: habits.hydration?.targetMl ?? 3500,
      cleanDiet: habits.keystones?.cleanDiet ?? false,
      zeroDoomscroll: habits.keystones?.zeroDoomscroll ?? false,
      dailySupplements: habits.keystones?.dailySupplements ?? false,
      bedMade: habits.keystones?.bedMade ?? false,
      roomReset: habits.keystones?.roomReset ?? false,
      cleanDay: isCleanDay(habits.keystones),
      pagesRead: habits.reading?.pagesReadToday ?? 0,
    };
  }
  return null;
}
