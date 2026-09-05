# Habits Engine & Telemetry Codebase Survey Report (PulseSync OS)

**Date**: 2026-09-05T13:21:00Z  
**Explorer**: Habits Engine Codebase Explorer  
**Target Reference**: `/Users/bharathnair/Projects/personal_projs/antigravity/pulsesync-os/.agents/ORIGINAL_REQUEST.md`  
**Workspace**: `/Users/bharathnair/Projects/personal_projs/antigravity/pulsesync-os`  

---

## 1. OBSERVATION

### 1.1 Project Structure & Dev Server Configuration
- **Platform**: React 19 (`19.2.8`), React DOM (`19.2.8`), TypeScript (`5.7.3`), Vite (`6.2.0`), Lucide-React (`^1.22.0`) (`package.json:13-24`).
- **Dev Server Configuration**:
  - `vite.config.ts:7-10` sets `server: { port: 3000, host: true }`.
  - `ORIGINAL_REQUEST.md:10` specifies Target URL: `http://localhost:3002/`.
  - Port status check via `lsof -nP -i :3000 -i :3002` revealed active listening Node.js processes on **both** port 3000 (PID 27956) and port 3002 (PID 8434).
  - Production build and typecheck command in `package.json`: `"build": "tsc -b && vite build"`.
  - Test command in `package.json`: `"test": "node scripts/verify_focus_integrity.mjs"`.

### 1.2 Habits Domain Files Catalog
The codebase currently contains the following files directly touching the Habits domain:

| File Path | Role | Key Exports / Lines |
|---|---|---|
| `src/types/index.ts` | Type definitions for habits, books, and daily records | Lines 150–205: `SleepRecord`, `DetoxState`, `Book`, `ReadingState`, `HabitsData`, `AppTab`, `ActiveView` |
| `src/services/storage.ts` | Local-First Storage persistence & seeding | Lines 8–13 (`STORAGE_KEYS.HABITS`), 43–76 (`DEFAULT_HABITS`), 146–162 (`getHabitsData`, `saveHabitsData`), 163–187 (`exportAllJson`, `importAllJson`) |
| `src/App.tsx` | Root state container & top-level router | Lines 37 (`habitsData`), 65–67 (`useEffect` autosave), 154–213 (Library books state handlers), 237–250 (Overview router), 251–261 (Library router), 284–290 (HabitsEngine router) |
| `src/components/habits/HabitsEngine.tsx` | Habits execution view container | Lines 1–51: Renders `SleepCard`, `DetoxCard`, `DeepReadingCard`, `KeystonesCard` |
| `src/components/habits/SleepCard.tsx` | Circadian Sleep execution card | Lines 1–84: Bedtime/wakeup raw time inputs, sunlight toggle, duration badge |
| `src/components/habits/DetoxCard.tsx` | Digital detox & dopamine card | Lines 1–93: Toggles for morningPhoneFree, zeroReels, noPhoneInBed, streak badge |
| `src/components/habits/KeystonesCard.tsx` | Keystone discipline environment card | Lines 1–77: Toggles for bedMade, roomReset |
| `src/components/habits/DeepReadingCard.tsx` | Deep reading & sprint timer card | Lines 1–121: 20-minute sprint timer, active book progress, shelf navigation |
| `src/components/library/LibraryView.tsx` | Bookshelf catalog modal / view | Lines 1–190: Catalog, books list, shelf scorecards |
| `src/components/overview/OverviewView.tsx` | Telemetry & Day Ledger hub | Lines 53–54 (`telemetryDomain === 'habits'`), 214–235 (`handleSaveHabits`), 783–822 (Habits domain telemetry), 876–890 (`EditHabitsModal`) |
| `src/components/overview/SleepTelemetryChart.tsx` | Circadian interval chart | Lines 1–472: 24h timeline SVG visualization of sleep windows across 7D/14D/30D/90D |
| `src/components/overview/DayBalanceRibbon.tsx` | 24-Hour Circadian Day Balance ribbon | Lines 18–31: Consumes `habits.dailyRecords?.[selectedDate]?.sleepDurationHours` or parses `habits.sleep.sleepDuration` |
| `src/components/overview/DayLedgerFeed.tsx` | Historical Day Ledger feed | Lines 109–114 (Habits receipt data extraction), 475–524 (Section 3 "Discipline (Habits)" receipt cards) |
| `src/components/overview/MissedLogModals.tsx` | Modal dialogs for past date logging | Lines 594–756 (`EditHabitsModal` with sleepDuration, pagesRead, cleanDay) |
| `src/components/overview/ConsistencyHeatmap.tsx` | 30-Day activity matrix | Lines 68–80: Reads `habits.dailyRecords?.[dateStr]` to compute habit activity level |
| `src/components/focus/HourlyIntensityHeatmap.tsx` | Focus intensity timeline | Lines 47–49: Reads `habits.dailyRecords[selectedDate].wakeupRaw` |
| `src/components/focus/DayActivityTimeline.tsx` | Focus chronological timeline | Lines 46–49: Reads `habits.dailyRecords[selectedDate].bedtimeRaw` and `wakeupRaw` |
| `src/hooks/useHaptics.ts` | Mobile haptic tactile feedback | Lines 1–10: `triggerHaptic(durationMs)` |
| `src/index.css` | Styling system and industrial UI | Lines 1–168: Dark matte variables, `.matte-card`, `.spring-btn`, `.stepper-btn`, `.tap-target`, `.eyebrow`, `.tabular-nums` |
| `scripts/verify_focus_integrity.mjs` | Existing focus domain test suite | Lines 1–1076: 471 programmatic assertions covering classification, scaling, matrix, ribbon |

### 1.3 Detailed Inspection of Current Data Structures & Persistence

#### `HabitsData` Interface (`src/types/index.ts:152–204`)
```typescript
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

#### Storage Service Behavior (`src/services/storage.ts:146–162`)
- Stored under key `STORAGE_KEYS.HABITS = 'pulsesync_habits_v4'`.
- Default state (`DEFAULT_HABITS`) has `dailyRecords: {}`.
- `getHabitsData()` uses shallow spread: `{ ...DEFAULT_HABITS, ...JSON.parse(data) }`.
- Notice: If `dailyRecords` is loaded from localStorage, nested properties rely on whatever was previously saved.
- When `HabitsEngine` updates today's habits (`handleUpdateSleep`, `handleUpdateDetox`, `handleUpdateReading`, `handleUpdateKeystones`), it calls `onUpdateHabitsData({ ...habitsData, [key] })` (`HabitsEngine.tsx:19–33`). **It does NOT synchronize with or write to `dailyRecords[getTodayDateStr()]`!**
- Conversely, when `EditHabitsModal` saves for a past or current date (`OverviewView.tsx:214–235`), it writes into `dailyRecords[dateStr]`, but does NOT update top-level `habitsData.sleep`, `habitsData.reading`, etc., even if `dateStr === todayDateStr`.

### 1.4 Overview Telemetry Habits Domain Inspection (`OverviewView.tsx:783–822`)
Under `telemetryDomain === 'habits'`:
```tsx
{telemetryDomain === 'habits' && (
  <div className="space-y-4 animate-fadeIn">
    {/* Habits Scorecards */}
    <div className="grid grid-cols-3 gap-2.5">
      <div className="matte-card p-3 space-y-1">
        <span className="eyebrow text-[9px] text-emerald-400 block">Sleep Target</span>
        <p className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
          {habits.sleep.sleepDuration}
        </p>
        <p className="text-[10px] text-slate-400">calibrated baseline</p>
      </div>
      <div className="matte-card p-3 space-y-1">
        <span className="eyebrow text-[9px] text-sky-400 block">Clean Day Streak</span>
        <p className="text-xl font-bold font-mono text-sky-300 tabular-nums">
          {habits.detox.cleanDays}d
        </p>
        <p className="text-[10px] text-slate-400">continuous discipline</p>
      </div>
      <div className="matte-card p-3 space-y-1">
        <span className="eyebrow text-[9px] text-amber-400 block">Pages Read</span>
        <p className="text-xl font-bold font-mono text-amber-300 tabular-nums">
          {habits.reading.pagesReadToday}p
        </p>
        <p className="text-[10px] text-slate-400">across {habits.reading.books.length} active books</p>
      </div>
    </div>

    {/* Horizontally Scrollable Circadian Sleep Interval Chart */}
    <SleepTelemetryChart
      habits={habits}
      timeframe={timeframe}
      selectedDate={selectedDate}
      onSelectDate={(date) => {
        onSelectDate(date);
        setSubView('ledger');
      }}
    />
  </div>
)}
```
Observations on Telemetry:
1. Only **3 scorecards** exist.
2. All 3 scorecards display static, unscaled values (`habits.sleep.sleepDuration`, `habits.detox.cleanDays`, `habits.reading.pagesReadToday`). The `timeframe` (7, 14, 30, 90) selected in the top bar is completely ignored by the scorecards.
3. There is **no** Habit Consistency Matrix (compare with `FocusConsistencyMatrix.tsx:1-240`).
4. There is **no** Habits Adherence Ledger (compare with `FocusAdherenceLedger.tsx:1-270` and `MoveAdherenceLedger.tsx:1-262`).

### 1.5 Day Ledger & 24h Day Balance Ribbon Inspection
- **Day Ledger Feed** (`DayLedgerFeed.tsx:475–524`):
  Section 3 "Discipline (Habits)" renders a 3-column grid displaying:
  - Sleep: `{sleepDisplay || '8h 00m'}`
  - Clean Day: `{cleanDayStatus ? '✓ Calibrated' : 'Missed'}`
  - Reading: `{pagesReadDisplay ?? 20} pages`
  Missing: Hydration volume, bedtime and wake timestamps, sunlight anchor status.
- **EditHabitsModal** (`MissedLogModals.tsx:594–756`):
  Only contains inputs for:
  - `sleepDuration` text (`"8h 00m"`)
  - `pagesRead` number
  - `cleanDay` single checkbox
  Missing: Bedtime (`bedtimeRaw`), Wake-up (`wakeupRaw`), sunlight anchor (`sunlightDone`), hydration volume / stepper, keystone discipline breakdown.
- **DayBalanceRibbon** (`DayBalanceRibbon.tsx:18–31`):
  Correctly calculates `sleepHours` by checking `habitRecord?.sleepDurationHours` first, falling back to regex match on `habits.sleep?.sleepDuration`. This is already wired, but needs `sleepDurationHours` properly populated in `dailyRecords[selectedDate]`.

### 1.6 Styling & Cockpit Standards
- Primary background: `#080a0f`, surface cards: `#101520`, border: `rgba(255, 255, 255, 0.07)` (`index.css:2-16`).
- Physical tap target sizing: `.tap-target` and `.spring-btn` enforce `min-height: 44px` and `min-width: 44px` (`index.css:71-84`).
- Monospace numerals: `.tabular-nums` applied for zero layout shift on live counters.
- Haptics: `triggerHaptic(ms)` called with 10ms–15ms on button taps and 40ms on timer completion.
- Cartoon emojis: Zero cartoon emojis in existing Focus or Move code; Lucide SVG icons are strictly used across the cockpit (`index.css`, `BottomNav.tsx`, `FocusConsistencyMatrix.tsx`).

---

## 2. LOGIC CHAIN

### Step 1: Mapping R1 & R2 (Behavioral Science & 4 Core Pillars) to Current Code
- **Hydration / Fluid Dynamics (R2.1)**:
  - Requirement: Target-anchored fluid volume (default 3.5L = 3500ml), rapid quick-adds (+250ml, +500ml), custom steppers (e.g., ±100ml / ±250ml), and an SVG progress ring/gauge with zero cartoon emojis.
  - Current State: Completely non-existent in `HabitsData`, `HabitsEngine`, `dailyRecords`, or `storage.ts`.
  - Inferred Need: Create a dedicated `HydrationCard.tsx` in `src/components/habits/`, add `hydration: HydrationState` to `HabitsData`, add `hydrationMl` and `hydrationTargetMl` to `dailyRecords[dateStr]`, and persist via `StorageService`.

- **Circadian Sleep & Recovery (R2.2)**:
  - Requirement: Sleep duration, calibrated baseline target (7.5h–8.5h, default 8.0h), bedtime/wakeup timestamps, morning sunlight anchor (10m direct sunlight within 30m of waking), sleep debt calculation against baseline, feeding into Day Balance ribbon.
  - Current State: `SleepCard.tsx` has raw time inputs and sunlight toggle, but does **not** compute duration or debt from bedtime/wakeup. Duration is a static string `"8h 00m"`.
  - Inferred Need: Upgrade `SleepCard.tsx` with a reactive calculation:
    $$\text{durationHours} = \frac{(\text{wakeupTimestamp} - \text{bedtimeTimestamp}) \pmod{24\text{ hours}}}{1\text{ hour}}$$
    $$\text{sleepDebtHours} = \max(0, \text{baselineTargetHours} - \text{durationHours})$$
    Store `sleepDurationHours`, `sleepDebtHours`, `bedtimeRaw`, `wakeupRaw`, and `sunlightDone` in both `habitsData.sleep` and `habitsData.dailyRecords[todayStr]`.

- **Deep Reading & Knowledge (R2.3)**:
  - Requirement: Integrated bookshelf catalog, pages read today, session duration timer, direct shelf navigation.
  - Current State: `DeepReadingCard.tsx` has 20m timer and shelf navigation, but **lacks** direct inputs or steppers to log `pagesReadToday` right on the card (requires navigating away to Library).
  - Inferred Need: Add a 1-tap/stepper page logger on `DeepReadingCard.tsx` that increments `pagesReadToday` and synchronizes with `dailyRecords[todayStr].pagesRead`.

- **Keystone Discipline & Clean Day Matrix (R2.4)**:
  - Requirement: Four binary adherence markers:
    1. Clean Diet
    2. Zero Doomscrolling / Reels
    3. Daily Supplements
    4. Bed Made / Room Reset
    Computing an **immutable daily Clean Day status** (Clean Day = all 4 markers satisfied, or calibrated threshold).
  - Current State: Split between `DetoxCard.tsx` (morningPhoneFree, zeroReels, noPhoneInBed) with hardcoded `cleanDays: 4` and `KeystonesCard.tsx` (bedMade, roomReset). Clean Day status is not dynamically computed or persisted.
  - Inferred Need: Consolidate or align keystone discipline so that the 4 binary markers are explicitly represented:
    $$\text{cleanDay} = \text{cleanDiet} \land \text{zeroDoomscroll} \land \text{supplements} \land \text{environmentReset}$$
    Compute active clean days streak by traversing consecutive days in `dailyRecords` where `cleanDay === true`.

### Step 2: Mapping R3 (Overview Telemetry & Horizon Scaling) to Architecture
- **Target-Anchored Scorecards Quad (R3.1)**:
  - In `OverviewView.tsx:787–809`, replace the 3 static cards with 4 dynamic target-anchored scorecards:
    1. **Sleep Target & Debt**: Baseline target hours ($8.0 \times \text{timeframe}$), actual accumulated sleep hours, net sleep debt.
    2. **Clean Day Consistency Rate**: $\frac{\text{Clean Days in Horizon}}{\text{timeframe}} \times 100\%$.
    3. **Hydration Adherence**: Total fluid volume vs target volume ($3.5\text{L} \times \text{timeframe}$), adherence rate %.
    4. **Deep Reading**: Total pages read vs target pages ($20\text{p} \times \text{timeframe}$), pacing metric.
  - All 4 cards scale dynamically across 7D, 14D, 30D, 90D timeframes using `horizonMultiplier = timeframe / 7`.

- **Habit Consistency Matrix (R3.2)**:
  - Requirement: Multi-pillar 7-day adherence grid using dark matte Lucide SVG icons (no cartoon emojis) with aggregate consistency percentage score.
  - Architecture: Follow the pattern of `FocusConsistencyMatrix.tsx` (which generates 7 calendar days `daysAgo = 6..0`, defines pillar rows with Lucide icons, evaluates each day as `'met' | 'partial' | 'none'`, and calculates aggregate consistency percentage score).
  - Four Pillars:
    1. **Hydration**: Met ($\ge 3500\text{ml}$), Partial ($\ge 2000\text{ml}$), None ($< 2000\text{ml}$).
    2. **Circadian Sleep**: Met ($\ge 7.5\text{h}$ + Sunlight), Partial ($\ge 6.5\text{h}$ or Sunlight), None ($< 6.5\text{h}$).
    3. **Deep Reading**: Met ($\ge 20\text{ pages}$ or $\ge 20\text{m}$ sprint), Partial ($> 0$), None ($0$).
    4. **Clean Day / Keystones**: Met (all 4 markers satisfied), Partial ($\ge 2$ markers), None ($< 2$).

- **Habits Adherence Ledger (R3.3)**:
  - Requirement: High-signal baseline vs actual breakdown for all active habit pillars without redundant descriptive filler.
  - Architecture: Follow `FocusAdherenceLedger.tsx` and `MoveAdherenceLedger.tsx`. Displays pillar name, category, unit, baseline target (scaled by `horizonMultiplier`), actual logged in timeframe, adherence percentage ($\min(150\%, \text{actual}/\text{target} \times 100)$), delta, and status badge (`Met` / `Deficit` / `Stretch`).

### Step 3: Mapping R4 (Day Ledger Integration & 24h Ribbon Synchronization)
- **Day Ledger Feed Receipt** (`DayLedgerFeed.tsx:475–524`):
  Enrich Section 3 "Discipline (Habits)" receipt with:
  - Sleep duration and exact bedtime/wake timestamps (e.g. `23:15 → 07:15 (8.0h)`).
  - Sunlight anchor status (`✓ Sunlight 10m` or `Pending`).
  - Hydration volume with progress (e.g. `3,500 ml / 3.5L (100%)`).
  - Clean Day status with binary keystone breakdown pill.
  - Deep reading pages read and minutes.
- **EditHabitsModal** (`MissedLogModals.tsx:594–756`):
  Expand modal fields to support:
  - Bedtime input (`<input type="time">`), wake-up input, sunlight anchor toggle.
  - Hydration volume stepper (`-250ml`, `+250ml`, `+500ml`) or number input with 3.5L target reference.
  - 4 binary keystone checkboxes (Clean Diet, Zero Doomscroll, Daily Supplements, Bed Made / Room Reset) dynamically calculating Clean Day status.
  - Pages read number input.
- **Bidirectional State Synchronization**:
  - In `OverviewView.tsx:handleSaveHabits`: If `dateStr === getTodayDateStr()`, update **both** `habitsData.dailyRecords[dateStr]` and `habitsData.sleep`, `habitsData.hydration`, `habitsData.reading`, `habitsData.keystones`.
  - In `HabitsEngine.tsx`: When updating today's sleep, hydration, reading, or keystones, update `habitsData.dailyRecords[todayDateStr]` in the same dispatch so historical Day Ledger and ribbon immediately reflect live changes.
- **24-Hour Day Balance Ribbon** (`DayBalanceRibbon.tsx:18–31`):
  Already reads `habitRecord?.sleepDurationHours`. When `sleepDurationHours` is correctly computed and saved for `selectedDate`, the ribbon automatically and accurately allocates sleep hours.

### Step 4: Mapping Verification & Quality Gate
- Acceptance Criteria specifies `scripts/verify_habits_integrity.mjs`.
- Pattern: Model directly after `scripts/verify_focus_integrity.mjs`:
  - Uses `--experimental-strip-types` for direct TypeScript imports.
  - Custom assertion suite (`assert`, `assertEquals`, `assertDeepEquals`, `suite`).
  - Tests 100% of habit math, horizon scaling (7D/14D/30D/90D), storage contracts, ribbon normalization, matrix score calculations, and icon bindings.

---

## 3. CAVEATS

1. **Read-Only Exploration**:
   This survey strictly avoided modifying any source files or running mutations. No code was altered.
2. **Existing LocalStorage State**:
   Users or existing test runs may have a `pulsesync_habits_v4` localStorage key that lacks `hydration` or uses the older `detox` schema. Storage deserialization in `StorageService.getHabitsData()` must provide safe defaults and deep fallbacks so old keys do not cause runtime undefined errors.
3. **Dual Port Status (3000 vs 3002)**:
   Vite's default config specifies port 3000, but port 3002 is active and specified as the target URL in `ORIGINAL_REQUEST.md`. Any visual verification with DevTools should test against `http://localhost:3002/`.
4. **Detox vs Keystone Terminology**:
   `ORIGINAL_REQUEST.md:21` specifies four keystone markers (Clean Diet, Zero Doomscrolling / Reels, Daily Supplements, Bed Made / Room Reset) computing Clean Day status. The existing codebase has `detox` (`morningPhoneFree`, `zeroReels`, `noPhoneInBed`) and `keystones` (`bedMade`, `roomReset`). Unifying these into a clean Keystones/Clean Day contract simplifies both the UI and the state model.

---

## 4. CONCLUSION & ACTIONABLE IMPLEMENTATION PLAN

### Key Findings Summary
1. **Pillar Completeness**: Hydration is completely missing; Sleep lacks automatic duration/debt math; Keystones are fragmented; Reading lacks quick page logging.
2. **Telemetry Gaps**: Overview Telemetry has only 3 static, unscaled habit scorecards. Habit Consistency Matrix and Habits Adherence Ledger are missing.
3. **Day Ledger Gaps**: Receipt card is minimal; `EditHabitsModal` lacks timestamps, hydration, sunlight, and keystone markers; state is not bidirectionally synchronized for today's date.
4. **Verification Gap**: `scripts/verify_habits_integrity.mjs` is not yet implemented.

### Recommended Implementation Roadmap for the Team

```
Phase 1: Domain Models, Types & Storage Contracts
├── src/types/index.ts
│   ├── Add HydrationState (currentMl, targetMl, quickAddHistory)
│   ├── Update SleepRecord (baselineTargetHours, sleepDebtHours, calculated sleepDurationHours)
│   ├── Define KeystoneMarkers (cleanDiet, zeroDoomscroll, supplements, environmentReset)
│   └── Update HabitsDailyRecord with hydrationMl, keystones, sleep timestamps, debt
└── src/services/storage.ts
    ├── Add DEFAULT_HYDRATION (3500ml target, 0 current)
    ├── Update DEFAULT_HABITS with hydration and 4-marker keystones
    └── Ensure robust migration/merging for existing localStorage

Phase 2: Core Habits Engine Execution Cards (Today's Cockpit)
├── src/components/habits/HydrationCard.tsx (NEW)
│   ├── SVG Progress Ring (matte cyan/sky, zero emojis)
│   ├── 1-tap quick adds (+250ml, +500ml)
│   └── Tactile steppers (±100ml / ±250ml) with 44px min tap targets
├── src/components/habits/SleepCard.tsx (UPGRADE)
│   ├── Reactive bedtime/wakeup duration math across midnight
│   ├── Calibrated baseline target (8.0h) and Sleep Debt display
│   └── Sunlight anchor toggle with haptic feedback
├── src/components/habits/DeepReadingCard.tsx (UPGRADE)
│   ├── 1-tap / stepper pages read logger
│   └── Instant sync to dailyRecords[today]
├── src/components/habits/KeystonesCard.tsx (UPGRADE)
│   ├── 4 binary markers (Clean Diet, Zero Doomscroll, Supplements, Bed Made / Room Reset)
│   └── Reactive Clean Day status badge and streak counter
└── src/components/habits/HabitsEngine.tsx (UPGRADE)
    ├── Integrate HydrationCard
    └── Bidirectional sync to dailyRecords[todayDateStr]

Phase 3: Overview Telemetry & Dynamic Horizon Scaling
├── src/components/overview/HabitConsistencyMatrix.tsx (NEW)
│   ├── 7-day adherence grid across 4 habit pillars
│   ├── Dark matte Lucide SVG icons (Droplets, Moon, Sun, BookOpen, ShieldCheck)
│   └── Aggregate consistency percentage score
├── src/components/overview/HabitsAdherenceLedger.tsx (NEW)
│   ├── High-signal baseline vs actual breakdown for all 4 pillars
│   ├── Dynamic horizon scaling (7D, 14D, 30D, 90D) via horizonMultiplier
│   └── Zero redundant filler, pure cockpit tables
└── src/components/overview/OverviewView.tsx (UPGRADE)
    ├── Target-Anchored Scorecards Quad (Sleep Target/Debt, Clean Day Rate, Hydration Adherence, Pages Read)
    ├── Dynamic scaling of all 4 scorecards across 7D/14D/30D/90D
    └── Embed HabitConsistencyMatrix & HabitsAdherenceLedger

Phase 4: Day Ledger Integration & 24h Ribbon Synchronization
├── src/components/overview/DayLedgerFeed.tsx (UPGRADE)
│   └── Enriched Section 3 receipts (Sleep timestamps + duration, Hydration volume, Clean Day calibration, Pages read)
├── src/components/overview/MissedLogModals.tsx (UPGRADE EditHabitsModal)
│   ├── Sleep timestamps & sunlight anchor
│   ├── Hydration volume stepper/input
│   ├── 4 keystone discipline markers
│   └── Pages read input
├── src/components/overview/DayBalanceRibbon.tsx
│   └── Verify accurate consumption of sleep duration hours
└── src/components/overview/OverviewView.tsx
    └── Bidirectional synchronization when saving today's habits via modal

Phase 5: Programmatic Verification & Quality Gate
└── scripts/verify_habits_integrity.mjs (NEW)
    ├── 100% habit calculation coverage (sleep duration, sleep debt, hydration, clean day)
    ├── Horizon scaling math across 7D, 14D, 30D, 90D
    ├── Storage serialization and migration contracts
    ├── Day Ledger ribbon feeds and 100% circadian partition
    ├── Habit Consistency Matrix evaluation logic
    └── Lucide icon audit & zero cartoon emoji assertion
```

---

## 5. INDEPENDENT VERIFICATION METHOD

To independently verify the observations in this report:

1. **Verify Ports and Process Listeners**:
   ```bash
   lsof -nP -i :3000 -i :3002
   ```
   *Expected*: Node processes listening on port 3000 and port 3002.

2. **Verify Type Definitions and Missing Hydration**:
   Inspect `src/types/index.ts:150-205` using `view_file`.
   *Observation*: `HabitsData` has `sleep`, `detox`, `reading`, `keystones`, `dailyRecords`, but no `hydration`.

3. **Verify Existing Verification Suite**:
   ```bash
   node scripts/verify_focus_integrity.mjs
   ```
   *Expected*: 471/471 assertions pass. Confirms `--experimental-strip-types` test pattern.

4. **Verify Telemetry Domain Scorecards**:
   Inspect `src/components/overview/OverviewView.tsx:783-822`.
   *Observation*: Only 3 scorecards rendered with static unscaled values; no matrix or adherence ledger.

5. **Verify Day Ledger Modal and Receipt Fields**:
   Inspect `src/components/overview/MissedLogModals.tsx:594-607` and `src/components/overview/DayLedgerFeed.tsx:475-524`.
   *Observation*: `EditHabitsModal` lacks timestamps, hydration, sunlight, and keystone breakdown.
