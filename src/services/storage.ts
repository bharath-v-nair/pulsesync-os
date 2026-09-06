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
  DailyHabitRecord,
  UserProfile,
} from '../types/index.ts';
import { 
  DEFAULT_USER_PROFILE,
  DEFAULT_PHYSICAL_PROFILE,
  DEFAULT_WORKOUT_LOCATIONS,
  DEFAULT_DUMBBELL_EXERCISES,
  DEFAULT_BODYWEIGHT_EXERCISES,
  DEFAULT_MOVE_CONFIG,
  DEFAULT_FOCUS_CONFIG,
  DEFAULT_HABITS_CONFIG,
} from '../types/index.ts';

export const STORAGE_KEYS = {
  // Legacy global keys (v4)
  WORKOUTS: 'pulsesync_workouts_v4',
  DEFAULTS: 'pulsesync_sticky_defaults_v4',
  FOCUS: 'pulsesync_focus_v4',
  HABITS: 'pulsesync_habits_v4',

  // Profile metadata keys (v1)
  PROFILES: 'pulsesync_profiles_v1',
  ACTIVE_PROFILE_ID: 'pulsesync_active_profile_id_v1',
};

export function getPartitionKey(profileId: string, domain: 'workouts' | 'defaults' | 'focus' | 'habits'): string {
  const safeId = profileId?.trim() || DEFAULT_USER_PROFILE.id;
  return `pulsesync_p_${safeId}_${domain}_v4`;
}


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
  dipsReps: 8,
  pushupReps: 10,
  barbellReps: 10,
  selectedLift: 'Squats',
  stepIncrement: 2500,
  machineMins: 10,
  machineType: 'elliptical',
  ellipticalMins: 10,
};

import { INITIAL_FOCUS_DATA } from '../data/focusData.ts';

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
  // ==========================================
  // Profile Management & Partitioning APIs
  // ==========================================
  getProfiles(): UserProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...DEFAULT_USER_PROFILE,
            ...p,
            name: p.name || DEFAULT_USER_PROFILE.name,
            physicalProfile: { ...DEFAULT_PHYSICAL_PROFILE, ...(p.physicalProfile || {}) },
            moveConfig: {
              ...DEFAULT_MOVE_CONFIG,
              ...(p.moveConfig || {}),
              equipmentMode: (p.moveConfig?.activeLocationId === 'loc_mothers' || !p.moveConfig?.equipmentMode) 
                ? 'barbell_home' 
                : p.moveConfig.equipmentMode,
              locations: (p.moveConfig?.locations && p.moveConfig.locations.length === 2 && !p.moveConfig.locations.some((l: any) => l.id === 'loc_home')) 
                ? p.moveConfig.locations 
                : DEFAULT_WORKOUT_LOCATIONS,
              activeLocationId: (p.moveConfig?.activeLocationId && p.moveConfig.activeLocationId !== 'loc_home') 
                ? p.moveConfig.activeLocationId 
                : 'loc_mothers',
              enabledExercises: p.moveConfig?.enabledExercises || DEFAULT_MOVE_CONFIG.enabledExercises,
              enabledDumbbellExercises: p.moveConfig?.enabledDumbbellExercises || DEFAULT_DUMBBELL_EXERCISES,
              enabledBodyweightExercises: p.moveConfig?.enabledBodyweightExercises || DEFAULT_BODYWEIGHT_EXERCISES,
              stepper1: { ...DEFAULT_MOVE_CONFIG.stepper1, ...(p.moveConfig?.stepper1 || {}) },
              stepper2: (p.moveConfig?.stepper2?.category === 'dips' || p.moveConfig?.stepper2?.title?.toLowerCase().includes('dip'))
                ? { ...DEFAULT_MOVE_CONFIG.stepper2, ...(p.moveConfig?.stepper2 || {}) }
                : DEFAULT_MOVE_CONFIG.stepper2,
              stepper3: { ...DEFAULT_MOVE_CONFIG.stepper3, ...(p.moveConfig?.stepper3 || {}) },
              targets: { ...DEFAULT_MOVE_CONFIG.targets, dips: 30, ...(p.moveConfig?.targets || {}) },
            },
            focusConfig: {
              ...DEFAULT_FOCUS_CONFIG,
              ...(p.focusConfig || {}),
              questionTargets: { ...DEFAULT_FOCUS_CONFIG.questionTargets, ...(p.focusConfig?.questionTargets || {}) },
              curriculumTracks: p.focusConfig?.curriculumTracks && p.focusConfig.curriculumTracks.length > 0 ? p.focusConfig.curriculumTracks : DEFAULT_FOCUS_CONFIG.curriculumTracks,
              timerPresets: p.focusConfig?.timerPresets && p.focusConfig.timerPresets.length > 0 ? p.focusConfig.timerPresets : DEFAULT_FOCUS_CONFIG.timerPresets,
            },
            habitsConfig: {
              ...DEFAULT_HABITS_CONFIG,
              ...(p.habitsConfig || {}),
              keystones: p.habitsConfig?.keystones && p.habitsConfig.keystones.length > 0 ? p.habitsConfig.keystones : DEFAULT_HABITS_CONFIG.keystones,
            },
          }));
        }
      }
    } catch (e) {
      console.error('Failed to parse profiles from localStorage', e);
    }

    // Auto-migration for existing single-user installation:
    // Initialize default profile 'profile_default' and copy any existing unpartitioned data
    const defaultProfile: UserProfile = { ...DEFAULT_USER_PROFILE };

    try {
      const legacyWorkouts = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      const legacyDefaults = localStorage.getItem(STORAGE_KEYS.DEFAULTS);
      const legacyFocus = localStorage.getItem(STORAGE_KEYS.FOCUS);
      const legacyHabits = localStorage.getItem(STORAGE_KEYS.HABITS);

      if (legacyWorkouts && !localStorage.getItem(getPartitionKey(defaultProfile.id, 'workouts'))) {
        localStorage.setItem(getPartitionKey(defaultProfile.id, 'workouts'), legacyWorkouts);
      }
      if (legacyDefaults && !localStorage.getItem(getPartitionKey(defaultProfile.id, 'defaults'))) {
        localStorage.setItem(getPartitionKey(defaultProfile.id, 'defaults'), legacyDefaults);
      }
      if (legacyFocus && !localStorage.getItem(getPartitionKey(defaultProfile.id, 'focus'))) {
        localStorage.setItem(getPartitionKey(defaultProfile.id, 'focus'), legacyFocus);
      }
      if (legacyHabits && !localStorage.getItem(getPartitionKey(defaultProfile.id, 'habits'))) {
        localStorage.setItem(getPartitionKey(defaultProfile.id, 'habits'), legacyHabits);
      }

      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([defaultProfile]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, defaultProfile.id);
    } catch (e) {
      console.error('Failed to initialize profiles and migrate legacy data', e);
    }

    return [defaultProfile];
  },

  saveProfiles(profiles: UserProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles to localStorage', e);
    }
  },

  getActiveProfileId(): string {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
      if (id) return id;
    } catch {}
    const profiles = this.getProfiles();
    return profiles[0]?.id || DEFAULT_USER_PROFILE.id;
  },

  setActiveProfileId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    } catch (e) {
      console.error('Failed to set active profile id in localStorage', e);
    }
  },

  getActiveProfile(): UserProfile {
    const profiles = this.getProfiles();
    const activeId = this.getActiveProfileId();
    return profiles.find((p) => p.id === activeId) || profiles[0] || DEFAULT_USER_PROFILE;
  },

  saveActiveProfile(profile: UserProfile): void {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    this.saveProfiles(profiles);
  },

  setActiveLocation(locationId: string): UserProfile {
    const profile = this.getActiveProfile();
    const loc = profile.moveConfig.locations?.find((l) => l.id === locationId);
    if (loc) {
      profile.moveConfig.activeLocationId = loc.id;
      profile.moveConfig.equipmentMode = loc.equipmentMode;
      if (loc.barbellWeightKg !== undefined) {
        profile.moveConfig.barbellWeightKg = loc.barbellWeightKg;
      }
      if (loc.dumbbellWeightKg !== undefined) {
        profile.moveConfig.dumbbellWeightKg = loc.dumbbellWeightKg;
      }
      this.saveActiveProfile(profile);
    }
    return profile;
  },

  createProfile(name: string, template?: Partial<UserProfile>): UserProfile {
    const newId = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const base = template ? { ...DEFAULT_USER_PROFILE, ...template } : { ...DEFAULT_USER_PROFILE };
    const avatarColors = ['sky', 'emerald', 'amber', 'purple', 'rose'];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const newProfile: UserProfile = {
      ...base,
      id: newId,
      name: name.trim() || 'New Athlete',
      createdAt: Date.now(),
      avatarColor: template?.avatarColor || randomColor,
    };

    const profiles = this.getProfiles();
    profiles.push(newProfile);
    this.saveProfiles(profiles);
    this.setActiveProfileId(newId);
    return newProfile;
  },

  deleteProfile(id: string): boolean {
    const profiles = this.getProfiles();
    if (profiles.length <= 1) {
      return false; // Prevent deleting the sole remaining profile
    }

    const remaining = profiles.filter((p) => p.id !== id);
    this.saveProfiles(remaining);

    // Clean up partitioned data
    try {
      localStorage.removeItem(getPartitionKey(id, 'workouts'));
      localStorage.removeItem(getPartitionKey(id, 'defaults'));
      localStorage.removeItem(getPartitionKey(id, 'focus'));
      localStorage.removeItem(getPartitionKey(id, 'habits'));
    } catch {}

    if (this.getActiveProfileId() === id) {
      this.setActiveProfileId(remaining[0].id);
    }
    return true;
  },

  // ==========================================
  // Domain Data Partitioned Accessors
  // ==========================================
  getWorkouts(profileId?: string): WorkoutLog[] {
    try {
      const targetId = profileId || this.getActiveProfileId();
      const pKey = getPartitionKey(targetId, 'workouts');
      let data = localStorage.getItem(pKey);
      if (!data && targetId === DEFAULT_USER_PROFILE.id) {
        data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
        if (data) {
          localStorage.setItem(pKey, data);
        }
      }
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWorkouts(logs: WorkoutLog[], profileId?: string): void {
    try {
      const targetId = profileId || this.getActiveProfileId();
      localStorage.setItem(getPartitionKey(targetId, 'workouts'), JSON.stringify(logs));
      if (targetId === DEFAULT_USER_PROFILE.id) {
        localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(logs));
      }
    } catch (e) {
      console.error('Failed to save workouts to localStorage', e);
    }
  },

  getStickyDefaults(profileId?: string): StickyDefaults {
    try {
      const targetId = profileId || this.getActiveProfileId();
      const pKey = getPartitionKey(targetId, 'defaults');
      let data = localStorage.getItem(pKey);
      if (!data && targetId === DEFAULT_USER_PROFILE.id) {
        data = localStorage.getItem(STORAGE_KEYS.DEFAULTS);
        if (data) {
          localStorage.setItem(pKey, data);
        }
      }
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

  saveStickyDefaults(defaults: StickyDefaults, profileId?: string): void {
    try {
      const targetId = profileId || this.getActiveProfileId();
      localStorage.setItem(getPartitionKey(targetId, 'defaults'), JSON.stringify(defaults));
      if (targetId === DEFAULT_USER_PROFILE.id) {
        localStorage.setItem(STORAGE_KEYS.DEFAULTS, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error('Failed to save defaults to localStorage', e);
    }
  },

  getFocusData(profileId?: string): FocusData {
    try {
      const targetId = profileId || this.getActiveProfileId();
      const pKey = getPartitionKey(targetId, 'focus');
      let data = localStorage.getItem(pKey);
      if (!data && targetId === DEFAULT_USER_PROFILE.id) {
        data = localStorage.getItem(STORAGE_KEYS.FOCUS);
        if (data) {
          localStorage.setItem(pKey, data);
        }
      }
      if (!data) return JSON.parse(JSON.stringify(DEFAULT_FOCUS));
      const parsed = JSON.parse(data);
      if (!parsed.tasks || parsed.tasks.length <= 7 || !parsed.tasks[0]?.bucket) {
        return {
          ...JSON.parse(JSON.stringify(DEFAULT_FOCUS)),
          ...parsed,
          tasks: JSON.parse(JSON.stringify(DEFAULT_FOCUS.tasks)),
        };
      }
      return { ...JSON.parse(JSON.stringify(DEFAULT_FOCUS)), ...parsed };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_FOCUS));
    }
  },

  saveFocusData(data: FocusData, profileId?: string): void {
    try {
      const targetId = profileId || this.getActiveProfileId();
      localStorage.setItem(getPartitionKey(targetId, 'focus'), JSON.stringify(data));
      if (targetId === DEFAULT_USER_PROFILE.id) {
        localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save focus to localStorage', e);
    }
  },

  getHabitsData(profileId?: string): HabitsData {
    try {
      const targetId = profileId || this.getActiveProfileId();
      const pKey = getPartitionKey(targetId, 'habits');
      let data = localStorage.getItem(pKey);
      if (!data && targetId === DEFAULT_USER_PROFILE.id) {
        data = localStorage.getItem(STORAGE_KEYS.HABITS);
        if (data) {
          localStorage.setItem(pKey, data);
        }
      }
      if (!data) return JSON.parse(JSON.stringify(DEFAULT_HABITS));
      const parsed = JSON.parse(data);
      return migrateHabitsData(parsed);
    } catch (e) {
      console.error('Failed to parse habits from localStorage, falling back to default', e);
      return JSON.parse(JSON.stringify(DEFAULT_HABITS));
    }
  },

  saveHabitsData(data: HabitsData, profileId?: string): void {
    try {
      const targetId = profileId || this.getActiveProfileId();
      localStorage.setItem(getPartitionKey(targetId, 'habits'), JSON.stringify(data));
      if (targetId === DEFAULT_USER_PROFILE.id) {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save habits to localStorage', e);
    }
  },

  // ==========================================
  // Unified Multi-Profile Export & Import
  // ==========================================
  exportAllJson(): string {
    const activeId = this.getActiveProfileId();
    const profiles = this.getProfiles();

    const allProfilesData: Record<string, any> = {};
    for (const p of profiles) {
      allProfilesData[p.id] = {
        workouts: this.getWorkouts(p.id),
        defaults: this.getStickyDefaults(p.id),
        focus: this.getFocusData(p.id),
        habits: this.getHabitsData(p.id),
      };
    }

    const backup = {
      version: 5,
      timestamp: Date.now(),
      activeProfileId: activeId,
      profiles,
      // Backward compatibility fields for v4 readers:
      workouts: this.getWorkouts(activeId),
      defaults: this.getStickyDefaults(activeId),
      focus: this.getFocusData(activeId),
      habits: this.getHabitsData(activeId),
      allProfilesData,
      partitionedData: allProfilesData,
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;

      // Version 5 multi-profile backup
      const partitions = data.allProfilesData || data.partitionedData;
      if (data.version === 5 && Array.isArray(data.profiles) && partitions) {
        this.saveProfiles(data.profiles);
        if (data.activeProfileId) {
          this.setActiveProfileId(data.activeProfileId);
        }
        for (const [pId, pData] of Object.entries(partitions as Record<string, any>)) {
          if (pData.workouts) this.saveWorkouts(pData.workouts, pId);
          if (pData.defaults) this.saveStickyDefaults(pData.defaults, pId);
          if (pData.focus) this.saveFocusData(pData.focus, pId);
          if (pData.habits) this.saveHabitsData(pData.habits, pId);
        }
        return true;
      }

      // Legacy v4 single-user backup into active profile
      const hasLegacyData = Boolean(data.workouts || data.defaults || data.focus || data.habits);
      if (hasLegacyData) {
        const activeId = this.getActiveProfileId();
        if (data.workouts) this.saveWorkouts(data.workouts, activeId);
        if (data.defaults) this.saveStickyDefaults(data.defaults, activeId);
        if (data.focus) this.saveFocusData(data.focus, activeId);
        if (data.habits) this.saveHabitsData(data.habits, activeId);
        return true;
      }

      return false;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  }
};

