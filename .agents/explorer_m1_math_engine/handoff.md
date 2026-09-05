# Behavioral Mathematics Engine Design Handoff Report: `src/utils/habitsMath.ts`

- **Author**: M1 Habits Math Engine Designer (`explorer_m1_math_engine`)
- **Target Module**: `src/utils/habitsMath.ts`
- **Reference Implementation**: `.agents/explorer_m1_math_engine/proposed_habitsMath.ts`
- **Status**: Complete & Authoritative
- **Timestamp**: 2026-09-05T13:40:00Z
- **Reference Documents**: `ORIGINAL_REQUEST.md` (R1–R5), `PROJECT.md`, `.agents/spec_miner_survey/handoff.md`, `scripts/verify_habits_integrity.mjs`

---

## 1. Observation

Direct code inspection of the `pulsesync-os` repository and existing overview components revealed the mathematical state, missing utilities, and concrete integration requirements across the codebase:

### 1.1 Complete Absence of Habits Math Utilities
- **`src/utils/` Directory (`list_dir` / `find_by_name`)**:
  Only two utilities existed: `src/utils/audio.ts` and `src/utils/domainClassifier.ts`.
  `src/utils/habitsMath.ts` did **not exist**. There was no centralized, testable, or pure mathematical module for habits.

### 1.2 Fragmented & Manual Sleep Calculations in UI Components
- **`src/components/habits/SleepCard.tsx` (Lines 17–24, 32–35)**:
  ```typescript
  17:   const handleBedtimeChange = (bedtime: string) => {
  18:     onUpdateSleep({ ...sleep, bedtimeRaw: bedtime });
  19:   };
  ...
  32:   <span className="badge-pill ...">{sleep.sleepDuration} Logged</span>
  ```
  `SleepCard` stored raw strings (`bedtimeRaw`, `wakeupRaw`), but did not calculate `sleepDuration` or `sleepDurationHours` reactively. Users had to rely on pre-populated or manual strings.
- **`src/components/overview/DayBalanceRibbon.tsx` (Lines 18–30)**:
  ```typescript
  19:   let sleepHours = 8.0;
  20:   const habitRecord = habits.dailyRecords?.[selectedDate];
  21:   if (habitRecord?.sleepDurationHours) {
  22:     sleepHours = habitRecord.sleepDurationHours;
  23:   } else if (habits.sleep?.sleepDuration) {
  24:     const match = habits.sleep.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
  25:     if (match) {
  26:       const h = parseInt(match[1], 10) || 0;
  27:       const m = parseInt(match[2], 10) || 0;
  28:       sleepHours = h + m / 60;
  29:     }
  30:   }
  ```
  `DayBalanceRibbon` duplicated regex parsing of `"Xh Ym"` strings to extract numeric sleep hours.
- **`src/components/overview/SleepTelemetryChart.tsx` (Lines 48–52, 78–100)**:
  Duplicate manual time parsing `parseHourDecimal(timeStr)` and embedded circadian classification (`optimal`, `delayed`, `shifted`, `short`) with local threshold constants instead of centralized shared domain models.

### 1.3 Static Telemetry Without Dynamic Horizon Scaling
- **`src/components/overview/OverviewView.tsx` (Lines 787–809)**:
  ```typescript
  787:   {/* Habits Scorecards */}
  788:   <div className="grid grid-cols-3 gap-2.5">
  789:     <div className="matte-card p-3 space-y-1">
  790:       <span className="eyebrow text-[9px] text-emerald-400 block">Sleep Target</span>
  791:       <p className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
  792:         {habits.sleep.sleepDuration}
  793:       </p>
  794:       <p className="text-[10px] text-slate-400">calibrated baseline</p>
  795:     </div>
  796:     <div className="matte-card p-3 space-y-1">
  797:       <span className="eyebrow text-[9px] text-sky-400 block">Clean Day Streak</span>
  798:       <p className="text-xl font-bold font-mono text-sky-300 tabular-nums">
  799:         {habits.detox.cleanDays}d
  800:       </p>
  ...
  803:       <span className="eyebrow text-[9px] text-amber-400 block">Pages Read</span>
  804:       <p className="text-xl font-bold font-mono text-amber-300 tabular-nums">
  805:         {habits.reading.pagesReadToday}p
  ...
  ```
  The Habits telemetry tab rendered 3 static cards displaying today's values regardless of whether the user selected `7D`, `14D`, `30D`, or `90D`. Target scaling did not exist, Hydration was completely omitted, and sleep debt was absent.

### 1.4 Architectural Precedents in Focus & Move Domains
- **`src/components/overview/FocusConsistencyMatrix.tsx` (Lines 44–136)**:
  Implements a 7-day multi-pillar matrix across 5 pillars, calculating cell status (`met` = 1.0 pt, `partial` = 0.5 pt, `none` = 0.0 pt) and computing `matrixScorePct = Math.round((metScore / totalCells) * 100)`.
- **`src/components/overview/FocusAdherenceLedger.tsx` (Lines 11–20, 83–135)** & **`MoveAdherenceLedger.tsx` (Lines 18–57)**:
  Both adherence ledgers scale targets dynamically via `horizonMultiplier = timeframe / 7`, comparing actual output vs baseline and stretch weekly benchmarks, deriving `completionPct`, `isMet`, and `delta`.

### 1.5 Rigorous Verification Suite Oracle
- **`scripts/verify_habits_integrity.mjs` (Lines 113–530)**:
  Specifies 276 comprehensive assertions across 4 tiers testing feature coverage, boundary conditions, combinations, and 90-day workload simulations. Running `node --experimental-strip-types scripts/verify_habits_integrity.mjs` exits with code 0 (276/276 passed), defining the exact oracle expectations for all 8 behavioral math algorithms.

---

## 2. Logic Chain

From these direct observations, the complete behavioral math specifications and architectural formulas were derived:

### 2.1 Sleep Duration Cross-Midnight Math
- **Observation Reference**: §1.2 (`SleepCard.tsx`, `DayBalanceRibbon.tsx`, `SleepTelemetryChart.tsx`), `verify_habits_integrity.mjs` lines 125–151.
- **Deduction**:
  In 24-hour time notation, sleep starting at $H_b : M_b$ and ending at $H_w : M_w$ often crosses the 00:00 midnight threshold.
  1. Convert timestamps to total minutes from midnight:
     $$T_b = H_b \times 60 + M_b, \quad T_w = H_w \times 60 + M_w, \quad T \in [0, 1439]$$
  2. If $T_w \ge T_b$ (same-day AM/PM sleep, e.g. bedtime `01:30`, wake `09:00`):
     $$\text{durationMinutes} = T_w - T_b = 540 - 90 = 450\text{ mins} = 7.5\text{h}$$
  3. If $T_w < T_b$ (crosses midnight, e.g. bedtime `23:15`, wake `07:15`):
     $$\text{durationMinutes} = (1440 - T_b) + T_w = (1440 - 1395) + 435 = 45 + 435 = 480\text{ mins} = 8.0\text{h}$$
  4. If $T_b == T_w$: 0 minutes (guard against interpreting identical timestamps as 24-hour sleep).
  5. Formatting & Precision:
     $$\text{durationHours} = \text{round}\left(\frac{\text{durationMinutes}}{60} \times 100\right) / 100$$
     $$\text{durationFormatted} = \lfloor \text{durationMinutes} / 60 \rfloor + \text{'h '} + \text{String}(\text{durationMinutes} \pmod{60}).\text{padStart}(2, \text{'0'}) + \text{'m'}$$
  6. Optimal Window: Matthew Walker's 5 ultradian cycles (~90m each) define optimal sleep duration between $7.5\text{h}$ and $8.5\text{h}$ inclusive (`durationHours >= 7.5 && durationHours <= 8.5`).
  7. Circadian Phase Classification:
     - `short`: $\text{durationHours} < 6.5\text{h}$
     - `optimal`: Bedtime $21:30 \le T_b \le 00:30$ ($21.5 \le H_{\text{dec}} \le 24.0 \lor H_{\text{dec}} \le 0.5$) AND $\text{durationHours} \ge 7.5\text{h}$
     - `delayed`: Bedtime $00:30 < T_b \le 02:30$ ($0.5 < H_{\text{dec}} \le 2.5$)
     - `shifted`: Bedtime $02:30 < T_b \le 12:00$ ($2.5 < H_{\text{dec}} \le 12.0$)
     - `variable`: All other schedules

### 2.2 Sleep Debt Accumulation Formula Against 8.0h Baseline
- **Observation Reference**: §1.2 (`DayBalanceRibbon.tsx`), `verify_habits_integrity.mjs` lines 174–190.
- **Deduction**:
  1. Calibrated baseline: $8.0\text{ hours/day}$.
  2. Single day sleep deficit:
     $$\text{Debt}_{\text{day}} = \max(0, 8.0 - \text{sleepDurationHours})$$
     $$\Delta_{\text{day}} = \text{sleepDurationHours} - 8.0$$
  3. Acute Sleep Debt across $N$ evaluated horizon records (Walker Deficit Accumulator):
     $$\text{Accumulated Debt} = \sum_{i=1}^{N} \max(0, 8.0 - \text{sleepDurationHours}_i)$$
     $$\text{Net Balance} = \sum_{i=1}^{N} (\text{sleepDurationHours}_i - 8.0)$$
  4. Missing/unlogged days in an active horizon count as $0\text{h}$ sleep, accumulating the full $8.0\text{h}$ acute deficit per unlogged day.

### 2.3 Clean Day Reactive Calculation
- **Observation Reference**: §1.3 (`OverviewView.tsx`), `verify_habits_integrity.mjs` lines 224–232.
- **Deduction**:
  A day is immutable Clean (`cleanDay = true`) if and only if **all 4 keystone discipline markers** are satisfied:
  $$\text{cleanDay} = \text{cleanDiet} \land \text{zeroDoomscroll} \land \text{dailySupplements} \land \text{bedMade}$$
  - `cleanDiet`: Whole foods nutrition, zero refined/processed sugar.
  - `zeroDoomscroll`: Zero algorithmic short-form dopamine scrolling (Reels, TikTok, Shorts).
  - `dailySupplements`: Daily micronutrient & electrolyte stack (D3, Omega-3, Magnesium, Creatine).
  - `bedMade`: Immediate post-waking environmental reset.
  If any of the 4 markers is false, null, or undefined, `cleanDay` evaluates strictly to `false`.

### 2.4 Unbroken Clean Day Streak Counter & 5-Tier Classification
- **Observation Reference**: `verify_habits_integrity.mjs` lines 234–267.
- **Deduction**:
  1. Starting from `referenceDateStr` (`YYYY-MM-DD`), step backward day-by-day:
     Check if `dailyRecords[date]?.cleanDay === true` (or `evaluateCleanDay(dailyRecords[date])`).
     If clean: increment `streak` by 1 and step to `date - 1 day`.
     If not clean: terminate loop immediately.
  2. Timezone Safety: Date decrementing must use `new Date(y, m - 1, d)` and extract `getFullYear()`, `getMonth() + 1`, `getDate()`, avoiding `toISOString()` which causes day-boundary shifts in non-UTC time zones.
  3. 5-Tier Neuroplastic Classification:
     | Tier | Streak Window | Neurological Rationale | Badge Styling |
     |---|---|---|---|
     | **Calibrated** | 0–6 days | Baseline calibration & cue establishment | `bg-slate-800/80 text-slate-300 border-slate-700` |
     | **Disciplined** | 7–13 days | 1-week dopamine receptor stabilization | `bg-sky-500/15 text-sky-300 border-sky-500/30` |
     | **Fortified** | 14–29 days | 2-week neuroplastic consolidation | `bg-purple-500/15 text-purple-300 border-purple-500/30` |
     | **Unbreakable** | 30–89 days | 30-day automatic habit execution | `bg-emerald-500/15 text-emerald-300 border-emerald-500/30` |
     | **Sovereign** | 90+ days | Quarter-year circadian mastery | `bg-amber-500/15 text-amber-300 border-amber-500/30` |

### 2.5 Hydration Fluid Dynamics & SVG Circular Progress Ring Geometry
- **Observation Reference**: §1.1 (missing hydration), `verify_habits_integrity.mjs` lines 194–219, 665–681.
- **Deduction**:
  1. Default baseline target: $3,500\text{ ml}$ ($3.5\text{L}$).
  2. Metric derivations:
     $$\text{adherenceRatio} = \frac{\text{currentMl}}{\text{targetMl}} \quad (\text{rounded to 3 decimals})$$
     $$\text{progressPercent} = \min\left(100, \text{round}\left(\frac{\text{currentMl}}{\text{targetMl}} \times 100\right)\right)$$
     $$\text{remainingMl} = \max(0, \text{targetMl} - \text{currentMl})$$
     $$\text{volumeLiters} = \left(\frac{\text{currentMl}}{1000}\right).\text{toFixed}(2) + \text{'L'}$$
     $$\text{targetLiters} = \left(\frac{\text{targetMl}}{1000}\right).\text{toFixed}(1) + \text{'L'}$$
  3. SVG Circular Progress Ring Geometry:
     - Radius: $r = 50\text{px}$
     - Circumference:
       $$C = 2 \times \pi \times r = 2 \times \pi \times 50 = 100\pi \approx 314.159265\text{px}$$
     - Clamped progress ratio:
       $$\text{clampedRatio} = \min\left(1, \max\left(0, \frac{\text{currentMl}}{\text{targetMl}}\right)\right)$$
     - Stroke-dashoffset:
       $$\text{strokeDashoffset} = C \times (1 - \text{clampedRatio})$$
       - At $0\text{ml}$: offset $= 314.159$ (empty circle).
       - At $1,750\text{ml}$ (50%): offset $= 157.080$ (half circle).
       - At $3,500\text{ml}$ (100%): offset $= 0.0$ (full circle).
       - At $>3,500\text{ml}$ (e.g. 129%): offset remains clamped at $0.0$ to prevent negative spin artifacts.

### 2.6 Dynamic Horizon Scaling Math (4 Scorecards Across 7D, 14D, 30D, 90D)
- **Observation Reference**: §1.3 (`OverviewView.tsx`), `PROJECT.md` line 160, `verify_habits_integrity.mjs` lines 284–343.
- **Deduction**:
  Given timeframe $T \in \{7, 14, 30, 90\}$ days and reference date $D$:
  1. Retrieve array of dates $\{D - (T-1), \dots, D\}$.
  2. Linear target scaling:
     - **Sleep Target**: $8.0 \times T\text{ hours}$ (7D: 56.0h, 14D: 112.0h, 30D: 240.0h, 90D: 720.0h)
     - **Clean Days Target**: $T\text{ days}$ (7D: 7d, 14D: 14d, 30D: 30d, 90D: 90d)
     - **Hydration Target**: $3.5 \times T\text{ Liters}$ (7D: 24.5L, 14D: 49.0L, 30D: 105.0L, 90D: 315.0L)
     - **Reading Target**: $20 \times T\text{ pages}$ (7D: 140p, 14D: 280p, 30D: 600p, 90D: 1800p)
  3. Actuals summation across the $T$ days:
     - $\text{actualSleep} = \sum \text{sleepDurationHours}_d$
     - $\text{accumulatedDebt} = \sum \max(0, 8.0 - \text{sleepDurationHours}_d)$
     - $\text{actualCleanDays} = \sum \mathbb{I}(\text{cleanDay}_d = \text{true})$
     - $\text{actualHydrationLiters} = \left(\sum \text{hydrationMl}_d\right) / 1000$
     - $\text{actualPages} = \sum \text{pagesRead}_d$
  4. Pacing percentages:
     $$\text{pct} = \min\left(150, \text{round}\left(\frac{\text{actual}}{\text{target}} \times 100\right)\right)$$
     (Clean days percentage is capped at 100%).

### 2.7 7-Day Habit Consistency Matrix Scoring Logic (5 Pillars x 7 Days = 35 Cells)
- **Observation Reference**: §1.4 (`FocusConsistencyMatrix.tsx`), `verify_habits_integrity.mjs` lines 348–430.
- **Deduction**:
  1. Matrix Dimensions: 5 core pillars $\times$ 7 calendar days ($D-6$ to $D$).
  2. Pillar Evaluation Rules for a single day record:
     - **Circadian Sleep**:
       - Met: $\text{sleepDurationHours} \ge 7.5\text{h}$
       - Partial: $6.0\text{h} \le \text{sleepDurationHours} < 7.5\text{h}$
       - None: $< 6.0\text{h}$ or unlogged
     - **Morning Sunlight**:
       - Met: `sunlightDone === true`
       - None: `false` or unlogged (binary anchor, no partial)
     - **Fluid Dynamics / Hydration**:
       - Met: $\text{hydrationMl} \ge 3,500\text{ml}$
       - Partial: $2,000\text{ml} \le \text{hydrationMl} < 3,500\text{ml}$
       - None: $< 2,000\text{ml}$ or unlogged
     - **Keystone Clean Day**:
       - Met: `cleanDay === true` (or 4/4 markers satisfied)
       - Partial: 3/4 markers satisfied
       - None: $\le 2/4$ markers satisfied
     - **Deep Reading**:
       - Met: $\text{pagesRead} \ge 20\text{ pages}$
       - Partial: $1 \le \text{pagesRead} < 20\text{ pages}$
       - None: $0\text{ pages}$ or unlogged
  3. Cell Scoring:
     - Met $= 1.0\text{ point}$
     - Partial $= 0.5\text{ points}$
     - None $= 0.0\text{ points}$
     - Maximum possible points $= 5 \times 7 = 35.0\text{ points}$
  4. Aggregate Matrix Percentage:
     $$\text{scorePct} = \text{round}\left(\frac{\text{totalPoints}}{35} \times 100\right)$$

### 2.8 Habits Adherence Ledger Baseline vs Stretch Targets
- **Observation Reference**: §1.4 (`FocusAdherenceLedger.tsx`, `MoveAdherenceLedger.tsx`), `verify_habits_integrity.mjs` lines 435–497.
- **Deduction**:
  1. Benchmark definitions (7-day baseline & stretch pace):
     - Sleep: Baseline 56.0h (8.0h/d), Stretch 59.5h (8.5h/d)
     - Sunlight: Baseline 6 sessions (6/7d), Stretch 7 sessions (7/7d)
     - Hydration: Baseline 24.5L (3.5L/d), Stretch 28.0L (4.0L/d)
     - Clean Days: Baseline 6 days (6/7d), Stretch 7 days (7/7d)
     - Reading: Baseline 140 pages (20p/d), Stretch 210 pages (30p/d)
  2. Horizon Scaling Multiplier: $M_T = \frac{T}{7}$.
  3. Scaled Target:
     - Hours and Liters: $\text{target} = +(M_T \times \text{weeklyTarget}).\text{toFixed}(1)$
     - Sessions, Days, Pages: $\text{target} = \max(1, \text{round}(M_T \times \text{weeklyTarget}))$
  4. Ledger Row Status:
     - $\text{completionPct} = \min(150, \text{round}((\text{completed} / \text{target}) \times 100))$
     - $\text{isMet} = \text{completed} \ge \text{target}$
     - $\text{delta} = \text{completed} - \text{target}$
     - $\text{adherenceRate} = \text{round}((\text{metCount} / 5) \times 100)\%$

---

## 3. Caveats

1. **Attribution of Cross-Midnight Sleep**:
   - Sleep starting late on Date $D-1$ (e.g. 23:15) and waking on Date $D$ (e.g. 07:15) is attributed in PulseSync OS to Date $D$ (the waking day whose physiological recovery bank is fueled by that sleep).
2. **Current Day Clean Streak Evaluation**:
   - On the current day (Today), habits are actively in progress. If today's 4 markers are not yet completed, the streak from yesterday remains valid and active until the day ends. The streak function provides an optional `currentDayCleanOverride` parameter so UI components can evaluate live toggle state reactively without mutating persistent historical storage.
3. **No External Charting Dependencies**:
   - All SVG ring calculations, horizon targets, and matrix evaluations are pure TypeScript functions requiring zero third-party math or charting libraries (no D3, no Chart.js, zero bundle overhead).

---

## 4. Conclusion & Complete TypeScript Specification

The design of `src/utils/habitsMath.ts` has been fully implemented, tested, and stored in `.agents/explorer_m1_math_engine/proposed_habitsMath.ts`. It provides 100% test pass fidelity against `scripts/verify_habits_integrity.mjs`.

### 4.1 Summary of Exported API in `src/utils/habitsMath.ts`

| Function / Constant | Category | Input | Output | Purpose |
|---|---|---|---|---|
| `DEFAULT_SLEEP_BASELINE_HOURS` | Constant | — | `8.0` | 5-cycle recovery baseline |
| `DEFAULT_HYDRATION_TARGET_ML` | Constant | — | `3500` | 3.5L fluid turnover goal |
| `DEFAULT_READING_TARGET_PAGES` | Constant | — | `20` | Daily technical reading goal |
| `HYDRATION_CIRCUMFERENCE` | Constant | — | `314.159...` | Circumference for $r=50$ SVG ring |
| `CLEAN_DAY_TIERS` | Constant | — | Object | 5 neuroplastic tiers metadata |
| `HABIT_BENCHMARKS` | Constant | — | Array | 5 ledger benchmark definitions |
| `parseTimeToMinutes` | Sleep | `timeStr: string` | `number (0..1439)` | Converts HH:mm to minutes |
| `calculateSleepDuration` | Sleep | `bedtimeRaw, wakeupRaw` | `SleepDurationResult` | Cross-midnight duration & formatting |
| `parseSleepDuration` | Sleep | `formatted: string` | `number` | Parses "8h 00m" to decimal 8.0 |
| `isSleepOptimal` | Sleep | `durationHours: number` | `boolean` | Checks $7.5\text{h} \le \text{hours} \le 8.5\text{h}$ |
| `classifyCircadianPhase` | Sleep | `bedtimeRaw, durationHours` | `CircadianPhase` | Optimal, delayed, shifted, short |
| `calculateDailySleepDelta` | Sleep Debt | `durationHours, baseline` | `number` | Daily delta (+/-) vs 8.0h |
| `calculateDailySleepDebt` | Sleep Debt | `durationHours, baseline` | `number` | Acute daily deficit $\max(0, 8 - H)$ |
| `calculateSleepDebt` | Sleep Debt | `dailyRecordsList, baseline` | `SleepDebtResult` | Accumulated deficit & net balance |
| `evaluateCleanDay` | Clean Day | `keystones: KeystoneMarkersInput` | `boolean` | 4/4 markers $\to$ `true` |
| `countCleanMarkers` | Clean Day | `keystones: KeystoneMarkersInput` | `number (0..4)` | Count of completed markers |
| `classifyCleanStreakTier` | Clean Day | `streak: number` | `CleanDayTierName` | Tier name from streak |
| `getCleanDayTierInfo` | Clean Day | `streak: number` | `CleanDayTierInfo` | Detailed tier badge & distance |
| `calculateCleanStreak` | Clean Day | `dailyRecordsMap, date, override?` | `number` | Unbroken consecutive clean streak |
| `calculateHydrationStats` | Hydration | `currentMl, targetMl` | `HydrationStats` | Ratios, liters, strokeDashoffset |
| `applyHydrationQuickAdd` | Hydration | `currentMl, addMl, maxMl` | `number` | Increments volume clamped $\le 8000$ |
| `applyHydrationStep` | Hydration | `currentMl, stepMl, maxMl` | `number` | Adjusts volume clamped $[0, 8000]$ |
| `getHorizonDates` | Telemetry | `timeframe, date` | `string[]` | Timezone-safe YYYY-MM-DD dates |
| `computeHabitsScorecards` | Telemetry | `dailyRecordsMap, timeframe, date` | `HabitsHorizonScorecards` | Quad scaled targets & actuals |
| `evaluatePillarStatus` | Consistency | `pillarId, rec` | `'met' \| 'partial' \| 'none'` | Single cell status evaluation |
| `evaluateConsistencyMatrix` | Consistency | `dailyRecordsMap, todayDateStr` | `HabitMatrixResult` | 5x7 grid, cell statuses, score % |
| `computeAdherenceLedger` | Adherence | `dailyRecordsMap, timeframe, tier, date` | `HabitsAdherenceLedgerResult` | Target vs completed ledger rows |
| `calculateReadingStats` | Reading | `book, startPage, endPage` | `ReadingStatsResult` | Pages read & book progress % |
| `computeDayBalanceRibbon` | Day Ledger | `sleep, focus, move` | `DayBalanceRibbonResult` | 24-hour circadian day partition |
| `auditTapTargetSize` | Ergonomics | `widthPx, heightPx` | `boolean` | Validates $\ge 44\text{px} \times 44\text{px}$ |
| `containsBannedEmojis` | Ergonomics | `text: string` | `boolean` | Validates zero cartoon emojis |

---

## 5. Verification Method

To independently verify the mathematical accuracy, boundary resistance, and consistency of the designed module:

### 5.1 Automated Script Execution
Run the verification suite:
```bash
node --experimental-strip-types scripts/verify_habits_integrity.mjs
```

**Expected Result**:
```
======================================================================
HABITS INTEGRITY TEST EXECUTION SUMMARY
======================================================================
Tier 1 (Feature Coverage)     : 101 / 101 passed
Tier 2 (Boundary & Corners)   : 100 / 100 passed
Tier 3 (Cross Combinations)   : 44 / 44 passed
Tier 4 (Real-World Workloads) : 31 / 31 passed
----------------------------------------------------------------------
Total Assertions Run          : 276
Passed Assertions             : 276
Failed Assertions             : 0

✓ 100% OF TESTS PASSED! Habits Engine, Telemetry & Day Ledger Verified Resilient.
```

### 5.2 Direct Implementation Drop-In Verification
When implementing `src/utils/habitsMath.ts`:
1. Copy `.agents/explorer_m1_math_engine/proposed_habitsMath.ts` to `src/utils/habitsMath.ts`.
2. Run TypeScript build verification:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with status `0` and zero errors.

### 5.3 Invalidation Conditions
This specification shall be considered invalidated if:
1. Cross-midnight sleep with $T_w < T_b$ yields negative or zero duration.
2. An empty daily records map produces `NaN` or unhandled division-by-zero errors in hydration stats, horizon scaling quad, consistency matrix, or adherence ledger.
3. Clean day evaluates to `true` when only 3 of 4 markers are satisfied.
4. SVG circular ring `strokeDashoffset` becomes negative or wraps around when current hydration exceeds target (e.g. 4500ml on 3500ml target).
5. Tap target validators allow interactives $< 44\text{px}$.
