import type { 
  WorkoutLog, 
  StickyDefaults, 
  FocusData, 
  HabitsData,
  HydrationRecord,
  SleepRecord,
  DetoxState,
  ReadingState,
  KeystonesState,
  DailyHabitRecord
} from '../types';

export const STORAGE_KEYS = {
  WORKOUTS: 'pulsesync_workouts_v4',
  DEFAULTS: 'pulsesync_sticky_defaults_v4',
  FOCUS: 'pulsesync_focus_v4',
  HABITS: 'pulsesync_habits_v4',
};

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initial Seeds
const DEFAULT_STICKY: StickyDefaults = {
  pullupReps: 4,
  pushupReps: 10,
  barbellReps: 10,
  selectedLift: 'Squats',
  stepIncrement: 2500,
  machineMins: 10,
  machineType: 'elliptical',
  ellipticalMins: 10,
};

import { INITIAL_FOCUS_DATA } from '../data/focusData';

const DEFAULT_FOCUS: FocusData = INITIAL_FOCUS_DATA;

export const DEFAULT_HABITS: HabitsData = {
  hydration: {
    currentMl: 0,
    targetMl: 3500,
    quickAdds: [700, 350],
    quickAddUnits: [700, 350],
    lastLoggedAt: undefined,
  },
  sleep: {
    bedtimeRaw: '23:15',
    wakeupRaw: '07:15',
    sleepDuration: '8h 00m',
    sleepDurationHours: 8.0,
    isOptimal: true,
    sunlightDone: false,
    sleepDebtHours: 0,
    targetHours: 8.0,
  },
  detox: {
    cleanDays: 4,
    tierName: 'Calibrated',
    cleanDiet: true,
    zeroDoomscroll: true,
    dailySupplements: true,
    bedMade: true,
    morningPhoneFree: true,
    zeroReels: true,
    noPhoneInBed: true,
    relapseHistory: [],
  },
  reading: {
    activeBookId: 'book_1',
    books: [
      { id: 'book_1', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', totalPages: 560, currentPage: 64, completed: false, category: 'Architecture' },
      { id: 'book_2', title: 'Atomic Habits', author: 'James Clear', totalPages: 320, currentPage: 120, completed: false, category: 'Self-Improvement' },
      { id: 'book_3', title: 'Clean Architecture', author: 'Robert C. Martin', totalPages: 432, currentPage: 432, completed: true, category: 'Engineering' }
    ],
    startPage: 42,
    endPage: 64,
    pagesReadToday: 22,
    timerSeconds: 20 * 60,
    isTimerRunning: false,
    targetPagesPerDay: 20,
  },
  keystones: {
    cleanDiet: true,
    zeroDoomscroll: true,
    dailySupplements: true,
    bedMade: true,
    roomReset: false,
  },
  dailyRecords: {
    '2026-09-04': {
      sleepDurationHours: 6.33,
      sleepDuration: '6h 20m',
      bedtimeRaw: '03:55',
      wakeupRaw: '10:15',
      sunlightDone: false,
      isOptimal: false,
      sleepDebtHours: 1.67,
      sleepMinutes: 380,
      hydrationMl: 3000,
      hydrationCurrentMl: 3000,
      hydrationTargetMl: 3500,
      cleanDay: true,
      cleanDiet: true,
      zeroDoomscroll: true,
      dailySupplements: true,
      bedMade: true,
      roomReset: false,
      pagesRead: 22,
      readingMinutes: 20,
      activeBookId: 'book_1',
    },
  },
};

/**
 * Robust deep migration function for HabitsData.
 * Safely parses and normalizes existing pulsesync_habits_v4 localStorage records
 * ensuring all nested objects exist with non-null, non-undefined, valid values.
 */
export function migrateHabitsData(raw: any): HabitsData {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_HABITS));
  }

  // 1. Hydration Migration
  const rawHydration = raw.hydration || {};
  const currentMl = typeof rawHydration.currentMl === 'number' && !isNaN(rawHydration.currentMl)
    ? Math.max(0, rawHydration.currentMl)
    : DEFAULT_HABITS.hydration.currentMl;

  const targetMl = typeof rawHydration.targetMl === 'number' && !isNaN(rawHydration.targetMl) && rawHydration.targetMl > 0
    ? rawHydration.targetMl
    : DEFAULT_HABITS.hydration.targetMl;

  const quickAdds = Array.isArray(rawHydration.quickAdds) && rawHydration.quickAdds.length > 0
    ? rawHydration.quickAdds
    : (Array.isArray(rawHydration.quickAddUnits) && rawHydration.quickAddUnits.length > 0
      ? rawHydration.quickAddUnits
      : DEFAULT_HABITS.hydration.quickAdds);

  const hydration: HydrationRecord = {
    currentMl,
    targetMl,
    quickAdds,
    quickAddUnits: quickAdds,
    lastLoggedAt: typeof rawHydration.lastLoggedAt === 'string' ? rawHydration.lastLoggedAt : undefined,
  };

  // 2. Sleep Migration
  const rawSleep = raw.sleep || {};
  let sleepDurationHours = typeof rawSleep.sleepDurationHours === 'number' && !isNaN(rawSleep.sleepDurationHours)
    ? rawSleep.sleepDurationHours
    : undefined;

  let sleepDuration = typeof rawSleep.sleepDuration === 'string' && rawSleep.sleepDuration.trim().length > 0
    ? rawSleep.sleepDuration
    : undefined;

  if (sleepDurationHours === undefined && sleepDuration) {
    const match = sleepDuration.match(/(\d+)h\s*(\d*)m?/);
    if (match) {
      const h = parseInt(match[1], 10) || 0;
      const m = parseInt(match[2], 10) || 0;
      sleepDurationHours = Math.round((h + m / 60) * 100) / 100;
    }
  }

  if (sleepDurationHours === undefined) {
    sleepDurationHours = DEFAULT_HABITS.sleep.sleepDurationHours;
  }

  if (!sleepDuration) {
    const h = Math.floor(sleepDurationHours);
    const m = Math.round((sleepDurationHours % 1) * 60);
    sleepDuration = `${h}h ${String(m).padStart(2, '0')}m`;
  }

  const targetHours = typeof rawSleep.targetHours === 'number' && !isNaN(rawSleep.targetHours) && rawSleep.targetHours > 0
    ? rawSleep.targetHours
    : DEFAULT_HABITS.sleep.targetHours;

  const sleepDebtHours = typeof rawSleep.sleepDebtHours === 'number' && !isNaN(rawSleep.sleepDebtHours)
    ? rawSleep.sleepDebtHours
    : Math.max(0, Math.round((targetHours - sleepDurationHours) * 100) / 100);

  const isOptimal = typeof rawSleep.isOptimal === 'boolean'
    ? rawSleep.isOptimal
    : (sleepDurationHours >= 7.5 && sleepDurationHours <= 8.5);

  const sleep: SleepRecord = {
    bedtimeRaw: typeof rawSleep.bedtimeRaw === 'string' ? rawSleep.bedtimeRaw : DEFAULT_HABITS.sleep.bedtimeRaw,
    wakeupRaw: typeof rawSleep.wakeupRaw === 'string' ? rawSleep.wakeupRaw : DEFAULT_HABITS.sleep.wakeupRaw,
    sleepDuration,
    sleepDurationHours,
    isOptimal,
    sunlightDone: Boolean(rawSleep.sunlightDone),
    sleepDebtHours,
    targetHours,
  };

  // 3. Keystones Migration
  const rawKeystones = raw.keystones || {};
  const cleanDiet = rawKeystones.cleanDiet !== undefined
    ? Boolean(rawKeystones.cleanDiet)
    : (raw.detox?.cleanDiet !== undefined ? Boolean(raw.detox.cleanDiet) : DEFAULT_HABITS.keystones.cleanDiet);

  const zeroDoomscroll = rawKeystones.zeroDoomscroll !== undefined
    ? Boolean(rawKeystones.zeroDoomscroll)
    : (rawKeystones.zeroReels !== undefined
      ? Boolean(rawKeystones.zeroReels)
      : (raw.detox?.zeroDoomscroll !== undefined
        ? Boolean(raw.detox.zeroDoomscroll)
        : (raw.detox?.zeroReels !== undefined ? Boolean(raw.detox.zeroReels) : DEFAULT_HABITS.keystones.zeroDoomscroll)));

  const dailySupplements = rawKeystones.dailySupplements !== undefined
    ? Boolean(rawKeystones.dailySupplements)
    : (raw.detox?.dailySupplements !== undefined ? Boolean(raw.detox.dailySupplements) : DEFAULT_HABITS.keystones.dailySupplements);

  const bedMade = rawKeystones.bedMade !== undefined
    ? Boolean(rawKeystones.bedMade)
    : (raw.detox?.bedMade !== undefined ? Boolean(raw.detox.bedMade) : DEFAULT_HABITS.keystones.bedMade);

  const roomReset = rawKeystones.roomReset !== undefined
    ? Boolean(rawKeystones.roomReset)
    : DEFAULT_HABITS.keystones.roomReset;

  const keystones: KeystonesState = {
    cleanDiet,
    zeroDoomscroll,
    dailySupplements,
    bedMade,
    roomReset,
  };

  // 4. Detox State Migration
  const rawDetox = raw.detox || {};
  const cleanDays = typeof rawDetox.cleanDays === 'number' && !isNaN(rawDetox.cleanDays)
    ? Math.max(0, rawDetox.cleanDays)
    : DEFAULT_HABITS.detox.cleanDays;

  const detox: DetoxState = {
    cleanDays,
    tierName: typeof rawDetox.tierName === 'string' ? rawDetox.tierName : DEFAULT_HABITS.detox.tierName,
    cleanDiet: rawDetox.cleanDiet !== undefined ? Boolean(rawDetox.cleanDiet) : keystones.cleanDiet,
    zeroDoomscroll: rawDetox.zeroDoomscroll !== undefined ? Boolean(rawDetox.zeroDoomscroll) : keystones.zeroDoomscroll,
    dailySupplements: rawDetox.dailySupplements !== undefined ? Boolean(rawDetox.dailySupplements) : keystones.dailySupplements,
    bedMade: rawDetox.bedMade !== undefined ? Boolean(rawDetox.bedMade) : keystones.bedMade,
    morningPhoneFree: rawDetox.morningPhoneFree !== undefined ? Boolean(rawDetox.morningPhoneFree) : DEFAULT_HABITS.detox.morningPhoneFree,
    zeroReels: rawDetox.zeroReels !== undefined ? Boolean(rawDetox.zeroReels) : DEFAULT_HABITS.detox.zeroReels,
    noPhoneInBed: rawDetox.noPhoneInBed !== undefined ? Boolean(rawDetox.noPhoneInBed) : DEFAULT_HABITS.detox.noPhoneInBed,
    relapseHistory: Array.isArray(rawDetox.relapseHistory) ? rawDetox.relapseHistory : [],
  };

  // 5. Reading State Migration
  const rawReading = raw.reading || {};
  const books = Array.isArray(rawReading.books) && rawReading.books.length > 0
    ? rawReading.books
    : DEFAULT_HABITS.reading.books;

  const activeBookId = typeof rawReading.activeBookId === 'string' && rawReading.activeBookId.length > 0
    ? rawReading.activeBookId
    : (books[0]?.id || DEFAULT_HABITS.reading.activeBookId);

  const reading: ReadingState = {
    activeBookId,
    books,
    startPage: typeof rawReading.startPage === 'number' && !isNaN(rawReading.startPage) ? rawReading.startPage : DEFAULT_HABITS.reading.startPage,
    endPage: typeof rawReading.endPage === 'number' && !isNaN(rawReading.endPage) ? rawReading.endPage : DEFAULT_HABITS.reading.endPage,
    pagesReadToday: typeof rawReading.pagesReadToday === 'number' && !isNaN(rawReading.pagesReadToday) ? rawReading.pagesReadToday : DEFAULT_HABITS.reading.pagesReadToday,
    timerSeconds: typeof rawReading.timerSeconds === 'number' && !isNaN(rawReading.timerSeconds) ? rawReading.timerSeconds : DEFAULT_HABITS.reading.timerSeconds,
    isTimerRunning: Boolean(rawReading.isTimerRunning),
    targetPagesPerDay: typeof rawReading.targetPagesPerDay === 'number' && !isNaN(rawReading.targetPagesPerDay) ? rawReading.targetPagesPerDay : DEFAULT_HABITS.reading.targetPagesPerDay,
    currentBook: rawReading.currentBook,
    history: Array.isArray(rawReading.history) ? rawReading.history : undefined,
  };

  // 6. Daily Records Migration
  const dailyRecords: Record<string, DailyHabitRecord> = {};
  const mergedRawRecords = {
    ...DEFAULT_HABITS.dailyRecords,
    ...(raw.dailyRecords && typeof raw.dailyRecords === 'object' ? raw.dailyRecords : {}),
  };

  for (const [dateStr, rec] of Object.entries(mergedRawRecords)) {
    if (!rec || typeof rec !== 'object') continue;
    const r = rec as any;

    let durHours = typeof r.sleepDurationHours === 'number' && !isNaN(r.sleepDurationHours) ? r.sleepDurationHours : undefined;
    if (durHours === undefined && typeof r.sleepMinutes === 'number' && !isNaN(r.sleepMinutes)) {
      durHours = Math.round((r.sleepMinutes / 60) * 100) / 100;
    }
    if (durHours === undefined && typeof r.sleepDuration === 'string') {
      const match = r.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
      if (match) {
        durHours = Math.round((parseInt(match[1], 10) + (parseInt(match[2], 10) || 0) / 60) * 100) / 100;
      }
    }
    if (durHours === undefined) durHours = 8.0;

    let durFormatted = typeof r.sleepDuration === 'string' && r.sleepDuration.length > 0 ? r.sleepDuration : undefined;
    if (!durFormatted) {
      const h = Math.floor(durHours);
      const m = Math.round((durHours % 1) * 60);
      durFormatted = `${h}h ${String(m).padStart(2, '0')}m`;
    }

    const hydMl = typeof r.hydrationMl === 'number' && !isNaN(r.hydrationMl)
      ? r.hydrationMl
      : (typeof r.hydrationCurrentMl === 'number' && !isNaN(r.hydrationCurrentMl) ? r.hydrationCurrentMl : undefined);

    const cDiet = r.cleanDiet !== undefined ? Boolean(r.cleanDiet) : (r.cleanDay !== undefined ? Boolean(r.cleanDay) : undefined);
    const zDoom = r.zeroDoomscroll !== undefined ? Boolean(r.zeroDoomscroll) : (r.cleanDay !== undefined ? Boolean(r.cleanDay) : undefined);
    const dSupp = r.dailySupplements !== undefined ? Boolean(r.dailySupplements) : (r.cleanDay !== undefined ? Boolean(r.cleanDay) : undefined);
    const bMade = r.bedMade !== undefined ? Boolean(r.bedMade) : (r.cleanDay !== undefined ? Boolean(r.cleanDay) : undefined);
    const rReset = r.roomReset !== undefined ? Boolean(r.roomReset) : undefined;

    let isClean = typeof r.cleanDay === 'boolean' ? r.cleanDay : undefined;
    if (isClean === undefined && cDiet !== undefined && zDoom !== undefined && dSupp !== undefined && bMade !== undefined) {
      isClean = Boolean(cDiet && zDoom && dSupp && bMade);
    }

    dailyRecords[dateStr] = {
      sleepDurationHours: durHours,
      sleepDuration: durFormatted,
      bedtimeRaw: r.bedtimeRaw || '23:15',
      wakeupRaw: r.wakeupRaw || '07:15',
      sunlightDone: r.sunlightDone !== undefined ? Boolean(r.sunlightDone) : false,
      isOptimal: durHours >= 7.5 && durHours <= 8.5,
      sleepDebtHours: Math.max(0, Math.round((8.0 - durHours) * 100) / 100),
      sleepMinutes: typeof r.sleepMinutes === 'number' ? r.sleepMinutes : Math.round(durHours * 60),

      hydrationMl: hydMl,
      hydrationCurrentMl: hydMl,
      hydrationTargetMl: typeof r.hydrationTargetMl === 'number' ? r.hydrationTargetMl : (hydMl !== undefined ? 3500 : undefined),

      cleanDay: isClean,
      cleanDiet: cDiet,
      zeroDoomscroll: zDoom,
      dailySupplements: dSupp,
      bedMade: bMade,
      roomReset: rReset,

      pagesRead: typeof r.pagesRead === 'number' && !isNaN(r.pagesRead) ? r.pagesRead : undefined,
      readingMinutes: typeof r.readingMinutes === 'number' ? r.readingMinutes : (r.pagesRead ? 20 : undefined),
      activeBookId: r.activeBookId || undefined,

      loggedAt: r.loggedAt,
    };
  }

  return {
    hydration,
    sleep,
    detox,
    reading,
    keystones,
    dailyRecords,
  };
}

export const StorageService = {
  getWorkouts(): WorkoutLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWorkouts(logs: WorkoutLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save workouts to localStorage', e);
    }
  },

  getStickyDefaults(): StickyDefaults {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEFAULTS);
      if (!data) return DEFAULT_STICKY;
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_STICKY,
        ...parsed,
        machineMins: parsed.machineMins ?? parsed.ellipticalMins ?? DEFAULT_STICKY.machineMins,
        machineType: parsed.machineType ?? DEFAULT_STICKY.machineType,
      };
    } catch {
      return DEFAULT_STICKY;
    }
  },

  saveStickyDefaults(defaults: StickyDefaults): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEFAULTS, JSON.stringify(defaults));
    } catch (e) {
      console.error('Failed to save defaults to localStorage', e);
    }
  },

  getFocusData(): FocusData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS);
      if (!data) return DEFAULT_FOCUS;
      const parsed = JSON.parse(data);
      if (!parsed.tasks || parsed.tasks.length <= 7 || !parsed.tasks[0]?.bucket) {
        return {
          ...DEFAULT_FOCUS,
          ...parsed,
          tasks: DEFAULT_FOCUS.tasks,
        };
      }
      return { ...DEFAULT_FOCUS, ...parsed };
    } catch {
      return DEFAULT_FOCUS;
    }
  },

  saveFocusData(data: FocusData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save focus to localStorage', e);
    }
  },

  getHabitsData(): HabitsData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (!data) return JSON.parse(JSON.stringify(DEFAULT_HABITS));
      const parsed = JSON.parse(data);
      return migrateHabitsData(parsed);
    } catch (e) {
      console.error('Failed to parse habits from localStorage, falling back to default', e);
      return JSON.parse(JSON.stringify(DEFAULT_HABITS));
    }
  },

  saveHabitsData(data: HabitsData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save habits to localStorage', e);
    }
  },

  exportAllJson(): string {
    const backup = {
      version: 4,
      timestamp: Date.now(),
      workouts: this.getWorkouts(),
      defaults: this.getStickyDefaults(),
      focus: this.getFocusData(),
      habits: this.getHabitsData(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.workouts) this.saveWorkouts(data.workouts);
      if (data.defaults) this.saveStickyDefaults(data.defaults);
      if (data.focus) this.saveFocusData(data.focus);
      if (data.habits) this.saveHabitsData(data.habits);
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  }
};
