import * as math from '../../src/utils/habitsMath.ts';
import * as sync from '../../src/utils/habitsSync.ts';
import fs from 'node:fs';

console.log('Testing actual src/utils/habitsMath.ts and src/utils/habitsSync.ts...');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('FAIL:', msg);
  }
}

// 1. Cross-midnight sleep duration calculation `(1440 - Tb + Tw)` and 2-decimal rounding.
const dur1 = math.calculateSleepDuration('23:15', '07:15');
assert(dur1.durationHours === 8.0, `dur1 hours: expected 8.0, got ${dur1.durationHours}`);
assert(dur1.durationFormatted === '8h 00m', `dur1 formatted: expected 8h 00m, got ${dur1.durationFormatted}`);

const dur2 = math.calculateSleepDuration('01:30', '09:00');
assert(dur2.durationHours === 7.5, `dur2 hours: expected 7.5, got ${dur2.durationHours}`);
assert(dur2.durationFormatted === '7h 30m', `dur2 formatted: expected 7h 30m, got ${dur2.durationFormatted}`);

const dur3 = math.calculateSleepDuration('22:00', '06:15');
// 22:00 (1320) to 06:15 (375) -> (1440 - 1320) + 375 = 120 + 375 = 495 min = 8.25h
assert(dur3.durationHours === 8.25, `dur3 hours: expected 8.25, got ${dur3.durationHours}`);
assert(dur3.durationFormatted === '8h 15m', `dur3 formatted: expected 8h 15m, got ${dur3.durationFormatted}`);

// 2-decimal rounding check: 23:00 to 06:20 -> 440 mins / 60 = 7.33333... -> 7.33
const dur4 = math.calculateSleepDuration('23:00', '06:20');
assert(dur4.durationHours === 7.33, `dur4 hours: expected 7.33, got ${dur4.durationHours}`);
assert(dur4.durationFormatted === '7h 20m', `dur4 formatted: expected 7h 20m, got ${dur4.durationFormatted}`);

// Edge case: Tb === Tw
const durSame = math.calculateSleepDuration('07:00', '07:00');
assert(durSame.durationHours === 0, `durSame hours: expected 0, got ${durSame.durationHours}`);
assert(durSame.durationMinutes === 0, `durSame minutes: expected 0, got ${durSame.durationMinutes}`);

// Edge case: null/undefined
const durNull = math.calculateSleepDuration(null, null);
assert(durNull.durationHours === 0, `durNull hours: expected 0, got ${durNull.durationHours}`);

// 2. Matthew Walker sleep debt accumulator against 8.0h baseline.
const debt1 = math.calculateDailySleepDebt(6.5, 8.0);
assert(debt1 === 1.5, `debt1: expected 1.5, got ${debt1}`);

const debt2 = math.calculateDailySleepDebt(8.5, 8.0);
assert(debt2 === 0, `debt2: expected 0, got ${debt2}`);

const records = [{ sleepDurationHours: 6.5 }, { sleepDurationHours: 7.0 }, { sleepDurationHours: 8.5 }];
const debtRes = math.calculateSleepDebt(records, 8.0);
assert(debtRes.accumulatedDebt === 2.5, `debtRes: expected 2.5, got ${debtRes.accumulatedDebt}`);
// net balance: (6.5-8) + (7.0-8) + (8.5-8) = -1.5 - 1.0 + 0.5 = -2.0
assert(debtRes.netBalance === -2.0, `netBalance: expected -2.0, got ${debtRes.netBalance}`);

// Missing record in evaluated horizon:
const unloggedDebt = math.calculateSleepDebt([null, { sleepDurationHours: 0 }], 8.0);
assert(unloggedDebt.accumulatedDebt === 16.0, `unloggedDebt: expected 16.0, got ${unloggedDebt.accumulatedDebt}`);

// 3. Clean Day reactive logic: exactly `cleanDiet && zeroDoomscroll && dailySupplements && bedMade`.
assert(math.evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: true }) === true, 'clean day 4/4');
assert(math.evaluateCleanDay({ cleanDiet: false, zeroDoomscroll: true, dailySupplements: true, bedMade: true }) === false, 'missing cleanDiet');
assert(math.evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: false, dailySupplements: true, bedMade: true }) === false, 'missing zeroDoomscroll');
assert(math.evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: false, bedMade: true }) === false, 'missing dailySupplements');
assert(math.evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: false }) === false, 'missing bedMade');
// Does roomReset affect cleanDay?
assert(math.evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: true, roomReset: false }) === true, 'roomReset false does not break cleanDay');

// In sync.isCleanDay:
assert(sync.isCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: true }) === true, 'sync.isCleanDay 4/4');
assert(sync.isCleanDay({ cleanDiet: false, zeroDoomscroll: true, dailySupplements: true, bedMade: true }) === false, 'sync.isCleanDay missing diet');

// 4. Backward unbroken Clean Day streak calculation and 5-tier classification.
assert(math.classifyCleanStreakTier(0) === 'Calibrated', 'tier 0');
assert(math.classifyCleanStreakTier(6) === 'Calibrated', 'tier 6');
assert(math.classifyCleanStreakTier(7) === 'Disciplined', 'tier 7');
assert(math.classifyCleanStreakTier(13) === 'Disciplined', 'tier 13');
assert(math.classifyCleanStreakTier(14) === 'Fortified', 'tier 14');
assert(math.classifyCleanStreakTier(29) === 'Fortified', 'tier 29');
assert(math.classifyCleanStreakTier(30) === 'Unbreakable', 'tier 30');
assert(math.classifyCleanStreakTier(89) === 'Unbreakable', 'tier 89');
assert(math.classifyCleanStreakTier(90) === 'Sovereign', 'tier 90');
assert(math.classifyCleanStreakTier(120) === 'Sovereign', 'tier 120');

// calculateCleanStreak
const testRecords = {
  '2026-09-05': { cleanDay: true },
  '2026-09-04': { cleanDay: true },
  '2026-09-03': { cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: true }, // evaluated clean
  '2026-09-02': { cleanDay: false },
  '2026-09-01': { cleanDay: true },
};
const streak1 = math.calculateCleanStreak(testRecords, '2026-09-05');
assert(streak1 === 3, `streak1: expected 3, got ${streak1}`);

const streakSync = sync.calculateConsecutiveCleanDays(testRecords, '2026-09-05');
assert(streakSync === 3, `streakSync: expected 3, got ${streakSync}`);

// 5. Hydration volume, adherence %, and SVG circular progress ring geometry (r=50, C=314.159).
assert(math.HYDRATION_RING_RADIUS === 50, 'r=50');
assert(Math.abs(math.HYDRATION_CIRCUMFERENCE - 314.159265) < 0.001, 'C=314.159');

const h0 = math.calculateHydrationStats(0, 3500);
assert(Math.abs(h0.strokeDashoffset - 314.159) < 0.01, `h0 offset: expected 314.159, got ${h0.strokeDashoffset}`);
assert(h0.progressPercent === 0, 'h0 pct 0');

const h50 = math.calculateHydrationStats(1750, 3500);
assert(Math.abs(h50.strokeDashoffset - 157.08) < 0.02, `h50 offset: expected 157.08, got ${h50.strokeDashoffset}`);
assert(h50.progressPercent === 50, 'h50 pct 50');

const h100 = math.calculateHydrationStats(3500, 3500);
assert(h100.strokeDashoffset === 0, `h100 offset: expected 0, got ${h100.strokeDashoffset}`);
assert(h100.progressPercent === 100, 'h100 pct 100');

const hOver = math.calculateHydrationStats(5000, 3500);
assert(hOver.strokeDashoffset === 0, `hOver offset: expected 0, got ${hOver.strokeDashoffset}`);
assert(hOver.progressPercent === 100, `hOver pct: expected 100 (clamped), got ${hOver.progressPercent}`);
assert(hOver.adherenceRatio === 1.429, `hOver ratio: expected 1.429, got ${hOver.adherenceRatio}`);

// 6. Dynamic Horizon Scaling for the 4 Scorecards across 7D, 14D, 30D, 90D.
const quad7 = math.computeHabitsScorecards({}, 7, '2026-09-05');
assert(quad7.sleep.target === 56.0, `7D sleep target: expected 56.0, got ${quad7.sleep.target}`);
assert(quad7.cleanDays.target === 7, `7D clean target: expected 7, got ${quad7.cleanDays.target}`);
assert(quad7.hydration.target === 24.5, `7D hyd target: expected 24.5, got ${quad7.hydration.target}`);
assert(quad7.reading.target === 140, `7D read target: expected 140, got ${quad7.reading.target}`);

const quad14 = math.computeHabitsScorecards({}, 14, '2026-09-05');
assert(quad14.sleep.target === 112.0, `14D sleep target: expected 112.0, got ${quad14.sleep.target}`);
assert(quad14.cleanDays.target === 14, `14D clean target: expected 14, got ${quad14.cleanDays.target}`);
assert(quad14.hydration.target === 49.0, `14D hyd target: expected 49.0, got ${quad14.hydration.target}`);
assert(quad14.reading.target === 280, `14D read target: expected 280, got ${quad14.reading.target}`);

const quad30 = math.computeHabitsScorecards({}, 30, '2026-09-05');
assert(quad30.sleep.target === 240.0, `30D sleep target: expected 240.0, got ${quad30.sleep.target}`);
assert(quad30.cleanDays.target === 30, `30D clean target: expected 30, got ${quad30.cleanDays.target}`);
assert(quad30.hydration.target === 105.0, `30D hyd target: expected 105.0, got ${quad30.hydration.target}`);
assert(quad30.reading.target === 600, `30D read target: expected 600, got ${quad30.reading.target}`);

const quad90 = math.computeHabitsScorecards({}, 90, '2026-09-05');
assert(quad90.sleep.target === 720.0, `90D sleep target: expected 720.0, got ${quad90.sleep.target}`);
assert(quad90.cleanDays.target === 90, `90D clean target: expected 90, got ${quad90.cleanDays.target}`);
assert(quad90.hydration.target === 315.0, `90D hyd target: expected 315.0, got ${quad90.hydration.target}`);
assert(quad90.reading.target === 1800, `90D read target: expected 1800, got ${quad90.reading.target}`);

console.log(`Passed: ${passed}, Failed: ${failed}`);
