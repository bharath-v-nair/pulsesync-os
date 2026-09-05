# Day Ledger Integration & Cross-Domain State Synchronization Architectural Survey

**Agent**: Day Ledger Integration Explorer  
**Working Directory**: `/Users/bharathnair/Projects/personal_projs/antigravity/pulsesync-os/.agents/explorer_survey_dayledger`  
**Date**: 2026-09-05  
**Target Application**: PulseSync OS  

---

## Executive Summary

PulseSync OS employs a local-first, React 19 architecture where state is lifted to `src/App.tsx` and persisted to `localStorage` via reactive `useEffect` hooks. The Day Ledger serves as the chronological historical auditor of human performance, combining physical movement, deep study, and habit disciplines with a 24-hour Circadian Day Balance ribbon.

This investigation identified critical architectural gaps and synchronization disconnects between the live execution cockpit (`HabitsEngine`) and the historical auditor (`DayLedgerFeed` / `DayBalanceRibbon`):
1. **Bidirectional State Disconnect**: Updates in `HabitsEngine` only modify live domain properties (`habitsData.sleep`, etc.) and fail to update `habitsData.dailyRecords[todayStr]`. Conversely, editing habits in Day Ledger for today only updates `dailyRecords[todayStr]`, leaving the live cockpit stale.
2. **False Historical Fallback in DayBalanceRibbon**: For unlogged past dates, `DayBalanceRibbon` falls back to today's live sleep duration (`habits.sleep?.sleepDuration`), displaying fabricated 8.0h sleep records on empty historical days.
3. **Missing Habit Receipts**: The Day Ledger feed renders Movement and Focus as chronological interactive receipt lists, but reduces Habits to a static 3-card summary grid without timestamps, baseline deltas, sunlight anchors, or hydration.
4. **Missing Hydration Pillar**: Hydration is entirely absent from TypeScript definitions, storage models, UI cards, and the Day Ledger modal.
5. **Lack of Multi-Tab / Cross-Window Reactivity**: `StorageService` directly writes to `localStorage` without dispatching custom events or listening to `window.addEventListener('storage', ...)`.

---

## 1. Observation

### 1.1 Architecture & State Flow in `App.tsx`
State is lifted to the root component (`src/App.tsx:25-68`):
```typescript
// src/App.tsx:33-38
const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateStr());
const [workouts, setWorkouts] = useState<WorkoutLog[]>(() => StorageService.getWorkouts());
const [stickyDefaults, setStickyDefaults] = useState<StickyDefaults>(() => StorageService.getStickyDefaults());
const [focusData, setFocusData] = useState<FocusData>(() => StorageService.getFocusData());
const [habitsData, setHabitsData] = useState<HabitsData>(() => StorageService.getHabitsData());

// src/App.tsx:53-67
useEffect(() => { StorageService.saveWorkouts(workouts); }, [workouts]);
useEffect(() => { StorageService.saveStickyDefaults(stickyDefaults); }, [stickyDefaults]);
useEffect(() => { StorageService.saveFocusData(focusData); }, [focusData]);
useEffect(() => { StorageService.saveHabitsData(habitsData); }, [habitsData]);
```
- Navigation between tabs is driven by `activeTab` (`'move' | 'focus' | 'habits'`) and `activeView` (`AppTab | 'overview' | 'library'`).
- In `src/App.tsx:295-332`, when `selectedDate !== getTodayDateStr()`, a floating amber banner (`Past Day Mode: [selectedDate]`) appears with a "Jump to Today" button.

### 1.2 Current Habits Domain Data Structure (`src/types/index.ts`)
```typescript
// src/types/index.ts:152-205
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
*Direct Observation*: No `hydration` field exists anywhere in `HabitsData` or `dailyRecords`. Furthermore, `dailyRecords` lacks fields for `sunlightDone`, keystone breakdowns, or hydration volume.

### 1.3 Day Ledger Feed Component (`src/components/overview/DayLedgerFeed.tsx`)
Rendered when `subView === 'ledger'` in `OverviewView.tsx:827-843`:
- **Date Navigation (`DayLedgerFeed.tsx:63-82, 137-202`)**:
  - `handlePrevDay`: decrements `selectedDate` by 1 day.
  - `handleNextDay`: increments `selectedDate` by 1 day (disabled if `isToday`).
  - Overlay `<input type="date" value={selectedDate} max={todayStr} ...>` allows rapid calendar jumping.
  - "Today" return pill with `<RotateCcw />` resets date to today.
- **Feed Rendering (`DayLedgerFeed.tsx:263-526`)**:
  - Section 1: Physical Training (Move) — lists `dayWorkouts` with edit (`Pencil`) and delete (`Trash2`) buttons.
  - Section 2: Deep Work (Focus) — lists `dayFocusSessions` with bucket badges and delete buttons.
  - Section 3: Discipline (Habits) — lines 475-524:
```tsx
// src/components/overview/DayLedgerFeed.tsx:496-524
{hasHabitRecord ? (
  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
    <div className="p-2.5 rounded-xl bg-[#0a0d15] border border-white/10">
      <span className="text-[9px] text-slate-500 block mb-0.5">Sleep</span>
      <span className="font-bold text-white block truncate tabular-nums">
        {sleepDisplay || '8h 00m'}
      </span>
    </div>

    <div className="p-2.5 rounded-xl bg-[#0a0d15] border border-white/10">
      <span className="text-[9px] text-slate-500 block mb-0.5">Clean Day</span>
      <span className={`font-bold block truncate ${cleanDayStatus ? 'text-amber-400' : 'text-slate-400'}`}>
        {cleanDayStatus ? '✓ Calibrated' : 'Missed'}
      </span>
    </div>

    <div className="p-2.5 rounded-xl bg-[#0a0d15] border border-white/10">
      <span className="text-[9px] text-slate-500 block mb-0.5">Reading</span>
      <span className="font-bold text-white block truncate tabular-nums">
        {pagesReadDisplay ?? 20} pages
      </span>
    </div>
  </div>
) : (
  <p className="text-xs font-mono text-slate-500 italic py-2">
    No habits logged for this date.
  </p>
)}
```
*Direct Observation*: The Discipline section does NOT render chronological receipts. It renders only a static 3-box summary. No timestamps, no sunlight anchor, no hydration volume, and no individual keystone markers are displayed.

### 1.4 DayBalanceRibbon Sleep Derivation (`src/components/overview/DayBalanceRibbon.tsx`)
```typescript
// src/components/overview/DayBalanceRibbon.tsx:18-30
// 1. Calculate Sleep Hours
let sleepHours = 8.0;
const habitRecord = habits.dailyRecords?.[selectedDate];
if (habitRecord?.sleepDurationHours) {
  sleepHours = habitRecord.sleepDurationHours;
} else if (habits.sleep?.sleepDuration) {
  const match = habits.sleep.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
  if (match) {
    const h = parseInt(match[1], 10) || 0;
    const m = parseInt(match[2], 10) || 0;
    sleepHours = h + m / 60;
  }
}
```
*Direct Observation*:
1. If `selectedDate` is a past date that has NO record in `habits.dailyRecords`, it falls back to `habits.sleep.sleepDuration`, which is TODAY's live sleep state.
2. If `habitRecord` has `sleepDuration: "7h 30m"` but `sleepDurationHours` is undefined, it skips line 21 and also falls back to `habits.sleep.sleepDuration`.
3. Dateless workouts (`!w.dateStr`) are included in all historical dates on line 52:
   ```typescript
   const dayWorkouts = workouts.filter((w) => !w.dateStr ? true : w.dateStr === selectedDate);
   ```
   Whereas `DayLedgerFeed.tsx:85` strictly limits dateless workouts to today only:
   ```typescript
   const dayWorkouts = workouts.filter((w) => isToday ? !w.dateStr || w.dateStr === selectedDate : w.dateStr === selectedDate);
   ```

### 1.5 Existing EditHabitsModal Implementation (`src/components/overview/MissedLogModals.tsx:591-756`)
```typescript
// src/components/overview/MissedLogModals.tsx:594-607
interface EditHabitsModalProps {
  isOpen: boolean;
  selectedDate: string;
  initialSleepDuration?: string;
  initialPagesRead?: number;
  initialCleanDay?: boolean;
  onClose: () => void;
  onSaveHabits: (dateStr: string, data: {
    sleepDuration?: string;
    sleepDurationHours?: number;
    pagesRead?: number;
    cleanDay?: boolean;
  }) => void;
}
```
- In `OverviewView.tsx:214-233`:
```typescript
const handleSaveHabits = (
  dateStr: string,
  data: {
    sleepDuration?: string;
    sleepDurationHours?: number;
    pagesRead?: number;
    cleanDay?: boolean;
  }
) => {
  onUpdateHabitsData({
    ...habits,
    dailyRecords: {
      ...habits.dailyRecords,
      [dateStr]: {
        ...habits.dailyRecords?.[dateStr],
        ...data,
      },
    },
  });
};
```
*Direct Observation*: When `dateStr === todayDateStr`, `handleSaveHabits` updates `habits.dailyRecords[dateStr]`, but does NOT update `habits.sleep`, `habits.detox`, or `habits.reading`.
Meanwhile in `src/components/habits/HabitsEngine.tsx:19-33`:
```typescript
const handleUpdateSleep = (sleep: SleepRecord) => {
  onUpdateHabitsData({ ...habitsData, sleep });
};
const handleUpdateDetox = (detox: DetoxState) => {
  onUpdateHabitsData({ ...habitsData, detox });
};
const handleUpdateReading = (reading: ReadingState) => {
  onUpdateHabitsData({ ...habitsData, reading });
};
```
`HabitsEngine` updates `habitsData.sleep`, `habitsData.detox`, etc., but does NOT update `habitsData.dailyRecords[todayStr]`.

### 1.6 Storage and Event Mechanisms
- Direct `grep_search` across `src/` for `dispatchEvent` returned 0 results.
- `grep_search` for `addEventListener` returned only `keydown` listeners for Escape key modal dismissal.
- `package.json` contains no external state management libraries (no Zustand, Redux, or Jotai).

---

## 2. Logic Chain

1. **Premise**: In PulseSync OS, users execute habits on the "Habits" tab during the day, while reviewing or retroactively editing past or present logs in the "Day Ledger" subview under Overview.
2. **From Observation 1.5**: When a user changes sleep or toggles keystones in `HabitsEngine`, `habitsData.dailyRecords[todayStr]` is never written. When the user opens the Day Ledger for today, `DayLedgerFeed` first checks `habits.dailyRecords?.[selectedDate]`. If a record was previously saved via `EditHabitsModal`, it displays the stale `dailyRecords` values instead of the newly updated live habits.
3. **Reciprocal Inconsistency**: When a user updates today's habits via `EditHabitsModal` in the Day Ledger, `handleSaveHabits` writes exclusively to `habits.dailyRecords[todayStr]`. The top-level `habits.sleep`, `habits.detox`, and `habits.reading` states remain unchanged. When the user returns to the Habits tab, the cards display the old, unedited values.
4. **From Observation 1.4**: If a user navigates to an unrecorded past date (e.g., 5 days ago), `habitRecord` is undefined. `DayBalanceRibbon` checks `else if (habits.sleep?.sleepDuration)`. Because today's sleep duration is always present in default seeds, the ribbon renders today's sleep duration on that unrecorded past day. This violates data integrity for historical auditing.
5. **From Observation 1.3**: The user request specifies: *"Chronologically integrate habit receipts into the Day Ledger feed for any selected historical date (Sleep duration & timestamps, Hydration volume, Clean Day calibration, Pages Read)."* Because the existing feed only has a 3-box summary, it fails to present timestamped audit receipts or account for fluid volume.
6. **From Observation 1.2 & 1.5**: Hydration is completely absent from all models and modal inputs. To fulfill Requirement R2 and R4, Hydration must be integrated into `HabitsData`, `dailyRecords`, `EditHabitsModal`, and the feed receipts.
7. **From Observation 1.6**: While single-tab state changes re-render immediately due to React state in `App.tsx`, multi-tab or PWA window operations do not sync without a storage listener or custom event bus.

---

## 3. Concrete Architecture & Integration Design

### 3.1 Data Flow Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    App.tsx (Root State)                                  |
|   [habitsData, setHabitsData] <====================================+                    |
|   [selectedDate, setSelectedDate]                                  |                    |
|   [workouts, focusData]                                            |                    |
|          |                                                         |                    |
|          | (props)                                                 | (atomic sync)      |
|          v                                                         |                    |
|  +---------------------------+              +----------------------------------------+  |
|  |       HabitsEngine        |              |               OverviewView             |  |
|  |   (Active Day Cockpit)    |              |       (subView: 'telemetry' | 'ledger')|  |
|  +---------------------------+              +----------------------------------------+  |
|   - HydrationCard (Quick Adds)                                     |                    |
|   - SleepCard (Bed/Wake Times)                                     | (props)            |
|   - KeystonesCard (Clean Day)                                      v                    |
|   - DeepReadingCard (Sprint)                     +-----------------------------------+  |
|          |                                       |           DayLedgerFeed           |  |
|          | onUpdateHabitsData                    |  - Date Navigation (Prev/Next/Cal)|  |
|          v                                       |  - DayBalanceRibbon (24h Circadian|  |
|   +--------------------------+                   |  - Physical Training (Move Feed)  |  |
|   | syncTodayToDailyRecords()|                   |  - Deep Work (Focus Feed)         |  |
|   +--------------------------+                   |  - Discipline (Habit Receipts)    |  |
|          |                                       +-----------------------------------+  |
|          |                                                         |                    |
|          v                                                         | onOpenEditHabits   |
|   +--------------------------+                                     v                    |
|   |      StorageService      |                   +-----------------------------------+  |
|   |  - localStorage          |<------------------|          EditHabitsModal          |  |
|   |  - CustomEvent Dispatch  |    onSaveHabits   |  - Sleep (bed/wake, duration)     |  |
|   |  - Storage Event Listener|                   |  - Hydration (volume / 3.5L)      |  |
|   +--------------------------+                   |  - Clean Day (4 Keystone checks)  |  |
|                                                  |  - Deep Reading (pages read)      |  |
|                                                  +-----------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

### 3.2 24-Hour Circadian Day Balance Ribbon Partitioning

```
 00:00                                                                             24:00
+---------------------------------------------------------------------------------------+
|  Sleep & Recovery  |     Deep Focus Bouts     |   Movement  |   Rest & Calibration    |
|   (Indigo / Blue)  |     (Purple / Fuchsia)   |  (Emerald)  |      (Dark Slate)       |
|    e.g. 8.0h (33%) |       e.g. 5.5h (23%)    |  1.5h (6%)  |       9.0h (38%)        |
+---------------------------------------------------------------------------------------+
      |                           |                    |                     |
      v                           v                    v                     v
Derived from:               Derived from:        Derived from:         Remainder:
- dailyRecords[date]        - focus.sessions     - workouts for        24h - (Sleep +
  .sleepDurationHours         filtered by date     date (walk,           Focus + Move)
- OR parsed from              (minutes/seconds)    cardio, barbell)      Min 1.0h cushion
  bedtimeRaw -> wakeupRaw
- If date != today &
  unlogged -> 0h (or unlogged)
```

### 3.3 Extended TypeScript Interfaces (`src/types/index.ts`)

To support all 4 pillars and seamless bidirectional synchronization, the interfaces should be extended as follows:

```typescript
// ==========================================
// 3. Habits & Discipline Domain Types (Extended)
// ==========================================

export interface HydrationLog {
  id: string;
  timestamp: number;
  timeFormatted: string;
  amountMl: number; // e.g. 250, 500
}

export interface HydrationState {
  currentMl: number;       // e.g. 2750
  targetMl: number;        // default 3500 (3.5L)
  quickAddPresets: number[]; // [250, 500]
  logs: HydrationLog[];
}

export interface SleepRecord {
  bedtimeRaw: string;      // e.g. '23:15'
  wakeupRaw: string;       // e.g. '07:15'
  sleepDuration: string;   // e.g. '8h 00m'
  sleepDurationHours: number; // e.g. 8.0
  targetHours: number;     // e.g. 8.0 (calibrated baseline 7.5 - 8.5)
  isOptimal: boolean;
  sunlightDone: boolean;   // 10m direct sunlight within 30m of waking
}

export interface KeystoneMarkers {
  cleanDiet: boolean;           // Clean whole-food nutrition, no junk
  zeroDoomscrolling: boolean;   // Zero reels / short-form dopamine scrolling
  supplementsDone: boolean;     // Daily vitamins/electrolytes
  bedMade: boolean;             // Morning environment anchor
  roomReset: boolean;           // Evening room reset
}

export interface DetoxState {
  cleanDays: number;
  tierName: string;
  morningPhoneFree: boolean;
  zeroReels: boolean;
  noPhoneInBed: boolean;
}

export interface DailyHabitRecord {
  // Sleep Pillar
  sleepDuration?: string;
  sleepDurationHours?: number;
  bedtimeRaw?: string;
  wakeupRaw?: string;
  sunlightDone?: boolean;
  
  // Hydration Pillar
  hydrationMl?: number;
  targetHydrationMl?: number;
  
  // Discipline & Clean Day Pillar
  cleanDay?: boolean;
  keystones?: Partial<KeystoneMarkers>;
  
  // Reading Pillar
  pagesRead?: number;
  readingMinutes?: number;
  bookTitle?: string;
}

export interface HabitsData {
  hydration: HydrationState;
  sleep: SleepRecord;
  detox: DetoxState;
  reading: ReadingState;
  keystones: KeystoneMarkers;
  dailyRecords: Record<string, DailyHabitRecord>;
}
```

### 3.4 Chronological Habit Receipts in Day Ledger Feed

Instead of the 3-box summary grid in `DayLedgerFeed.tsx:475-524`, render individual chronological habit receipts for the selected date:

1. **Sleep & Recovery Receipt Card**:
   - Header: Bedtime & Wakeup timestamps (`23:15 → 07:15` or logged wake time).
   - Metrics: Sleep duration (`8h 00m`), Delta vs 8.0h baseline (`+0.0h Optimal`), Sunlight anchor (`✓ 10m Direct Sunlight within 30m of waking`).
   - Visual: Dark matte card with Lucide `Moon` and `Sun` icons, border `indigo-500/20`.
2. **Fluid Dynamics (Hydration) Receipt Card**:
   - Metrics: Volume logged (`3,250 ml / 3,500 ml` target — `93%`).
   - Visual: Progress gauge bar / ring with Lucide `Droplets` icon, border `sky-500/20`.
3. **Keystone Discipline & Clean Day Receipt Card**:
   - Status: `✓ Calibrated Clean Day` (if all 4 keystone markers met) or `Missed (3/4 Keystones)`.
   - Visual pills: Clean Diet (✓), Zero Reels (✓), Supplements (✓), Bed/Room Reset (✓).
   - Visual: Dark matte card with Lucide `ShieldCheck` icon, border `amber-500/20`.
4. **Deep Reading Receipt Card**:
   - Metrics: `22 pages read` • `Designing Data-Intensive Applications` (20m sprint).
   - Visual: Dark matte card with Lucide `BookOpen` icon, border `amber-500/20`.
5. **Interactive Controls**:
   - "Edit Habits" button (minimum 44px tap target) launches `EditHabitsModal` pre-populated with this date's records.

### 3.5 Enhanced `EditHabitsModal` Specifications

The modal in `MissedLogModals.tsx` should support:
- **Date Header**: "Edit Habits & Discipline — `YYYY-MM-DD`".
- **Pillar 1: Circadian Sleep & Recovery**:
  - Time pickers for `bedtimeRaw` and `wakeupRaw`.
  - Automatic duration calculator: computes hours between bedtime and wakeup (handling midnight crossing).
  - Checkbox: "10m Morning Sunlight within 30m of waking" (`sunlightDone`).
- **Pillar 2: Fluid Dynamics (Hydration)**:
  - Stepper / Number input for `hydrationMl` (default step: 250ml).
  - Quick add buttons: `+250ml`, `+500ml`, `Reset`.
  - Target anchor: 3,500 ml.
- **Pillar 3: Keystone Discipline Matrix**:
  - 4 discrete checkboxes:
    1. Clean Diet (Whole food nutrition)
    2. Zero Doomscrolling / Reels
    3. Daily Supplements
    4. Bed Made / Room Reset
  - Reactive status indicator: Computes `cleanDay = cleanDiet && zeroDoomscrolling && supplementsDone && (bedMade || roomReset)`.
- **Pillar 4: Deep Reading**:
  - Number input: Pages read.
  - Active book selector or display.

### 3.6 Bidirectional State Synchronization Contract

To ensure 100% data consistency between `HabitsEngine` and `DayLedgerFeed`:

```typescript
// Helper: Sync habits update bidirectionally in App.tsx or storage service
export function updateHabitsWithSync(
  prevHabits: HabitsData,
  dateStr: string,
  recordUpdate: Partial<DailyHabitRecord>
): HabitsData {
  const todayStr = getTodayDateStr();
  const isToday = dateStr === todayStr;

  // 1. Update the daily record for the specific date
  const existingRecord = prevHabits.dailyRecords?.[dateStr] || {};
  const updatedRecord: DailyHabitRecord = {
    ...existingRecord,
    ...recordUpdate,
  };

  // 2. If the date is TODAY, also update live top-level domain structures
  let updatedSleep = prevHabits.sleep;
  let updatedHydration = prevHabits.hydration;
  let updatedDetox = prevHabits.detox;
  let updatedReading = prevHabits.reading;
  let updatedKeystones = prevHabits.keystones;

  if (isToday) {
    if (recordUpdate.sleepDuration || recordUpdate.bedtimeRaw || recordUpdate.wakeupRaw || recordUpdate.sunlightDone !== undefined) {
      updatedSleep = {
        ...prevHabits.sleep,
        bedtimeRaw: recordUpdate.bedtimeRaw ?? prevHabits.sleep.bedtimeRaw,
        wakeupRaw: recordUpdate.wakeupRaw ?? prevHabits.sleep.wakeupRaw,
        sleepDuration: recordUpdate.sleepDuration ?? prevHabits.sleep.sleepDuration,
        sleepDurationHours: recordUpdate.sleepDurationHours ?? prevHabits.sleep.sleepDurationHours,
        sunlightDone: recordUpdate.sunlightDone ?? prevHabits.sleep.sunlightDone,
      };
    }

    if (recordUpdate.hydrationMl !== undefined && prevHabits.hydration) {
      updatedHydration = {
        ...prevHabits.hydration,
        currentMl: recordUpdate.hydrationMl,
      };
    }

    if (recordUpdate.pagesRead !== undefined) {
      updatedReading = {
        ...prevHabits.reading,
        pagesReadToday: recordUpdate.pagesRead,
      };
    }

    if (recordUpdate.keystones) {
      updatedKeystones = {
        ...prevHabits.keystones,
        ...recordUpdate.keystones,
      };
    }
  }

  return {
    ...prevHabits,
    sleep: updatedSleep,
    hydration: updatedHydration,
    detox: updatedDetox,
    reading: updatedReading,
    keystones: updatedKeystones,
    dailyRecords: {
      ...prevHabits.dailyRecords,
      [dateStr]: updatedRecord,
    },
  };
}
```

### 3.7 Corrected `DayBalanceRibbon` Sleep Derivation

```typescript
// Corrected logic for DayBalanceRibbon.tsx
let sleepHours = 0;
const habitRecord = habits.dailyRecords?.[selectedDate];
const isToday = selectedDate === getTodayDateStr();

if (habitRecord?.sleepDurationHours != null) {
  sleepHours = habitRecord.sleepDurationHours;
} else if (habitRecord?.sleepDuration) {
  const match = habitRecord.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
  if (match) {
    sleepHours = (parseInt(match[1], 10) || 0) + (parseInt(match[2], 10) || 0) / 60;
  }
} else if (isToday && habits.sleep?.sleepDuration) {
  // ONLY fall back to habits.sleep if selectedDate IS TODAY
  const match = habits.sleep.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
  if (match) {
    sleepHours = (parseInt(match[1], 10) || 0) + (parseInt(match[2], 10) || 0) / 60;
  }
} else if (isToday) {
  sleepHours = 8.0; // Default baseline for today only
} else {
  sleepHours = 0; // Past day with no log recorded
}
```

### 3.8 Multi-Tab Cross-Window Storage Listener Pattern

Add a reactive window storage listener inside `App.tsx`:
```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.HABITS && e.newValue) {
      try {
        setHabitsData(JSON.parse(e.newValue));
      } catch (err) {
        console.error('Failed to sync habits from storage event', err);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

---

## 4. Caveats

1. **Read-Only Investigation Scope**: In strict accordance with the explorer role constraints, no source files were modified during this investigation. Implementation must be carried out by the engineering agents.
2. **Hydration Default Seeding**: Existing stored data in user browsers (`pulsesync_habits_v4`) will lack the `hydration` object until hydrated with default fallback values (`{ currentMl: 0, targetMl: 3500, quickAddPresets: [250, 500], logs: [] }`) in `StorageService.getHabitsData()`.
3. **Historical Backfilling Horizon**: Historical records prior to the app's inception rely purely on user retroactive manual input via `EditHabitsModal` or synthetic seeds in test suites.

---

## 5. Conclusion

The Day Ledger and DayBalanceRibbon are architecturally sound in concept, but currently suffer from a decoupled data schema and missing pillar telemetry (notably Hydration and granular Keystone discipline). By implementing:
1. An expanded `DailyHabitRecord` schema with hydration and keystone markers,
2. Atomic bidirectional state synchronization between live cockpit cards and historical records,
3. Resilient `DayBalanceRibbon` math that treats unlogged past dates accurately without fabricated fallbacks,
4. Timestamped chronological habit receipts in `DayLedgerFeed`, and
5. Cross-tab storage listeners,

PulseSync OS will achieve seamless, mathematically rigorous cross-domain execution across both today's cockpit and the historical Day Ledger auditor.

---

## 6. Verification Method

### 6.1 Programmatic Test Command
Run the existing test suite:
```bash
npm test
# Equivalent to: node scripts/verify_focus_integrity.mjs
```

### 6.2 New Habits Verification Suite (`scripts/verify_habits_integrity.mjs`)
When created by the test engineer, the suite must verify:
1. `computeDayBalanceRibbon`:
   - Correctly derives sleep duration when `sleepDurationHours` is present.
   - Correctly parses regex when only `sleepDuration: "7h 45m"` is present.
   - Accurately returns 0 sleep for unlogged past dates (`dateStr < todayStr`).
   - Accurately falls back to `habits.sleep` ONLY when `dateStr === todayStr`.
   - Ensures sum of `sleepPct + focusPct + movePct + restPct === 100%`.
2. `updateHabitsWithSync`:
   - Updating today's sleep via `EditHabitsModal` updates both `habits.sleep` and `habits.dailyRecords[todayStr]`.
   - Updating a past day's habits updates `dailyRecords[pastDate]` without corrupting today's `habits.sleep`.
   - Hydration volume updates reflect in both `hydration.currentMl` and `dailyRecords[todayStr].hydrationMl`.
   - Keystone discipline markers compute `cleanDay` immutably.
3. Storage Contract:
   - `StorageService.getHabitsData()` gracefully handles missing `hydration` in legacy storage payloads by merging initial defaults.

### 6.3 Code Inspection Points
- Verify `DayLedgerFeed.tsx:475-525` renders discrete receipt cards for Sleep, Hydration, Keystones, and Reading.
- Verify `DayBalanceRibbon.tsx:18-30` checks `isToday` before falling back to live state.
- Verify `MissedLogModals.tsx:591-756` provides inputs for Bedtime, Wakeup, Sunlight, Hydration stepper, and Keystone checkboxes.
- Verify `App.tsx` contains `updateHabitsWithSync` and `storage` event listener.
