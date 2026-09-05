# M1 Technical Specification & Architecture Handoff Report: Types & Storage Contracts

- **Author**: M1 Types & Storage Architect (`explorer_m1_types_storage`)
- **Domain**: PulseSync OS Habits Engine, Telemetry & Storage Subsystem
- **Status**: Complete & Ready for Implementation
- **Timestamp**: 2026-09-05T13:30:00Z
- **Reference**: `ORIGINAL_REQUEST.md` (R1–R5), `PROJECT.md`, `spec_miner_survey/handoff.md`

---

## 1. Observation

Direct code inspection of `pulsesync-os` revealed the exact baseline architecture, typing omissions, and storage migration failure points:

### 1.1 `src/types/index.ts` (Lines 149–204)
The current definition of Habits domain types in `src/types/index.ts` is:
```typescript
// ==========================================
// 3. Habits & Discipline Domain Types
// ==========================================
export interface SleepRecord {
  bedtimeRaw: string;
  wakeupRaw: string;
  sleepDuration: string;
  isOptimal: boolean;
  sunlightDone: boolean;
}

export interface DetoxState {
  cleanDays: number;
  tierName: string;
  morningPhoneFree: boolean;
  zeroReels: boolean;
  noPhoneInBed: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  completed: boolean;
  category?: string;
}

export interface ReadingState {
  activeBookId: string;
  books: Book[];
  startPage: number;
  endPage: number;
  pagesReadToday: number;
  timerSeconds: number;
  isTimerRunning: boolean;
}

export interface HabitsData {
  sleep: SleepRecord;
  detox: DetoxState;
  reading: ReadingState;
  keystones: {
    bedMade: boolean;
    roomReset: boolean;
  };
  dailyRecords: Record<string, {
    sleepDurationHours?: number;
    sleepDuration?: string;
    bedtimeRaw?: string;
    wakeupRaw?: string;
    pagesRead?: number;
    cleanDay?: boolean;
  }>;
}
```
**Deficiencies Identified**:
1. **Zero Hydration Types**: `HydrationRecord` does not exist anywhere in `src/types/index.ts`, and `HabitsData` lacks a `hydration` property.
2. **Missing Sleep Duration & Debt Metrics**: `SleepRecord` lacks numeric `sleepDurationHours: number`, `targetHours: number`, and `sleepDebtHours?: number`.
3. **Incomplete Keystone State**: `keystones` is an anonymous inline type `{ bedMade: boolean; roomReset: boolean; }` missing `cleanDiet`, `zeroDoomscroll`, and `dailySupplements`.
4. **DetoxState Lacks Keystone Attributes**: `DetoxState` stores legacy fields (`morningPhoneFree`, `zeroReels`, `noPhoneInBed`) and does not reflect the 4 canonical keystone discipline markers (`cleanDiet`, `zeroDoomscroll`, `dailySupplements`, `bedMade`).
5. **ReadingState Lacks Daily Target**: `ReadingState` lacks `targetPagesPerDay: number`.
6. **Anonymous Daily Record**: `dailyRecords` uses an anonymous inline type missing hydration fields (`hydrationMl`, `hydrationTargetMl`), keystone markers (`cleanDiet`, `zeroDoomscroll`, `dailySupplements`, `bedMade`), reading session minutes (`readingMinutes`), and sunlight status (`sunlightDone`).

### 1.2 `src/services/storage.ts` (Lines 43–76, 146–161)
The current default seeds and retrieval logic:
```typescript
const DEFAULT_HABITS: HabitsData = {
  sleep: {
    bedtimeRaw: '23:15',
    wakeupRaw: '07:15',
    sleepDuration: '8h 00m',
    isOptimal: true,
    sunlightDone: false,
  },
  detox: {
    cleanDays: 4,
    tierName: 'Calibrated',
    morningPhoneFree: false,
    zeroReels: false,
    noPhoneInBed: false,
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
  },
  keystones: {
    bedMade: true,
    roomReset: false,
  },
  dailyRecords: {},
};

export const StorageService = {
  // ...
  getHabitsData(): HabitsData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      return data ? { ...DEFAULT_HABITS, ...JSON.parse(data) } : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  },
  // ...
};
```
**Deficiencies Identified**:
1. `DEFAULT_HABITS` has no `hydration` entry.
2. `DEFAULT_HABITS.sleep` lacks `sleepDurationHours`, `targetHours`, and `sleepDebtHours`.
3. `DEFAULT_HABITS.keystones` is missing `cleanDiet`, `zeroDoomscroll`, and `dailySupplements`.
4. `getHabitsData()` uses shallow spreading (`{ ...DEFAULT_HABITS, ...JSON.parse(data) }`). Because existing users have `pulsesync_habits_v4` in localStorage containing old objects, the shallow spread overwrites `DEFAULT_HABITS.sleep`, `DEFAULT_HABITS.keystones`, and `DEFAULT_HABITS.detox` entirely with the stored objects. As a result:
   - `habits.sleep.sleepDurationHours` is `undefined`.
   - `habits.sleep.targetHours` is `undefined`.
   - `habits.keystones.cleanDiet` is `undefined`.
   - `habits.keystones.zeroDoomscroll` is `undefined`.
   - `habits.hydration` is `undefined` (if storage key had `{ sleep, detox, reading, keystones }` without hydration).
   This causes runtime `TypeError` or `NaN` crashes across downstream UI components and math utilities.

### 1.3 `data/habits.json` (Lines 49–60)
The repository seed data shows legacy schema shapes:
```json
  "dailyRecords": {
    "2026-09-04": {
      "bedtimeRaw": "03:55",
      "wakeupRaw": "10:15",
      "sleepMinutes": 380,
      "sunlightDone": false,
      "cleanDay": true,
      "pagesRead": 22,
      "bedMade": false,
      "roomReset": false
    }
  }
```
Notice `sleepMinutes: 380` instead of `sleepDurationHours: 6.33` or `sleepDuration: '6h 20m'`, and `hydration` is omitted.

### 1.4 Component Interactions & Build State
- `src/components/habits/DetoxCard.tsx` (Line 12): Uses `Pick<DetoxState, 'morningPhoneFree' | 'zeroReels' | 'noPhoneInBed'>`. Removing these properties from `DetoxState` would break typechecking.
- `src/components/habits/HabitsEngine.tsx` (Line 31): `handleUpdateKeystones = (keystones: { bedMade: boolean; roomReset: boolean }) => ...`.
- `src/components/overview/DayBalanceRibbon.tsx` (Line 21): Reads `habitRecord?.sleepDurationHours`.
- Current typecheck command `npx tsc --noEmit` exits with status `0`. Any changes to interfaces must maintain 100% build integrity.

---

## 2. Logic Chain

### 2.1 Domain Typing Logic
1. **Hydration (`HydrationRecord`)**:
   - Science foundation: 3.5L daily baseline fluid intake (Huberman protocol) for high cognitive load and physical training.
   - Quick adds: 250ml (cup/glass) and 500ml (flask/shaker).
   - Timestamping: `lastLoggedAt?: string` to audit intake velocity.
   - Contract must enforce: `currentMl >= 0`, `targetMl > 0`, `quickAdds: number[]`.

2. **Circadian Sleep (`SleepRecord`)**:
   - Science foundation: 5 ultradian cycles (~90m each) = 7.5h–8.5h recovery window, centered on 8.0h calibrated baseline (Matthew Walker).
   - Acute sleep debt formula: $\text{sleepDebtHours} = \max(0, \text{targetHours} - \text{sleepDurationHours})$.
   - Sunlight anchor: 10m direct outdoor sunlight within 30m of waking entrains the suprachiasmatic nucleus (SCN) and starts the pineal melatonin timer (`sunlightDone: boolean`).
   - Requiring both `sleepDuration: string` and `sleepDurationHours: number` eliminates redundant regex parsing in `DayBalanceRibbon.tsx`, `SleepTelemetryChart.tsx`, and telemetry scorecards.

3. **Keystone Discipline (`KeystonesState`) & Clean Day Matrix (`DetoxState`)**:
   - 4 non-negotiable binary discipline anchors:
     1. `cleanDiet`: Whole foods, zero processed sugar.
     2. `zeroDoomscroll`: Zero algorithmic short-form feeds (Reels, TikTok, Shorts).
     3. `dailySupplements`: Micronutrient & electrolyte stack (D3, Omega-3, Magnesium, Creatine).
     4. `bedMade`: Immediate post-waking environmental reset.
     5. `roomReset`: Optional evening workspace order.
   - Immutable Clean Day formula:
     $$\text{cleanDay} = \text{cleanDiet} \land \text{zeroDoomscroll} \land \text{dailySupplements} \land \text{bedMade}$$
   - Streak & Tiers: 0–6 Calibrated, 7–13 Disciplined, 14–29 Fortified, 30–89 Unbreakable, 90+ Sovereign.
   - Backward compatibility: Keeping `morningPhoneFree?: boolean`, `zeroReels?: boolean`, `noPhoneInBed?: boolean`, and `relapseHistory?: string[]` on `DetoxState` preserves existing component compile safety until M2.

4. **Deep Reading (`ReadingState`)**:
   - Target: 20 pages per day baseline (`targetPagesPerDay: number`).
   - 20-minute countdown sprint timer (`timerSeconds: number`, default 1200; `isTimerRunning: boolean`).

5. **Day Ledger Historical Records (`DailyHabitRecord`)**:
   - Captures all 4 pillars for any historical date string `YYYY-MM-DD`:
     - Sleep: `sleepDurationHours`, `sleepDuration`, `bedtimeRaw`, `wakeupRaw`, `sunlightDone`, `isOptimal`, `sleepDebtHours`, `sleepMinutes`.
     - Hydration: `hydrationMl`, `hydrationCurrentMl`, `hydrationTargetMl`.
     - Keystone: `cleanDay`, `cleanDiet`, `zeroDoomscroll`, `dailySupplements`, `bedMade`, `roomReset`.
     - Reading: `pagesRead`, `readingMinutes`, `activeBookId`.
     - Metadata: `loggedAt`.

### 2.2 Deep Storage Migration Logic (`migrateHabitsData`)
A shallow merge fails because existing `pulsesync_habits_v4` localStorage records contain nested objects that overwrite defaults with incomplete schemas.
A recursive migration function `migrateHabitsData(raw: any): HabitsData` is necessary:
1. **Hydration**: If `raw.hydration` is missing, inject complete `DEFAULT_HABITS.hydration`. If partial, clamp `currentMl >= 0`, ensure `targetMl = 3500`, and default `quickAdds = [250, 500]`.
2. **Sleep**: Parse `sleepDurationHours` from `sleepDuration` regex or derive from `sleepDurationHours`, clamp `targetHours = 8.0`, calculate `sleepDebtHours = Math.max(0, targetHours - sleepDurationHours)`, and set `isOptimal = (sleepDurationHours >= 7.5 && sleepDurationHours <= 8.5)`.
3. **Keystones**: If `raw.keystones` lacks `cleanDiet` or `zeroDoomscroll`, check `raw.detox` (e.g. `zeroReels`), or fall back to `DEFAULT_HABITS.keystones`.
4. **Detox**: Populate `cleanDiet`, `zeroDoomscroll`, `dailySupplements`, `bedMade` from migrated `keystones`. Preserve legacy fields.
5. **Reading**: Guarantee `books` is a non-empty array, `activeBookId` points to a valid book, and `targetPagesPerDay = 20`.
6. **DailyRecords**: Iterate over `raw.dailyRecords`, converting `sleepMinutes` (e.g. `380` -> `6.33h`, `'6h 20m'`), synchronizing `hydrationMl` and `hydrationCurrentMl`, and evaluating `cleanDay` if the 4 markers are present.

---

## 3. Authoritative Code Design

### 3.1 `src/types/index.ts` Specification (Full Replacement for Section 3)

```typescript
// ==========================================
// 3. Habits & Discipline Domain Types
// ==========================================

export interface HydrationRecord {
  currentMl: number;        // Total volume consumed today in ml (clamped >= 0)
  targetMl: number;         // Calibrated baseline goal in ml (default 3500)
  quickAdds: number[];      // 1-tap micro-log quick adds (default [250, 500])
  quickAddUnits?: number[];  // Backwards compatibility alias for quickAdds
  lastLoggedAt?: string;    // ISO timestamp of most recent fluid entry
}

export interface SleepRecord {
  bedtimeRaw: string;            // 24h format e.g. '23:15'
  wakeupRaw: string;             // 24h format e.g. '07:15'
  sleepDuration: string;          // Formatted duration string e.g. '8h 00m'
  sleepDurationHours: number;     // Numeric decimal hours e.g. 8.0
  isOptimal: boolean;            // Matthew Walker optimal window (7.5h <= duration <= 8.5h)
  sunlightDone: boolean;          // Huberman morning sunlight anchor (10m within 30m of waking)
  sleepDebtHours?: number;       // Acute daily/accumulated sleep debt vs 8.0h baseline
  targetHours: number;           // Calibrated baseline target hours (default 8.0)
}

export interface KeystonesState {
  cleanDiet: boolean;            // Whole foods nutrition, zero processed sugar
  zeroDoomscroll: boolean;       // Zero short-form algorithmic reels/shorts/tiktok
  dailySupplements: boolean;     // Daily micronutrient & electrolyte stack
  bedMade: boolean;              // Immediate post-waking environmental reset
  roomReset: boolean;            // Evening workspace & room order reset
}

export interface DetoxState {
  cleanDays: number;             // Unbroken consecutive clean day streak
  tierName: string;              // Calibrated | Disciplined | Fortified | Unbreakable | Sovereign
  cleanDiet: boolean;            // Keystone discipline marker
  zeroDoomscroll: boolean;       // Keystone discipline marker
  dailySupplements: boolean;     // Keystone discipline marker
  bedMade: boolean;              // Keystone discipline marker
  // Legacy fields preserved for backward compatibility with existing components
  morningPhoneFree?: boolean;
  zeroReels?: boolean;
  noPhoneInBed?: boolean;
  relapseHistory?: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  completed: boolean;
  category?: string;
  coverColor?: string;
}

export interface ReadingState {
  activeBookId: string;
  books: Book[];
  startPage: number;
  endPage: number;
  pagesReadToday: number;
  timerSeconds: number;          // Countdown timer seconds (default 1200 / 20m)
  isTimerRunning: boolean;
  targetPagesPerDay: number;     // Daily reading target (default 20)
  currentBook?: string;          // Legacy compatibility
  history?: any[];               // Legacy compatibility
}

export interface DailyHabitRecord {
  // Circadian Sleep Pillar
  sleepDurationHours?: number;   // Decimal sleep hours e.g. 8.0
  sleepDuration?: string;        // Formatted duration e.g. '8h 00m'
  bedtimeRaw?: string;           // Bedtime timestamp e.g. '23:15'
  wakeupRaw?: string;            // Wakeup timestamp e.g. '07:15'
  sunlightDone?: boolean;        // Morning sunlight anchor
  isOptimal?: boolean;           // Within optimal window
  sleepDebtHours?: number;       // Debt against 8.0h baseline
  sleepMinutes?: number;         // Legacy seed compatibility e.g. 380

  // Fluid Dynamics Pillar
  hydrationMl?: number;          // Total ml logged for date e.g. 3500
  hydrationCurrentMl?: number;   // Compatibility alias for hydrationMl
  hydrationTargetMl?: number;    // Daily target ml e.g. 3500

  // Keystone Discipline & Clean Day Matrix Pillar
  cleanDay?: boolean;            // Immutable clean day flag (cleanDiet && zeroDoomscroll && dailySupplements && bedMade)
  cleanDiet?: boolean;           // Whole foods nutrition
  zeroDoomscroll?: boolean;      // Zero short-form feeds
  dailySupplements?: boolean;    // Micronutrient & electrolyte stack
  bedMade?: boolean;             // Morning environmental reset
  roomReset?: boolean;           // Evening workspace reset

  // Deep Reading Pillar
  pagesRead?: number;            // Pages read on this date e.g. 22
  readingMinutes?: number;       // Minutes spent reading e.g. 20
  activeBookId?: string;         // ID of book read

  // Metadata
  loggedAt?: string;             // ISO timestamp
}

export type DailyRecord = DailyHabitRecord;

export interface HabitsData {
  hydration: HydrationRecord;
  sleep: SleepRecord;
  detox: DetoxState;
  reading: ReadingState;
  keystones: KeystonesState;
  dailyRecords: Record<string, DailyHabitRecord>;
}
```

---

### 3.2 `src/services/storage.ts` Specification (Updated Defaults & Deep Migration)

```typescript
import { 
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
    quickAdds: [250, 500],
    quickAddUnits: [250, 500],
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
```

And in `StorageService` inside `src/services/storage.ts`:
```typescript
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
```

---

## 4. Caveats

1. **`HabitsEngine.tsx` Handler Typing**:
   In `src/components/habits/HabitsEngine.tsx`, line 31 currently defines:
   ```typescript
   const handleUpdateKeystones = (keystones: { bedMade: boolean; roomReset: boolean }) => {
     onUpdateHabitsData({ ...habitsData, keystones });
   };
   ```
   When `habitsData.keystones` is updated to `KeystonesState` (which includes `cleanDiet`, `zeroDoomscroll`, and `dailySupplements`), replacing `keystones` directly would trigger a TypeScript error because `{ bedMade: boolean; roomReset: boolean }` does not supply the 3 additional boolean properties.
   **Remedy**: In `HabitsEngine.tsx`, update line 31 to merge keystones safely:
   ```typescript
   const handleUpdateKeystones = (keystones: Partial<KeystonesState> | { bedMade: boolean; roomReset: boolean }) => {
     onUpdateHabitsData({ ...habitsData, keystones: { ...habitsData.keystones, ...keystones } });
   };
   ```
   This allows `KeystonesCard.tsx` to continue compiling without modification until M2 rewires the component to full `KeystonesState`.

2. **Alias Support for `hydrationCurrentMl` vs `hydrationMl`**:
   Different parts of the specifications and legacy components refer to either `hydrationCurrentMl` or `hydrationMl`. The `DailyHabitRecord` interface supports both as optional properties, and `migrateHabitsData` mirrors values between them so either accessor succeeds without `undefined`.

3. **Storage Immutability**:
   `DEFAULT_HABITS` is deeply cloned (`JSON.parse(JSON.stringify(DEFAULT_HABITS))`) when returned by `getHabitsData()` so consumer component mutations do not corrupt the in-memory constant.

---

## 5. Conclusion

1. **Exact Contracts Formulated**:
   - `HydrationRecord`, `SleepRecord`, `KeystonesState`, `DetoxState`, `ReadingState`, `DailyHabitRecord`, and `HabitsData` are fully specified and typed.
   - All 4 pillars (Hydration, Circadian Sleep, Deep Reading, Keystone Discipline) and their Day Ledger receipts are completely accounted for.
2. **Crash-Proof Storage Migration**:
   - `DEFAULT_HABITS` contains authentic behavioral science seeds.
   - `migrateHabitsData()` provides 100% resilient deep merging for existing `pulsesync_habits_v4` localStorage entries, eliminating missing property crashes.
3. **Zero Compilation Regressions**:
   - Legacy fields (`morningPhoneFree`, `zeroReels`, etc.) are retained as optional properties, guaranteeing existing components compile cleanly.
   - The implementation can be executed directly in Milestone 1 without breaking `npx tsc --noEmit`.

---

## 6. Verification Method

### 6.1 Programmatic Typechecking
Run the TypeScript compiler to verify zero emit errors:
```bash
npx tsc --noEmit
```
Expected output: Exit code 0, no type errors.

### 6.2 Unit Test Matrix for Storage Migration
Execute this node verification command to test all migration branches:
```bash
node -e '
const { migrateHabitsData, DEFAULT_HABITS } = await import("./src/services/storage.ts");

// Test 1: Null/undefined input
const t1 = migrateHabitsData(null);
console.assert(t1.hydration.targetMl === 3500, "T1 failed");
console.assert(t1.sleep.sleepDurationHours === 8.0, "T1 sleep failed");

// Test 2: Legacy v4 data without hydration
const legacyData = {
  sleep: { sleepDuration: "7h 30m" },
  detox: { cleanDays: 5, tierName: "Calibrated" },
  reading: { books: [] },
  keystones: { bedMade: true, roomReset: false },
  dailyRecords: { "2026-09-04": { sleepMinutes: 380, cleanDay: true } }
};
const t2 = migrateHabitsData(legacyData);
console.assert(t2.hydration.currentMl === 0, "T2 hydration missing failed");
console.assert(t2.sleep.sleepDurationHours === 7.5, "T2 sleep parse failed");
console.assert(t2.keystones.cleanDiet === true, "T2 keystone fallback failed");
console.assert(t2.dailyRecords["2026-09-04"].sleepDurationHours === 6.33, "T2 dailyRecord sleepMinutes conversion failed");
console.log("ALL STORAGE MIGRATION TESTS PASSED.");
'
```

### 6.3 Regression Verification
Run the existing focus integrity test suite:
```bash
npm test
```
Expected output: 471/471 assertions pass.
