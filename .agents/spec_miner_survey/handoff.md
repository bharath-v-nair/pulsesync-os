# Circadian & Behavioral Specification Handoff Report: Habits Engine Revamp

- **Author**: Circadian & Behavioral Spec Miner (`spec_miner_survey`)
- **Target Systems**: PulseSync OS Habits Engine, Overview Telemetry, Day Ledger Integration
- **Status**: Complete / Authoritative
- **Timestamp**: 2026-09-05T13:28:00Z
- **Reference Request**: `ORIGINAL_REQUEST.md` (R1–R5)

---

## 1. Observation

Direct inspection of the PulseSync OS codebase revealed the exact current state, data structures, and implementation gaps:

1. **`src/types/index.ts` (Lines 150–204)**:
   - `SleepRecord`: Has `bedtimeRaw`, `wakeupRaw`, `sleepDuration`, `isOptimal`, `sunlightDone`. Lacks numeric `durationHours`, calculated `sleepDebtHours`, or baseline target attributes.
   - `DetoxState`: Stores `cleanDays`, `tierName`, `morningPhoneFree`, `zeroReels`, `noPhoneInBed`. It is isolated from environmental discipline.
   - `keystones`: Only stores `{ bedMade: boolean; roomReset: boolean }`. Missing `cleanDiet`, `zeroDoomscroll`, and `dailySupplements`.
   - `dailyRecords: Record<string, DailyRecord>`: Stores `sleepDurationHours`, `sleepDuration`, `bedtimeRaw`, `wakeupRaw`, `pagesRead`, `cleanDay`.
   - **Critical Omission**: **Hydration / Fluid Dynamics is 100% missing** from `types/index.ts`. There are zero types for hydration volume, target, quick-adds, or daily intake.

2. **`data/habits.json` (Lines 1–61)**:
   - Contains seed data for `sleep`, `detox`, `reading`, `keystones`, and `dailyRecords["2026-09-04"]`.
   - Zero hydration fields exist.
   - `dailyRecords["2026-09-04"]` contains `sleepMinutes: 380`, `sunlightDone: false`, `cleanDay: true`, `pagesRead: 22`, `bedMade: false`, `roomReset: false`.

3. **`src/services/storage.ts` (Lines 43–76, 146–161)**:
   - Storage key: `pulsesync_habits_v4`.
   - `DEFAULT_HABITS` lacks any hydration initialization.
   - `getHabitsData()` performs a simple shallow merge `{ ...DEFAULT_HABITS, ...JSON.parse(data) }`. Any missing nested fields (like hydration) will cause `undefined` runtime access if not initialized.

4. **`src/components/habits/HabitsEngine.tsx` (Lines 1–51)**:
   - Renders 4 separate cards: `SleepCard`, `DetoxCard`, `DeepReadingCard`, `KeystonesCard`.
   - Lacks a Hydration pillar card.
   - Keystones and Detox are split into two separate cards with duplicate concepts (e.g. phone-free vs keystones) rather than an integrated Keystone Discipline & Clean Day Matrix.

5. **`src/components/habits/SleepCard.tsx` (Lines 1–83)**:
   - Bedtime and wakeup inputs update raw string state (`bedtimeRaw`, `wakeupRaw`), but do **not** calculate sleep duration dynamically. The duration displayed is static or manual.
   - No sleep debt metric is calculated or displayed.
   - No visual circadian phase classification (optimal vs delayed vs shifted).

6. **`src/components/overview/OverviewView.tsx` (Lines 784–822)**:
   - When `telemetryDomain === 'habits'`, only renders 3 static cards: Sleep Target (shows static `sleepDuration`), Clean Day Streak (`cleanDays`), Pages Read (`pagesReadToday`).
   - None of the scorecards scale across the active timeframe horizon (`7D`, `14D`, `30D`, `90D`).
   - Hydration scorecard is completely missing.
   - No `HabitConsistencyMatrix` exists (unlike the 7-day `FocusConsistencyMatrix`).
   - No `HabitsAdherenceLedger` exists (unlike `FocusAdherenceLedger` and `MoveAdherenceLedger`).

7. **`src/components/overview/DayBalanceRibbon.tsx` (Lines 18–30)**:
   - Derives `sleepHours` by checking `habitRecord?.sleepDurationHours`, then regex parsing `habits.sleep?.sleepDuration`, defaulting to `8.0`.
   - When sleep changes in habits, it partitions the 24-hour bar into Sleep, Focus, Move, and Rest.

8. **`src/components/overview/DayLedgerFeed.tsx` (Lines 474–524) & `MissedLogModals.tsx` (Lines 594–657)**:
   - Habit receipt in `DayLedgerFeed` only renders Sleep, Clean Day, and Reading. Hydration is missing.
   - `EditHabitsModal` allows editing `sleepDuration`, `pagesRead`, and `cleanDay` (single checkbox). It does not permit editing bedtime/wake timestamps, morning sunlight, hydration volume, or individual keystone markers.

---

## 2. Logic Chain

1. **Circadian Biology & Sleep Architecture (Walker & Huberman)**:
   - Human sleep consists of ~90-minute ultradian cycles (NREM Slow-Wave Sleep and REM). Optimal restorative physiological recovery requires 5 full cycles, equating to 7.5h to 8.5h (calibrated 8.0h baseline).
   - Acute sleep debt accumulates whenever actual sleep falls below baseline: $\text{Debt} = \max(0, \text{Baseline} - \text{Actual})$.
   - Retinal exposure to high-lux outdoor sunlight within 30 minutes of waking stimulates ipRGCs, synchronizing the hypothalamic suprachiasmatic nucleus (SCN), optimizing cortisol awakening response (CAR), and initiating the 14–16h pineal melatonin countdown.
   - Therefore: Sleep logging must accept 24h timestamps (`bedtimeRaw`, `wakeupRaw`), compute cross-midnight duration automatically, track the morning sunlight anchor as a first-class boolean, calculate accumulated sleep debt against an 8.0h calibrated baseline, and feed duration directly into the DayBalanceRibbon.

2. **Fluid Dynamics & Executive Function (Huberman Protocol)**:
   - Dehydration exceeding 1–2% body mass degrades cognitive focus, neural conductivity, and physical work capacity.
   - For an active individual undertaking high cognitive load and daily physical resistance training, baseline fluid turnover requires 3.5 Liters (3,500 ml) daily.
   - Frictionless logging requires 1-tap micro-adds (+250ml cup, +500ml flask) and step adjustments.
   - Clear visual feedback requires a circular SVG progress ring calculating `strokeDashoffset` dynamically, with zero cartoon emojis (strictly Lucide `Droplets` SVG icon).

3. **Behavioral Discipline & Cue-Friction Loops (Clear & Lembke)**:
   - Keystone habits create positive behavioral cascade effects.
   - 4 non-negotiable discipline markers define cognitive and physical readiness:
     1. `cleanDiet`: Whole foods, zero refined sugar/processed junk.
     2. `zeroDoomscroll`: Zero algorithmic short-form video consumption (Reels, TikTok, Shorts).
     3. `dailySupplements`: Daily micronutrient/electrolyte stack (D3+K2, Omega-3, Magnesium, Creatine).
     4. `bedMade`: Physical environment hygiene and immediate post-waking agency.
   - An immutable Clean Day status requires 100% adherence to all 4 markers:
     $$\text{cleanDay} = \text{cleanDiet} \land \text{zeroDoomscroll} \land \text{dailySupplements} \land \text{bedMade}$$
   - When all markers are met, `cleanDay` reactively becomes `true`, incrementing the current unbroken streak.

4. **Dynamic Horizon Telemetry & Linear Metric Scaling**:
   - In PulseSync OS, the user selects between `7D`, `14D`, `30D`, and `90D` horizons.
   - All targets must scale linearly with the horizon duration $T \in \{7, 14, 30, 90\}$:
     - Sleep Target: $8.0 \times T \text{ hours}$ (56h, 112h, 240h, 720h).
     - Clean Days: $T \text{ days}$ target.
     - Hydration Target: $3.5 \times T \text{ Liters}$ (24.5L, 49.0L, 105.0L, 315.0L).
     - Deep Reading Target: $20 \times T \text{ pages}$ (140p, 280p, 600p, 1800p).
   - The Habit Consistency Matrix must evaluate the last 7 days across 5 core pillars with high-signal visual icons and an aggregate percentage score.
   - The Habits Adherence Ledger must provide baseline vs stretch targets with deltas and completion status.

5. **Ergonomic & Anti-AI-Slop Standards**:
   - Mobile tap targets must be strictly $\ge 44\text{px}$ to prevent mis-taps.
   - Zero cartoon emojis: strictly dark matte UI (`#090d16`, `#0c101a`, `border-white/10`, `font-mono`) with Lucide SVG icons.
   - Tactile haptic feedback (`triggerHaptic`) on all micro-interactions.

---

## 3. Authoritative Specification & Mathematical Formulations

### 3.1 Domain 1: Hydration / Fluid Dynamics
- **Default Baseline Target**: $3,500\text{ ml}$ ($3.5\text{L}$).
- **Quick-Add Presets**:
  - `+250ml` (Standard glass / mug)
  - `+500ml` (Standard shaker / flask bottle)
- **Stepper Adjustment Logic**:
  - Decrement: $-100\text{ml}$ or $-250\text{ml}$, clamped at $\min = 0\text{ml}$.
  - Increment: $+100\text{ml}$ or $+250\text{ml}$, upper bound $8,000\text{ml}$.
- **Mathematical Formulas**:
  $$\text{adherenceRatio} = \min\left(1.5, \frac{\text{currentMl}}{\text{targetMl}}\right)$$
  $$\text{progressPercent} = \min\left(100, \text{round}\left(\frac{\text{currentMl}}{\text{targetMl}} \times 100\right)\right)$$
  $$\text{remainingMl} = \max(0, \text{targetMl} - \text{currentMl})$$
  $$\text{volumeLiters} = \left(\frac{\text{currentMl}}{1000}\right).\text{toFixed}(2) + \text{ 'L'}$$
- **SVG Progress Ring Geometry**:
  - ViewBox: `0 0 120 120`
  - Center: $cx = 60, cy = 60$
  - Radius: $r = 50\text{px}$
  - Stroke Width: $8\text{px}$
  - Circumference:
    $$C = 2 \times \pi \times r = 2 \times \pi \times 50 = 100\pi \approx 314.159265\text{px}$$
  - Background Circle: `stroke="#1e293b"`, `strokeWidth="8"`, `fill="none"`
  - Foreground Progress Circle:
    $$\text{strokeDasharray} = 314.159$$
    $$\text{strokeDashoffset} = 314.159 \times \left(1 - \min\left(1, \frac{\text{currentMl}}{\text{targetMl}}\right)\right)$$
    - Gradient: `#0284c7` (Sky-600) to `#38bdf8` (Sky-400).
    - Start point: 12 o'clock via `transform="rotate(-90 60 60)"`.
    - Linecap: `strokeLinecap="round"`.
    - Transition: `stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Zero Emojis**:
  - Centered icon: `<Droplets className="w-5 h-5 text-sky-400" />` (Lucide SVG).
  - Center text: `${(currentMl / 1000).toFixed(1)}L` (font-mono font-bold text-white text-xl), `/ 3.5L` (text-[10px] text-slate-400).

---

### 3.2 Domain 2: Circadian Sleep & Recovery
- **Baseline Target**: Calibrated $8.0\text{ hours}$ (representing the optimal center of Matthew Walker's 7.5h–8.5h window).
- **Time Inputs**:
  - 24-hour time format: `HH:mm` (e.g. Bedtime `23:15`, Wakeup `07:15`).
- **Cross-Midnight Duration Calculation**:
  Given `bedtimeRaw` ($H_b : M_b$) and `wakeupRaw` ($H_w : M_w$):
  $$T_b = H_b \times 60 + M_b$$
  $$T_w = H_w \times 60 + M_w$$
  $$\text{durationMinutes} = \begin{cases} 
    T_w - T_b & \text{if } T_w \ge T_b \text{ (same day)} \\
    (1440 - T_b) + T_w & \text{if } T_w < T_b \text{ (crosses midnight)}
  \end{cases}$$
  $$\text{sleepDurationHours} = \text{round}\left(\frac{\text{durationMinutes}}{60} \times 100\right) / 100$$
  $$\text{sleepDurationFormatted} = \lfloor \text{durationMinutes} / 60 \rfloor + \text{'h '} + \text{String}(\text{durationMinutes} \pmod{60}).\text{padStart}(2, \text{'0'}) + \text{'m'}$$
  *(e.g., $480\text{ mins} \to 8.0\text{h} \to \text{"8h 00m"}$; $380\text{ mins} \to 6.33\text{h} \to \text{"6h 20m"}$)*.
- **Sleep Optimality & Phase Classification**:
  - Optimal Duration: $\text{sleepDurationHours} \ge 7.5 \land \text{sleepDurationHours} \le 8.5$.
  - Bedtime Hour Decimal: $H_{\text{dec}} = H_b + M_b / 60$.
  - Circadian Phase Status:
    - `optimal`: Bedtime between $21:30$ and $00:30$ ($21.5 \le H_{\text{dec}} \le 24.0 \lor H_{\text{dec}} \le 0.5$) AND duration $\ge 7.5\text{h}$.
    - `delayed`: Bedtime between $00:30$ and $02:30$ ($0.5 < H_{\text{dec}} \le 2.5$).
    - `shifted`: Bedtime after $02:30$ ($2.5 < H_{\text{dec}} \le 12.0$).
    - `short`: Duration $< 6.5\text{h}$.
- **Sleep Debt Mathematical Formulas**:
  - Daily Baseline: $8.0\text{h}$.
  - Daily Sleep Delta:
    $$\Delta_{\text{day}} = \text{sleepDurationHours} - 8.0$$
  - Acute Accumulated Sleep Debt (Walker Deficit Accumulator across horizon of $N$ days):
    $$\text{Accumulated Debt} = \sum_{i=1}^{N} \max(0, 8.0 - \text{sleepDurationHours}_i)$$
  - Net Sleep Balance across horizon:
    $$\text{Net Balance} = \sum_{i=1}^{N} (\text{sleepDurationHours}_i - 8.0)$$
- **Morning Sunlight Anchor**:
  - Protocol: 10 minutes of direct outdoor lux within 30 minutes of waking.
  - State: `sunlightDone: boolean`.
  - Icon: `<Sun className="w-4 h-4 text-amber-400" />`.
- **DayBalanceRibbon Integration**:
  - Consumes `sleepHours = habitRecord?.sleepDurationHours ?? 8.0`.
  - Partitioning formula:
    $$\text{sleepPct} = \text{round}\left(\frac{\text{sleepHours}}{\text{totalAccountedHours}} \times 100\right)$$
  - Ribbon segment renders gradient `from-indigo-600 to-blue-500` with width `${sleepPct}%`.

---

### 3.3 Domain 3: Deep Reading & Knowledge
- **Bookshelf Schema**:
  ```ts
  export interface Book {
    id: string;
    title: string;
    author: string;
    totalPages: number;
    currentPage: number;
    completed: boolean;
    category?: string;
  }
  ```
- **Reading State**:
  ```ts
  export interface ReadingState {
    activeBookId: string;
    books: Book[];
    startPage: number;
    endPage: number;
    pagesReadToday: number;
    timerSeconds: number;       // default 1200 (20 minutes)
    isTimerRunning: boolean;
    targetPagesPerDay: number;  // default 20
  }
  ```
- **Session Duration Timer Specs**:
  - Default preset: 20-minute deliberate technical sprint ($1,200\text{ seconds}$).
  - Controls: Start, Pause, Reset to 20m.
  - Countdown: Ticks every 1,000ms. At 0s, triggers `triggerHaptic(40)` and sets `isTimerRunning = false`.
- **Page Delta Math**:
  $$\text{pagesRead} = \max(0, \text{endPage} - \text{startPage})$$
  $$\text{bookProgressPercent} = \min\left(100, \text{round}\left(\frac{\text{currentPage}}{\text{totalPages}} \times 100\right)\right)$$
- **Shelf Navigation**:
  - Tap target `Shelf (N) >` calls `onNavigateLibrary()`, switching `activeView` to `'library'`.
  - In Library, updating a book's page updates both `books[id].currentPage` and synchronizes `reading.pagesReadToday`.

---

### 3.4 Domain 4: Keystone Discipline & Clean Day Matrix
- **The 4 Non-Negotiable Binary Markers**:
  1. `cleanDiet: boolean` — Whole foods nutrition, zero processed sugars.
  2. `zeroDoomscroll: boolean` — Zero algorithmic short-form feeds (Reels, TikTok, Shorts).
  3. `dailySupplements: boolean` — Daily micronutrient & electrolyte intake.
  4. `bedMade: boolean` — Immediate morning environmental reset & discipline anchor.
  *(Optional 5th environment marker: `roomReset: boolean`)*.
- **Canonical Clean Day Reactive Calculation**:
  A day is immutable Clean (`cleanDay = true`) if and only if **all 4 markers** are completed:
  $$\text{cleanDay} = \text{cleanDiet} \land \text{zeroDoomscroll} \land \text{dailySupplements} \land \text{bedMade}$$
- **Streak & Tier Formulation**:
  $$\text{cleanStreak} = \text{consecutive unbroken days counting backwards where } \text{cleanDay} = \text{true}$$
  - Tiers:
    - $0 \le \text{streak} \le 6$: `Calibrated`
    - $7 \le \text{streak} \le 13$: `Disciplined`
    - $14 \le \text{streak} \le 29$: `Fortified`
    - $30 \le \text{streak} \le 89$: `Unbreakable`
    - $\text{streak} \ge 90$: `Sovereign`
- **Reactive Persistence**:
  When any marker is toggled:
  1. Compute `isClean = cleanDiet && zeroDoomscroll && dailySupplements && bedMade`.
  2. Update `habits.dailyRecords[dateStr].cleanDay = isClean`.
  3. Update `habits.dailyRecords[dateStr]` with individual boolean markers.
  4. Recalculate streak and update `habits.detox.cleanDays`.

---

### 3.5 Domain 5: Overview Telemetry & Dynamic Horizon Scaling

#### 1. Timeframe Horizons & Multipliers
The 4 standard horizons: $T \in \{7, 14, 30, 90\}$ days.
Multiplier against 7-day weekly base: $M_T = \frac{T}{7}$.

#### 2. Target-Anchored Scorecards Quad (Dynamic Scaling)
1. **Sleep Target & Debt Scorecard**:
   - Baseline Target: $\text{Target Hours} = 8.0 \times T$
     - 7D: $56.0\text{h}$
     - 14D: $112.0\text{h}$
     - 30D: $240.0\text{h}$
     - 90D: $720.0\text{h}$
   - Actual Hours: $\text{Total Sleep} = \sum_{d=1}^{T} \text{sleepDurationHours}_d$
   - Completion Rate: $\text{round}((\text{Total Sleep} / \text{Target Hours}) \times 100)\%$
   - Accumulated Sleep Debt: $\sum_{d=1}^{T} \max(0, 8.0 - \text{sleepDurationHours}_d)$
   - Display: `${totalSleep.toFixed(1)} / ${targetHours.toFixed(0)} hrs` with debt badge.

2. **Clean Day Consistency Rate Scorecard**:
   - Target Days: $T$ days (7, 14, 30, 90).
   - Actual Clean Days: $\text{Clean Count} = \sum_{d=1}^{T} \mathbb{I}(\text{cleanDay}_d = \text{true})$
   - Consistency Rate: $\text{round}((\text{Clean Count} / T) \times 100)\%$
   - Display: `${cleanCount} / ${T}d` with `${rate}% consistency rate`.

3. **Hydration Adherence Scorecard**:
   - Baseline Target: $\text{Target Liters} = 3.5 \times T$
     - 7D: $24.5\text{L}$
     - 14D: $49.0\text{L}$
     - 30D: $105.0\text{L}$
     - 90D: $315.0\text{L}$
   - Actual Volume: $\text{Total Liters} = \left(\sum_{d=1}^{T} \text{hydrationCurrentMl}_d\right) / 1000$
   - Adherence Rate: $\text{round}((\text{Total Liters} / \text{Target Liters}) \times 100)\%$
   - Days Met: $\sum_{d=1}^{T} \mathbb{I}(\text{hydrationCurrentMl}_d \ge 3500)$
   - Display: `${totalLiters.toFixed(1)} / ${targetLiters.toFixed(1)} L` with `${adherenceRate}% adherence`.

4. **Pages Read Scorecard**:
   - Baseline Target: $\text{Target Pages} = 20 \times T$
     - 7D: $140\text{ pages}$
     - 14D: $280\text{ pages}$
     - 30D: $600\text{ pages}$
     - 90D: $1,800\text{ pages}$
   - Actual Pages: $\text{Total Pages} = \sum_{d=1}^{T} \text{pagesRead}_d$
   - Pacing Rate: $\text{round}((\text{Total Pages} / \text{Target Pages}) \times 100)\%$
   - Display: `${totalPages} / ${targetPages} pages` with `${rate}% pace`.

#### 3. Multi-Pillar 7-Day Habit Consistency Matrix
- Component: `HabitConsistencyMatrix.tsx`
- Grid: 5 Pillar Rows $\times$ 7 Day Columns ($D-6$ to Today $D$).
- Pillars:
  1. **Circadian Sleep** (`Moon`): Met ($\ge 7.5\text{h}$), Partial ($6.0\text{h} - 7.49\text{h}$), None ($< 6.0\text{h}$).
  2. **Morning Sunlight** (`Sun`): Met (`sunlightDone === true`), None (`false`).
  3. **Fluid Dynamics** (`Droplets`): Met ($\ge 3,500\text{ml}$), Partial ($2,000\text{ml} - 3,499\text{ml}$), None ($< 2,000\text{ml}$).
  4. **Keystone Clean Day** (`ShieldCheck`): Met (`cleanDay === true`), Partial ($3/4$ markers), None ($\le 2/4$ markers).
  5. **Deep Reading** (`BookOpen`): Met ($\ge 20\text{ pages}$), Partial ($1 - 19\text{ pages}$), None ($0\text{ pages}$).
- Scoring:
  - Met: $1.0\text{ pt}$
  - Partial: $0.5\text{ pt}$
  - None: $0.0\text{ pt}$
  - Max Points: $5 \times 7 = 35\text{ pts}$
  - Aggregate Matrix Score:
    $$\text{Score \%} = \text{round}\left(\frac{\sum \text{Points}}{35} \times 100\right)$$

#### 4. Habits Adherence Ledger Format
- Component: `HabitsAdherenceLedger.tsx`
- Goal Benchmarks (Scalable with $T / 7$):
  | Pillar | Category | Unit | Baseline Weekly (7D) | Stretch Weekly (7D) | Description |
  |---|---|---|---|---|---|
  | Circadian Sleep | `sleep` | hours | 56.0 (8.0h/d) | 59.5 (8.5h/d) | Optimal 5-cycle recovery window |
  | Morning Sunlight | `sunlight` | sessions | 6 (6/7d) | 7 (7/7d) | 10m direct sunlight within 30m of waking |
  | Hydration Intake | `hydration` | liters | 24.5 (3.5L/d) | 28.0 (4.0L/d) | Target fluid turnover for cognitive acuity |
  | Keystone Clean Days | `discipline` | days | 6 (6/7d) | 7 (7/7d) | Diet, Zero Doomscrolling, Supps, Bed Made |
  | Technical Reading | `reading` | pages | 140 (20p/d) | 210 (30p/d) | Deliberate engineering & science reading |
- Row attributes: `completed`, `target`, `delta`, `adherencePct`, `isMet`, progress bar.

---

### 3.6 Domain 6: Design & Ergonomic Standards
- **Strict 44px Minimum Physical Tap Targets**:
  - Class `min-h-[44px] min-w-[44px]` and `tap-target` on all interactive buttons, inputs, quick adds, toggles.
- **Dark Matte Pure Cockpit Styling**:
  - Background base: `#080a0f` / `#090d16`
  - Card background: `#0c101a` / `#0c1017`
  - Card border: `border border-white/10 hover:border-white/20`
  - Inner wells: `bg-[#0a0d15]` / `bg-black/40`
  - Typography: `font-mono tracking-tight tabular-nums` for all values.
- **Anti-AI-Slop Rule (Strictly Zero Cartoon Emojis)**:
  - Banned: 💧, 😴, 📚, 🥑, 📱, 💊, 🛏️, 🔥, ⚡, 📊, 📅.
  - Allowed: Lucide SVG components exclusively (`Droplets`, `Moon`, `Sun`, `BookOpen`, `ShieldCheck`, `Utensils`, `SmartphoneOff`, `Pill`, `Sparkles`, `Check`, `Minus`, `ChevronRight`).
- **Tactile Haptic Feedback (`triggerHaptic`)**:
  - `triggerHaptic(10)`: Stepper increments/decrements, tab switching.
  - `triggerHaptic(15)`: Checkbox toggles, sunlight anchor toggle.
  - `triggerHaptic(20)`: Quick-adds (+250ml, +500ml), modal submission.
  - `triggerHaptic(40)`: Timer completion, milestone achievement.

---

### 3.7 Day Ledger Bidirectional Integration Specs
1. **Day Ledger Feed Receipt (`DayLedgerFeed.tsx`)**:
   - For `selectedDate`, the `Discipline (Habits)` section must display a 4-column high-signal grid:
     1. **Sleep**: Duration (e.g. `8h 00m`), timestamps (`23:15 - 07:15`), and Sunlight badge if completed.
     2. **Hydration**: Volume logged (e.g. `3.5L / 3.5L`, adherence badge).
     3. **Clean Day**: Status (`✓ Calibrated` or `Incomplete`) with 4 marker indicators.
     4. **Reading**: Pages read (`24 pages`).
2. **`EditHabitsModal`**:
   - Accessible via "Edit Habits" or "+ Log Habits" button on any selected date.
   - Fields:
     - Sleep: Bedtime (`HH:mm`), Wakeup (`HH:mm`), Duration (reactively computed from timestamps with manual override option), Sunlight anchor toggle.
     - Hydration: Stepper or number input for current volume (ml) and target volume (ml).
     - Keystone Discipline: 4 toggles (`cleanDiet`, `zeroDoomscroll`, `dailySupplements`, `bedMade`). Computes Clean Day status live.
     - Reading: Number input for `pagesRead`.
   - On Save:
     - Updates `habits.dailyRecords[selectedDate]`.
     - If `selectedDate === todayStr`, synchronizes live state (`habits.sleep`, `habits.hydration`, `habits.keystones`, `habits.reading.pagesReadToday`).
     - Calls `StorageService.saveHabitsData()`.
     - `DayBalanceRibbon` updates immediately.

---

## 4. Complete TypeScript Interface Contracts

```ts
// ==========================================
// Habits & Discipline Domain Types (Revamped)
// ==========================================

export interface SleepRecord {
  bedtimeRaw: string;         // '23:15'
  wakeupRaw: string;          // '07:15'
  sleepDuration: string;       // '8h 00m'
  sleepDurationHours: number;  // 8.0
  isOptimal: boolean;          // duration >= 7.5 && duration <= 8.5
  sunlightDone: boolean;       // 10m direct morning sunlight
  sleepDebtHours?: number;     // accumulated vs 8.0h baseline
}

export interface HydrationRecord {
  currentMl: number;           // e.g. 2500
  targetMl: number;            // default 3500
  quickAddUnits: number[];     // [250, 500]
  lastLoggedAt?: string;
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
  timerSeconds: number;        // default 1200 (20m)
  isTimerRunning: boolean;
  targetPagesPerDay?: number;  // default 20
}

export interface KeystonesState {
  cleanDiet: boolean;          // Whole foods, zero processed sugar
  zeroDoomscroll: boolean;     // Zero reels, shorts, doomscrolling
  dailySupplements: boolean;   // Micronutrients & electrolytes
  bedMade: boolean;            // Morning bed made & room reset
  roomReset?: boolean;         // Evening space reset
}

export interface DailyHabitRecord {
  // Sleep
  sleepDurationHours?: number;
  sleepDuration?: string;
  bedtimeRaw?: string;
  wakeupRaw?: string;
  sunlightDone?: boolean;
  sleepDebtHours?: number;
  isOptimal?: boolean;
  // Hydration
  hydrationCurrentMl?: number;
  hydrationTargetMl?: number;
  // Reading
  pagesRead?: number;
  activeBookId?: string;
  // Keystone Discipline
  cleanDay?: boolean;
  cleanDiet?: boolean;
  zeroDoomscroll?: boolean;
  dailySupplements?: boolean;
  bedMade?: boolean;
  roomReset?: boolean;
}

export interface DetoxState {
  cleanDays: number;
  tierName: string;
  morningPhoneFree?: boolean;
  zeroReels?: boolean;
  noPhoneInBed?: boolean;
  relapseHistory?: string[];
}

export interface HabitsData {
  sleep: SleepRecord;
  hydration: HydrationRecord;
  reading: ReadingState;
  keystones: KeystonesState;
  detox: DetoxState;
  dailyRecords: Record<string, DailyHabitRecord>;
}
```

---

## 5. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Hydration | Target-Anchored Fluid Dynamics | Target 3.5L daily volume tracking with progress gauge | `currentMl: number`, `targetMl: number` | Adherence %, remaining ml, liters formatted | Clamps currentMl $\ge 0$ | ORIGINAL_REQUEST R2.1 |
| 2 | Hydration | Quick-Add Micro-Logging | 1-tap buttons for +250ml and +500ml | Click event | Increments currentMl by 250 or 500, triggers haptic | Prevents NaN | ORIGINAL_REQUEST R2.1 |
| 3 | Hydration | Custom Stepper Adjustments | Fine-grained decrement/increment buttons (-100, +100) | Click event | Steps volume up/down | Min clamp at 0ml | ORIGINAL_REQUEST R2.1 |
| 4 | Hydration | SVG Circular Progress Ring | Visual ring rendered using SVG stroke-dashoffset | Radius 50, stroke 8, circumference 314.159 | Rendered SVG circle with sky gradient | NaN ratio defaults to offset 314.159 | Codebase audit & R2.1 |
| 5 | Sleep | Cross-Midnight Duration Math | Automatically calculates sleep duration across 00:00 boundary | `bedtimeRaw: string`, `wakeupRaw: string` | `durationHours: number`, `durationFormatted: string` | If identical times, handles gracefully | SleepCard & SleepTelemetryChart |
| 6 | Sleep | Calibrated Baseline Target | 7.5h–8.5h optimal window with 8.0h calibrated baseline | `sleepDurationHours` | `isOptimal: boolean`, delta vs 8.0h | Missing duration defaults to 8.0h | Matthew Walker architecture |
| 7 | Sleep | Morning Sunlight Anchor | 10m direct outdoor sunlight within 30m of waking | Toggle click | `sunlightDone: boolean`, SCN entrainment | Boolean toggle | Huberman protocol & SleepCard |
| 8 | Sleep | Accumulated Sleep Debt | Walker deficit accumulator tracking lost sleep across horizon | Array of daily sleep records in horizon | `accumulatedDebt: number`, `netBalance: number` | Days without logs count as 8h debt | Behavioral science modeling |
| 9 | Sleep | DayBalanceRibbon Synchronization | Feeds sleep duration into 24-hour circadian day bar | `sleepDurationHours` for selectedDate | Sleep % partition of 24h bar | Falls back to 8.0h if unlogged | DayBalanceRibbon.tsx |
| 10 | Reading | 20m Deep Reading Timer | Countdown timer for deliberate technical reading | 1200 seconds countdown | Formatted MM:SS, Play/Pause state, completion haptic | Auto-pauses at 0, no negative time | DeepReadingCard.tsx |
| 11 | Reading | Bookshelf Catalog & Shelf Nav | Manages active technical books and navigation to Library | `Book[]`, `activeBookId` | Active book progress, shelf count, breadcrumb nav | If shelf empty, prompts to add book | LibraryView.tsx & App.tsx |
| 12 | Keystones | 4 Binary Discipline Markers | Clean Diet, Zero Doomscroll, Daily Supps, Bed Made | 4 boolean toggles | Updated KeystonesState | Boolean state | ORIGINAL_REQUEST R2.4 |
| 13 | Keystones | Reactive Clean Day Calculation | Computes clean day if all 4 markers are completed | 4 booleans | `cleanDay: boolean`, streak count, tier badge | Missing marker fails clean day | Clear cue-friction loop |
| 14 | Telemetry | Dynamic Horizon Scaling (7/14/30/90D) | Linearly scales targets across 4 discrete horizons | `timeframe: 7 \| 14 \| 30 \| 90` | Scaled targets: Sleep, Clean Days, Hydration, Pages | Unknown timeframe defaults to 7D | OverviewView.tsx & R3 |
| 15 | Telemetry | Target-Anchored Scorecards Quad | 4 scorecards for Sleep/Debt, Clean Day Rate, Hydration, Reading | Daily records in selected horizon | Percentage progress, actual/target values, status pills | Zero division protected | ORIGINAL_REQUEST R3 |
| 16 | Telemetry | Multi-Pillar Habit Consistency Matrix | 7-day grid across 5 core pillars with Lucide SVG icons | 7-day historical records | 5×7 grid with Met/Partial/None badges, aggregate % | Unlogged days render as Pending | FocusConsistencyMatrix model |
| 17 | Telemetry | Habits Adherence Ledger | Baseline vs Stretch benchmark breakdown with deltas | Horizon-scaled benchmarks and actuals | Table of targets, actuals, deltas, adherence % | Handles 0 target cleanly | Move/FocusAdherenceLedger model |
| 18 | Day Ledger | Historical Habit Receipts | Renders Sleep, Hydration, Clean Day, Reading in Day Ledger | `selectedDate` | Chronological habit card in historical feed | Empty date shows "+ Log Habits" | DayLedgerFeed.tsx |
| 19 | Day Ledger | EditHabitsModal Backfilling | Modal to backfill/edit all 4 pillars for any historical date | Form submission | Writes to `dailyRecords[selectedDate]`, syncs live if today | Invalid input validated | MissedLogModals.tsx |
| 20 | Ergonomics | Strict 44px Tap Targets & Matte Styling | Cockpit ergonomics: 44px targets, dark matte, haptics, zero emoji | User touch/click | Haptic buzz, clean visual feedback, no mis-taps | Fallback when haptics unsupported | useHaptics.ts & CSS standards |

---

## 6. Edge Cases

| # | Feature | Input | Observed Behavior / Required Handling |
|---|---------|-------|----------------------------------------|
| 1 | Cross-Midnight Sleep | Bedtime "23:45", Wakeup "07:15" | Day boundary crossed: $(1440 - 1425) + 435 = 450\text{ mins} = 7.5\text{h}$. Properly identified as 7.5h duration. |
| 2 | Same-Day Morning Sleep | Bedtime "01:30", Wakeup "09:00" | Both in AM: $540 - 90 = 450\text{ mins} = 7.5\text{h}$. |
| 3 | Identical Bedtime & Wakeup | Bedtime "07:00", Wakeup "07:00" | Duration is 0 mins. Must display warning or clamp to valid range rather than treating as 24h sleep. |
| 4 | Hydration Zero / Negative | Stepper decrement when currentMl is 50ml and step is 100ml | `Math.max(0, currentMl - step)` clamps cleanly at 0ml without negative volume. |
| 5 | Hydration Overflow | User logs 4,500ml (target 3,500ml) | Ring stroke-dashoffset clamps at 0 (100% full circle). Display shows 4.5L / 3.5L (129% adherence). |
| 6 | Unlogged Historical Days in Horizon | 14D horizon selected, but user only logged 6 days | Missing days in `dailyRecords`: Sleep Debt accumulates 8.0h per missing day; Hydration counts as 0L; Clean Day counts as false; Pages count as 0. |
| 7 | Zero Total in DayBalanceRibbon | Sleep = 0h, Focus = 0h, Movement = 0h on an unlogged date | Rest hours defaults to 24h, total = 24h. Rest ribbon fills 100% bar without division by zero NaN. |
| 8 | Clean Day Reactive De-selection | User has all 4 markers checked (`cleanDay = true`), then unchecks `cleanDiet` | `cleanDay` reactively becomes `false`, streak decrements, and status updates immediately in UI and storage. |
| 9 | LocalStorage Migration from v4 | Existing storage has old `keystones: { bedMade: true, roomReset: false }` | `StorageService.getHabitsData()` merges `{ ...DEFAULT_HABITS, ...parsed, keystones: { ...DEFAULT_HABITS.keystones, ...parsed.keystones } }` to ensure `cleanDiet`, `zeroDoomscroll`, and `dailySupplements` are initialized safely without throwing undefined errors. |
| 10 | Rapid Multi-Tap Quick Add | User taps `+250ml` 4 times in under 1 second | Functional state updater `setVolume(prev => prev + 250)` guarantees all 4 clicks register accurately to 1,000ml. |

---

## 7. Caveats

1. **Attribution of Cross-Midnight Sleep**:
   - Sleep that starts at 23:30 on Sept 4 and wakes at 07:30 on Sept 5 can either be recorded on Sept 4 (the night) or Sept 5 (the waking morning).
   - In PulseSync OS convention, sleep logged on `selectedDate` represents the sleep that preceded the waking day (the restorative sleep for that date's energy bank).
2. **Backwards Compatibility**:
   - Existing users will have `pulsesync_habits_v4` in localStorage without `hydration` or with old `keystones` shape. The storage layer must provide robust defaults on hydration and keystones during hydration from JSON.
3. **No External Libraries Required**:
   - SVG rings and math calculations require zero third-party chart dependencies; standard SVG primitives and Lucide icons provide maximum performance with zero bundle bloat.

---

## 8. Conclusion

All 6 objective domains have been completely mined, formulated, and specified. The mathematical models (fluid dynamics, cross-midnight duration, accumulated sleep debt, dynamic horizon scaling) and behavioral contracts (Huberman morning sunlight anchor, Walker sleep architecture, Clear keystone clean day matrix) are mathematically airtight and fully mapped to the PulseSync OS UI architecture.

The engineering team can immediately execute the implementation across:
1. `src/types/index.ts`: Add `HydrationRecord`, update `KeystonesState`, `DailyHabitRecord`, and `HabitsData`.
2. `src/services/storage.ts`: Initialize `DEFAULT_HABITS` with hydration and updated keystones.
3. `src/components/habits/`: Create `HydrationCard.tsx`, revamp `SleepCard.tsx`, merge/revamp `KeystonesCard.tsx`, update `HabitsEngine.tsx`.
4. `src/components/overview/`: Create `HabitConsistencyMatrix.tsx`, `HabitsAdherenceLedger.tsx`, update `OverviewView.tsx` habits scorecards quad, synchronize `DayBalanceRibbon.tsx`.
5. `src/components/overview/MissedLogModals.tsx`: Revamp `EditHabitsModal.tsx` to edit all 4 pillars.
6. `scripts/verify_habits_integrity.mjs`: Programmatic test suite asserting 100% of these contracts.

---

## 9. Verification Method

To verify these specifications programmatically and visually:

1. **Programmatic Verification Suite**:
   Execute the verification runner:
   ```bash
   node --experimental-strip-types scripts/verify_habits_integrity.mjs
   ```
   The suite must assert:
   - Hydration math: quick adds (+250, +500), clamp at 0, volume formatting, SVG stroke-dashoffset at 0%, 50%, 100%, 129%.
   - Sleep duration math: cross-midnight (23:45 to 07:15 = 7.5h), same-day (01:30 to 09:00 = 7.5h), optimal window check.
   - Sleep debt formula: daily delta and accumulated deficit over 7D/14D/30D/90D.
   - Keystone Clean Day logic: 4/4 markers = true, 3/4 = false, streak calculation.
   - Horizon scaling: linear scaling of targets for 7D, 14D, 30D, 90D across all 4 scorecards.
   - DayBalanceRibbon feed: sleep hours correctly normalized into 24-hour bar.

2. **Visual & Ergonomic Audit**:
   - Dev server URL: `http://localhost:3002/`
   - Viewport: Mobile screen `390 × 844`
   - Inspect touch targets: All interactive elements have bounding box $\ge 44\text{px} \times 44\text{px}$.
   - Verify zero cartoon emojis in the DOM (only Lucide SVGs).
   - Test rapid 1-tap quick adds on Hydration card and verify instant SVG ring animation.
   - Test EditHabitsModal in Day Ledger historical view and confirm bidirectional state sync.

