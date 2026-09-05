# Original User Request

## 2026-09-05T13:15:46Z

Execute a comprehensive revamp of the Habits Engine, its Telemetry, and its Day Ledger integration in PulseSync OS into an elite, science-backed behavioral execution cockpit adhering to proven circadian protocols and industry benchmarks.

Requested team: Full autonomous team (Research, UI/UX Engineering, Day Ledger Sync, Test Engineer, and Chrome DevTools Visual Auditor)
Working directory: /Users/bharathnair/Projects/personal_projs/antigravity/pulsesync-os
Integrity mode: development
Target URL: http://localhost:3002/

## Requirements

### R1. Autonomous Deep Research & Benchmarking
Synthesize established behavioral science and circadian protocols (Matthew Walker sleep architecture & consistency; Andrew Huberman circadian light, temperature minimum & hydration timing; James Clear cue-friction loops) and reverse-engineer proven benchmark apps (Rise Science, Whoop, Streaks, Apple Health). Distill these into actionable metric models specifically tailored for PulseSync OS's dark matte local-first cockpit without fluff or arbitrary metric bloat.

### R2. Four Core Habit Execution Pillars
1. **Hydration / Fluid Dynamics**: Target-anchored daily fluid volume (default 3.5L target), rapid 1-tap micro-log quick adds (+250ml, +500ml), custom stepper adjustments, and an SVG progress gauge/ring with zero cartoon emojis.
2. **Circadian Sleep & Recovery**: Sleep duration, baseline target (7.5h–8.5h calibrated baseline), sleep/wake timestamp inputs, morning sunlight anchor (10m direct sunlight within 30m of waking), sleep debt calculation, and automatic feeding into the 24-Hour Circadian Day Balance ribbon in Day Ledger.
3. **Deep Reading & Knowledge**: Integrated bookshelf catalog, pages read today, session duration timer, and direct shelf navigation.
4. **Keystone Discipline & Clean Day Matrix**: Binary adherence markers (Clean Diet, Zero Doomscrolling / Reels, Daily Supplements, Bed Made / Room Reset) computing an immutable daily Clean Day status.

### R3. Overview Telemetry & Dynamic Horizon Scaling
In the Overview Telemetry tab under the Habits domain:
- **Target-Anchored Scorecards Quad**: Sleep Target / Debt, Clean Day Consistency Rate, Hydration Adherence, and Pages Read — each dynamically scaling their target baselines across 7D, 14D, 30D, and 90D timeframes.
- **Habit Consistency Matrix**: Multi-pillar 7-day adherence grid using dark matte Lucide SVG icons (no cartoon emojis) with aggregate consistency percentage score.
- **Habits Adherence Ledger**: High-signal baseline vs actual breakdown for all active habit pillars without redundant descriptive filler.

### R4. Day Ledger Bidirectional Integration & 24h Ribbon Synchronization
- Chronologically integrate habit receipts into the Day Ledger feed for any selected historical date (Sleep duration & timestamps, Hydration volume, Clean Day calibration, Pages Read).
- Provide a responsive EditHabitsModal in Day Ledger supporting full editing and historical backfilling for any past date with instant state synchronization.
- Dynamically synchronize with the DayBalanceRibbon so recorded sleep and rest hours accurately partition the 24-hour circadian bar.

### R5. Design & Ergonomic Standards (Pure Cockpit)
- Zero clutter, tactile steppers, and strict 44px minimum physical tap targets for all interactives.
- Strict Anti-AI-slop rule: Strictly no cartoon emojis (🔥, ⚡, 💧). Dark matte styling (#090d16, #0c101a, matte-card, border-white/10, font-mono tracking).
- Haptic tactile feedback (triggerHaptic) and instantaneous visual state updates.

## Acceptance Criteria

### Behavioral & Data Integrity
- [ ] Hydration module allows 1-tap quick adds (+250ml, +500ml) and custom adjustments, updating current volume and progress ring, and persisting to local storage.
- [ ] Sleep logs record bedtime, wake time, duration, and sunlight anchor, correctly calculating sleep delta against baseline.
- [ ] Clean Day status updates reactively based on keystone markers and persists in habits.dailyRecords[dateStr].
- [ ] Day Ledger feed displays habit status for selected date and allows editing via modal with instant synchronization.
- [ ] 24-Hour Circadian Day Balance ribbon accurately consumes the selected date's sleep duration.

### Telemetry & Horizon Scaling
- [ ] Overview Telemetry Habits tab displays 4 target-anchored scorecards whose goals and metrics dynamically scale across 7D, 14D, 30D, and 90D timeframes.
- [ ] Habit Consistency Matrix renders 7-day status across all pillars with clean Lucide icons and calculates consistency percentage.
- [ ] Habits Adherence Ledger provides clear baseline vs actual percentages with zero clutter.

### Verification & Quality Gate
- [ ] Programmatic verification suite (scripts/verify_habits_integrity.mjs) tests 100% of habit calculations, horizon scaling math, storage contracts, and Day Ledger ribbon feeds with a 100% pass rate.
- [ ] Visual auditor verifies live rendering at mobile viewport (390×844) on http://localhost:3002/, ensuring no layout shifts, full 44px touch targets, zero cartoon emojis, and clean matte styling.
