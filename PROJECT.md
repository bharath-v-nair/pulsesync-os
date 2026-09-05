# Project: PulseSync OS Habits Engine & Telemetry Revamp

## Architecture
PulseSync OS is a local-first, React 19 + TypeScript + Vite + Tailwind CSS performance operating system.
The Habits domain operates as an elite behavioral execution cockpit adhering to Matthew Walker sleep architecture, Andrew Huberman circadian light & hydration protocols, and James Clear cue-friction loops.

### Data Flow & Architecture
1. **Local-First Reactive State**:
   - Central state lifted to `src/App.tsx` (`habitsData`, `selectedDate`).
   - Persisted to `localStorage` via key `pulsesync_habits_v4`.
   - Bidirectional synchronization between live today cockpit state (`habitsData.sleep`, `habitsData.hydration`, etc.) and historical records (`habitsData.dailyRecords[dateStr]`).
2. **Habits Execution Cockpit (`src/components/habits/`)**:
   - Four Core Pillars: Hydration / Fluid Dynamics (`HydrationCard`), Circadian Sleep & Recovery (`SleepCard`), Deep Reading & Knowledge (`DeepReadingCard`), Keystone Discipline & Clean Day Matrix (`KeystonesCard`).
   - Strict 44px minimum tap targets, zero cartoon emojis (Lucide SVG icons only), pure dark matte cockpit styling (#090d16, #0c101a, border-white/10, font-mono), tactile haptics.
3. **Overview Telemetry (`src/components/overview/`)**:
   - Target-Anchored Scorecards Quad dynamically scaling targets and metrics across 7D, 14D, 30D, 90D horizons.
   - Multi-pillar 7-Day Habit Consistency Matrix (5 pillars x 7 days) with aggregate consistency percentage.
   - Habits Adherence Ledger with baseline vs stretch targets and completion pacing.
4. **Day Ledger & 24h Circadian Ribbon Integration**:
   - Chronological habit receipts in `DayLedgerFeed.tsx` for any selected date.
   - Full historical backfilling and editing via `EditHabitsModal` with instant multi-domain synchronization.
   - 24-Hour `DayBalanceRibbon` consuming accurate circadian sleep duration without fabricated historical fallbacks.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Hydration Data Contract | HydrationRecord schema, targetMl (3.5L), currentMl, quick-adds, storage migration | M1 | ORIGINAL_REQUEST §R2.1 |
| 2 | Sleep Math & Contracts | 24h cross-midnight duration math, 8.0h baseline, sunlight anchor, sleep debt calculation | M1 | ORIGINAL_REQUEST §R2.2 |
| 3 | Keystone Clean Day Logic | 4 binary markers (Clean Diet, Zero Doomscroll, Daily Supplements, Bed Made) computing immutable cleanDay | M1 | ORIGINAL_REQUEST §R2.4 |
| 4 | Deep Reading Contracts | Bookshelf schema, pagesReadToday, 20m sprint timer, session duration | M1 | ORIGINAL_REQUEST §R2.3 |
| 5 | Storage Migration & Seeds | Safe deep hydration seeding in storage.ts and rich realistic test data in habits.json | M1 | ORIGINAL_REQUEST §R1, R2 |
| 6 | Math Utilities Module | Modular pure functions for sleep duration, debt, clean day, hydration stats, horizon scaling | M1 | ORIGINAL_REQUEST §R2, R3 |
| 7 | Hydration Cockpit UI | SVG circular progress ring (r=50, C=314.16), +250ml/+500ml quick adds, steppers, Lucide Droplets | M2 | ORIGINAL_REQUEST §R2.1, R5 |
| 8 | Circadian Sleep Cockpit UI | 24h HH:mm inputs, auto duration, 8.0h baseline delta, sunlight anchor toggle (Lucide Sun) | M2 | ORIGINAL_REQUEST §R2.2, R5 |
| 9 | Deep Reading Cockpit UI | Page steppers, 20m countdown timer with haptic completion, direct Library navigation | M2 | ORIGINAL_REQUEST §R2.3, R5 |
| 10 | Keystone Discipline Matrix UI | 4 interactive binary switches, reactive cleanDay badge, streak counter & tier badge | M2 | ORIGINAL_REQUEST §R2.4, R5 |
| 11 | Pure Cockpit Ergonomics | Strict 44px tap targets, pure dark matte styling (#090d16), zero emojis, tactile haptics | M2 | ORIGINAL_REQUEST §R5 |
| 12 | Dynamic Horizon Scaling Quad | 4 scorecards (Sleep, Clean Days, Hydration, Reading) dynamically scaling for 7D/14D/30D/90D | M3 | ORIGINAL_REQUEST §R3 |
| 13 | 7-Day Habit Consistency Matrix | 5-pillar x 7-day grid with dark matte Lucide SVG icons and aggregate consistency % score | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Habits Adherence Ledger | High-signal baseline vs stretch breakdown with completion pacing and deltas | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Day Ledger Habit Receipts | Chronological 4-column receipt in DayLedgerFeed (Sleep, Hydration, Clean Day, Reading) | M4 | ORIGINAL_REQUEST §R4 |
| 16 | EditHabitsModal Full Editing | Comprehensive modal supporting editing/backfilling all 4 pillars for any date | M4 | ORIGINAL_REQUEST §R4 |
| 17 | Bidirectional State Sync | Syncing live today state with dailyRecords[today] and vice versa on all edit actions | M4 | ORIGINAL_REQUEST §R4 |
| 18 | 24h Circadian Ribbon Sync | Accurate sleep partitioning in DayBalanceRibbon without false past-day fallbacks | M4 | ORIGINAL_REQUEST §R4 |
| 19 | Programmatic E2E Test Suite | scripts/verify_habits_integrity.mjs testing 100% of calculations, storage, feeds | Final | ORIGINAL_REQUEST Quality Gate |
| 20 | Mobile Viewport Visual Audit | 390x844 mobile viewport verification on http://localhost:3002/ ensuring zero layout shifts | Final | ORIGINAL_REQUEST Quality Gate |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Data Engine & Storage Contracts | Types, storage migration, default seeds, pure math calculation engine | none | PLANNED |
| 2 | M2: Four Core Habit Execution Pillars UI | HydrationCard, SleepCard, DeepReadingCard, KeystonesCard, HabitsEngine layout | M1 | PLANNED |
| 3 | M3: Overview Telemetry & Dynamic Horizon Scaling | 4 scaled scorecards, 7D consistency matrix, adherence ledger | M1 | PLANNED |
| 4 | M4: Day Ledger Bidirectional Sync & Ribbon | DayLedger receipts, EditHabitsModal, DayBalanceRibbon circadian fix, live sync | M1, M2 | PLANNED |
| 5 | Final: Quality Gate Verification & Mobile Audit | Programmatic test suite 100% pass + mobile viewport visual audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### Hydration Record & State
```typescript
export interface HydrationRecord {
  currentMl: number;       // default 0, clamped >= 0
  targetMl: number;        // default 3500 (3.5L)
  quickAdds: number[];     // [250, 500]
  lastLoggedAt?: string;   // ISO timestamp
}
```

### Sleep Record & State
```typescript
export interface SleepRecord {
  bedtimeRaw: string;           // '23:15'
  wakeupRaw: string;            // '07:15'
  sleepDuration: string;         // '8h 00m'
  sleepDurationHours: number;    // 8.0
  isOptimal: boolean;           // duration >= 7.5 && duration <= 8.5
  sunlightDone: boolean;         // 10m morning sunlight within 30m of waking
  sleepDebtHours?: number;      // calculated acute debt
  targetHours: number;          // 8.0 baseline
}
```

### Keystone Discipline & Clean Day State
```typescript
export interface KeystonesState {
  cleanDiet: boolean;           // whole foods nutrition, zero processed sugar
  zeroDoomscroll: boolean;      // zero short-form algorithmic reels/shorts/tiktok
  dailySupplements: boolean;    // daily micronutrient & electrolyte stack
  bedMade: boolean;             // immediate post-waking environmental reset
  roomReset: boolean;           // evening desk/room order
}

export interface DetoxState {
  cleanDays: number;            // unbroken consecutive clean day streak
  tierName: string;             // Calibrated | Disciplined | Fortified | Unbreakable | Sovereign
  cleanDiet: boolean;
  zeroDoomscroll: boolean;
  dailySupplements: boolean;
  bedMade: boolean;
}
```

### Reading State
```typescript
export interface ReadingState {
  activeBookId: string;
  books: Book[];
  startPage: number;
  endPage: number;
  pagesReadToday: number;
  timerSeconds: number;         // default 1200 (20m)
  isTimerRunning: boolean;
  targetPagesPerDay: number;    // default 20
}
```

### DailyHabitRecord (`habits.dailyRecords[dateStr]`)
```typescript
export interface DailyHabitRecord {
  sleepDurationHours?: number;
  sleepDuration?: string;
  bedtimeRaw?: string;
  wakeupRaw?: string;
  sunlightDone?: boolean;
  hydrationMl?: number;
  hydrationTargetMl?: number;
  cleanDiet?: boolean;
  zeroDoomscroll?: boolean;
  dailySupplements?: boolean;
  bedMade?: boolean;
  roomReset?: boolean;
  cleanDay?: boolean;           // true iff cleanDiet && zeroDoomscroll && dailySupplements && bedMade
  pagesRead?: number;
  readingMinutes?: number;
  loggedAt?: string;
}
```

### Overall HabitsData
```typescript
export interface HabitsData {
  hydration: HydrationRecord;
  sleep: SleepRecord;
  detox: DetoxState;
  reading: ReadingState;
  keystones: KeystonesState;
  dailyRecords: Record<string, DailyHabitRecord>;
}
```

## Code Layout
- `src/types/index.ts`: Core domain TypeScript interfaces
- `src/services/storage.ts`: Local storage migration, default seeds (`DEFAULT_HABITS`)
- `src/utils/habitsMath.ts`: Pure mathematical models (circadian duration, debt, clean day, scaling)
- `src/components/habits/HydrationCard.tsx`: SVG ring, quick adds, steppers
- `src/components/habits/SleepCard.tsx`: 24h inputs, sunlight anchor, debt display
- `src/components/habits/DeepReadingCard.tsx`: Page logging, sprint timer, shelf link
- `src/components/habits/KeystonesCard.tsx`: 4 binary switches, reactive cleanDay, streak
- `src/components/habits/HabitsEngine.tsx`: Orchestrates 4 pillar cards
- `src/components/overview/HabitsOverviewTelemetry.tsx`: 4 scaled scorecards, matrix, ledger
- `src/components/overview/HabitConsistencyMatrix.tsx`: 5 pillars x 7 days grid
- `src/components/overview/HabitsAdherenceLedger.tsx`: Baseline vs stretch breakdown
- `src/components/overview/DayLedgerFeed.tsx`: Chronological habit receipts
- `src/components/overview/MissedLogModals.tsx`: EditHabitsModal multi-pillar editing
- `src/components/overview/DayBalanceRibbon.tsx`: 24h circadian partition
- `scripts/verify_habits_integrity.mjs`: Programmatic verification test suite
