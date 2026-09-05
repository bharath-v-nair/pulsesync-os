import {
  calculateSleepDuration,
  parseTimeToMinutes,
  parseSleepDuration,
  isSleepOptimal,
  classifyCircadianPhase,
  calculateDailySleepDelta,
  calculateDailySleepDebt,
  calculateSleepDebt,
  evaluateCleanDay,
  countCleanMarkers,
  classifyCleanStreakTier,
  getCleanDayTierInfo,
  calculateCleanStreak,
  calculateHydrationStats,
  applyHydrationQuickAdd,
  applyHydrationStep,
  getHorizonDates,
  computeHabitsScorecards,
  evaluatePillarStatus,
  evaluateConsistencyMatrix,
  computeAdherenceLedger,
  calculateReadingStats,
  computeDayBalanceRibbon,
  containsBannedEmojis,
  auditTapTargetSize,
} from '../../src/utils/habitsMath.ts';

import {
  migrateHabitsData,
  DEFAULT_HABITS,
} from '../../src/services/storage.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(testName, passed, details = null) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    failedTests++;
    failures.push({ testName, details });
    console.error(`[FAIL] ${testName}`, details ? JSON.stringify(details) : '');
  }
}

function assertNoNaN(val, path = '') {
  if (typeof val === 'number') {
    if (isNaN(val)) return false;
  } else if (val && typeof val === 'object') {
    for (const [k, v] of Object.entries(val)) {
      if (!assertNoNaN(v, `${path}.${k}`)) return false;
    }
  }
  return true;
}

console.log('======================================================================');
console.log('M1 EMPIRICAL BOUNDARY STRESS TEST HARNESS');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// 1. HYDRATION BOUNDARIES
// ----------------------------------------------------------------------------
console.log('--- 1. Hydration Boundaries ---');

// 1.1 0ml input
{
  const res = calculateHydrationStats(0, 3500);
  check('1.1 Hydration 0ml: currentMl is 0', res.currentMl === 0);
  check('1.1 Hydration 0ml: progressPercent is 0', res.progressPercent === 0);
  check('1.1 Hydration 0ml: adherenceRatio is 0', res.adherenceRatio === 0);
  check('1.1 Hydration 0ml: remainingMl is 3500', res.remainingMl === 3500);
  check('1.1 Hydration 0ml: strokeDashoffset is 314.159', Math.abs(res.strokeDashoffset - 314.159) < 0.01);
  check('1.1 Hydration 0ml: no NaN', assertNoNaN(res));
}

// 1.2 Negative ml input
{
  const res = calculateHydrationStats(-500, 3500);
  check('1.2 Hydration -500ml: clamped to 0', res.currentMl === 0);
  check('1.2 Hydration -500ml: progressPercent is 0', res.progressPercent === 0);
  check('1.2 Hydration -500ml: remainingMl is 3500', res.remainingMl === 3500);
  check('1.2 Hydration -500ml: volumeLiters is "0.00L"', res.volumeLiters === '0.00L');
  check('1.2 Hydration -500ml: no NaN', assertNoNaN(res));
}

// 1.3 Massive 100,000ml overflow
{
  const res = calculateHydrationStats(100000, 3500);
  check('1.3 Hydration 100,000ml: currentMl preserved', res.currentMl === 100000);
  check('1.3 Hydration 100,000ml: progressPercent clamped to 100', res.progressPercent === 100);
  check('1.3 Hydration 100,000ml: remainingMl clamped to 0', res.remainingMl === 0);
  check('1.3 Hydration 100,000ml: strokeDashoffset is 0', res.strokeDashoffset === 0);
  check('1.3 Hydration 100,000ml: volumeLiters is "100.00L"', res.volumeLiters === '100.00L');
  check('1.3 Hydration 100,000ml: adherenceRatio is 28.571', res.adherenceRatio === 28.571);
  check('1.3 Hydration 100,000ml: no NaN', assertNoNaN(res));
}

// 1.4 Floating point rounding
{
  const res = calculateHydrationStats(0.1 + 0.2, 3500);
  check('1.4 Hydration float 0.1+0.2: no NaN', assertNoNaN(res));
  check('1.4 Hydration float 0.1+0.2: progressPercent is 0', res.progressPercent === 0);
  check('1.4 Hydration float 0.1+0.2: volumeLiters is "0.00L"', res.volumeLiters === '0.00L');

  const res2 = calculateHydrationStats(3333.3333333, 3500);
  check('1.4 Hydration float repeating: no NaN', assertNoNaN(res2));
  check('1.4 Hydration float repeating: volumeLiters is "3.33L"', res2.volumeLiters === '3.33L');
  check('1.4 Hydration float repeating: adherenceRatio is 0.952', res2.adherenceRatio === 0.952);
}

// 1.5 TargetMl boundary cases (0, negative, NaN, undefined, null)
{
  const resZeroTarget = calculateHydrationStats(500, 0);
  check('1.5 Hydration target 0: target clamped >= 1', resZeroTarget.targetMl >= 1);
  check('1.5 Hydration target 0: no NaN', assertNoNaN(resZeroTarget));

  const resNegTarget = calculateHydrationStats(500, -1000);
  check('1.5 Hydration target -1000: target clamped >= 1', resNegTarget.targetMl >= 1);
  check('1.5 Hydration target -1000: no NaN', assertNoNaN(resNegTarget));

  const resNanTarget = calculateHydrationStats(500, NaN);
  check('1.5 Hydration target NaN: falls back to default 3500', resNanTarget.targetMl === 3500);
  check('1.5 Hydration target NaN: no NaN', assertNoNaN(resNanTarget));

  const resNullCurrent = calculateHydrationStats(null, 3500);
  check('1.5 Hydration current null: defaults to 0', resNullCurrent.currentMl === 0);
  check('1.5 Hydration current null: no NaN', assertNoNaN(resNullCurrent));

  const resNanCurrent = calculateHydrationStats(NaN, 3500);
  check('1.5 Hydration current NaN: defaults to 0', resNanCurrent.currentMl === 0);
  check('1.5 Hydration current NaN: no NaN', assertNoNaN(resNanCurrent));
}

// 1.6 Quick adds and Steppers boundaries
{
  check('1.6 QuickAdd negative add clamped: 0', applyHydrationQuickAdd(1000, -500) === 1000);
  check('1.6 QuickAdd negative base clamped: 500', applyHydrationQuickAdd(-200, 500) === 500);
  check('1.6 QuickAdd upper bound 8000 clamped', applyHydrationQuickAdd(7800, 500) === 8000);
  check('1.6 Step negative delta clamped >= 0', applyHydrationStep(200, -500) === 0);
  check('1.6 Step upper bound clamped <= 8000', applyHydrationStep(7900, 250) === 8000);
  check('1.6 Step float precision delta', applyHydrationStep(1000, 250.55) === 1250.55);
}

// ----------------------------------------------------------------------------
// 2. SLEEP BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n--- 2. Sleep Boundaries ---');

// 2.1 23:59 bedtime to 00:00 wakeup (cross midnight, 1 minute)
{
  const res = calculateSleepDuration('23:59', '00:00');
  check('2.1 Cross midnight 23:59->00:00: durationMinutes is 1', res.durationMinutes === 1);
  check('2.1 Cross midnight 23:59->00:00: durationHours is 0.02', res.durationHours === 0.02);
  check('2.1 Cross midnight 23:59->00:00: durationFormatted is "0h 01m"', res.durationFormatted === '0h 01m');
  check('2.1 Cross midnight 23:59->00:00: no NaN', assertNoNaN(res));
}

// 2.2 Identical bedtime and wakeup (0 minutes duration)
{
  const res1 = calculateSleepDuration('23:15', '23:15');
  check('2.2 Identical 23:15->23:15: durationMinutes is 0', res1.durationMinutes === 0);
  check('2.2 Identical 23:15->23:15: durationHours is 0.0', res1.durationHours === 0.0);
  check('2.2 Identical 23:15->23:15: durationFormatted is "0h 00m"', res1.durationFormatted === '0h 00m');

  const res2 = calculateSleepDuration('00:00', '00:00');
  check('2.2 Identical 00:00->00:00: durationMinutes is 0', res2.durationMinutes === 0);
  check('2.2 Identical 00:00->00:00: durationFormatted is "0h 00m"', res2.durationFormatted === '0h 00m');
}

// 2.3 Invalid string formats
{
  const resEmpty = calculateSleepDuration('', '');
  check('2.3 Invalid empty strings: returns 0 duration', resEmpty.durationMinutes === 0 && resEmpty.durationFormatted === '0h 00m');

  const resInvalidText = calculateSleepDuration('bad_time', 'nonsense');
  check('2.3 Invalid text strings: returns 0 duration', resInvalidText.durationMinutes === 0 && resInvalidText.durationFormatted === '0h 00m');

  const resPartial1 = calculateSleepDuration('12:', ':30');
  check('2.3 Partial strings "12:" and ":30": handled without crash', resPartial1.durationMinutes === 0);

  const resOutOfRange = calculateSleepDuration('25:00', '08:00');
  check('2.3 Out of range "25:00": wrapped modulo 1440', resOutOfRange.durationMinutes === 420); // 25:00 -> 01:00, to 08:00 -> 7h (420m)

  const resNegativeTime = calculateSleepDuration('-01:-30', '08:00');
  check('2.3 Negative time string "-01:-30": parsed without crash', typeof resNegativeTime.durationMinutes === 'number' && !isNaN(resNegativeTime.durationMinutes));

  const resNullWakeup = calculateSleepDuration('23:00', null);
  check('2.3 Null wakeup: returns 0 duration', resNullWakeup.durationMinutes === 0);

  const resUndefinedBedtime = calculateSleepDuration(undefined, '07:00');
  check('2.3 Undefined bedtime: returns 0 duration', resUndefinedBedtime.durationMinutes === 0);
}

// 2.4 Sleep duration exceeding 24h & parsed formats
{
  const parsedNormal = parseSleepDuration('8h 30m');
  check('2.4 Parse "8h 30m": 8.5', parsedNormal === 8.5);

  const parsedExcessive = parseSleepDuration('36h 45m');
  check('2.4 Parse excessive "36h 45m": 36.75', parsedExcessive === 36.75);

  const parsedInvalid = parseSleepDuration('invalid');
  check('2.4 Parse "invalid": 0', parsedInvalid === 0);

  const parsedNull = parseSleepDuration(null);
  check('2.4 Parse null: 0', parsedNull === 0);

  const deltaExcessive = calculateDailySleepDelta(28.0, 8.0);
  check('2.4 Daily delta for 28.0h: +20.0', deltaExcessive === 20.0);

  const debtExcessive = calculateDailySleepDebt(28.0, 8.0);
  check('2.4 Daily debt for 28.0h: 0.0', debtExcessive === 0.0);
}

// 2.5 Sleep debt accumulation robustness
{
  const emptyDebt = calculateSleepDebt([]);
  check('2.5 Sleep debt empty list: 0 debt, 0 balance, 0 days', emptyDebt.accumulatedDebt === 0 && emptyDebt.daysEvaluated === 0);

  const mixedList = [
    { sleepDurationHours: 6.0 }, // 2.0 debt, -2.0 balance
    8.0,                         // 0.0 debt, 0.0 balance
    undefined,                   // 8.0 debt, -8.0 balance
    null,                        // 8.0 debt, -8.0 balance
    { sleepDurationHours: NaN }, // 8.0 debt, -8.0 balance
    { sleepDurationHours: 10.0 },// 0.0 debt, +2.0 balance
  ];
  const debtRes = calculateSleepDebt(mixedList, 8.0);
  check('2.5 Sleep debt mixed invalid items: no NaN', assertNoNaN(debtRes));
  check('2.5 Sleep debt accumulated correctly', debtRes.accumulatedDebt === 26.0); // 2 + 0 + 8 + 8 + 8 + 0 = 26
  check('2.5 Sleep debt net balance correctly', debtRes.netBalance === -24.0);     // -2 + 0 - 8 - 8 - 8 + 2 = -24
  check('2.5 Sleep debt daysEvaluated is 6', debtRes.daysEvaluated === 6);
}

// 2.6 Circadian phase edge cases
{
  check('2.6 Circadian phase short duration: "short"', classifyCircadianPhase('23:00', 5.0) === 'short');
  check('2.6 Circadian phase optimal window: "optimal"', classifyCircadianPhase('22:30', 8.0) === 'optimal');
  check('2.6 Circadian phase delayed: "delayed"', classifyCircadianPhase('01:30', 8.0) === 'delayed');
  check('2.6 Circadian phase shifted: "shifted"', classifyCircadianPhase('03:30', 8.0) === 'shifted');
  check('2.6 Circadian phase null inputs: no crash', typeof classifyCircadianPhase(null, null) === 'string');
  check('2.6 Circadian phase NaN duration: no crash', typeof classifyCircadianPhase('23:00', NaN) === 'string');
}

// ----------------------------------------------------------------------------
// 3. STORAGE MIGRATION BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n--- 3. Storage Migration Boundaries ---');

// 3.1 Null, undefined, primitive, empty object
{
  const fromNull = migrateHabitsData(null);
  check('3.1 Migrate null: returns default structure', fromNull && typeof fromNull === 'object');
  check('3.1 Migrate null: hydration target is 3500', fromNull.hydration.targetMl === 3500);
  check('3.1 Migrate null: sleep baseline is 8.0', fromNull.sleep.sleepDurationHours === 8.0);
  check('3.1 Migrate null: no NaN', assertNoNaN(fromNull));

  const fromUndefined = migrateHabitsData(undefined);
  check('3.1 Migrate undefined: returns default structure', fromUndefined && typeof fromUndefined === 'object');
  check('3.1 Migrate undefined: no NaN', assertNoNaN(fromUndefined));

  const fromNumber = migrateHabitsData(12345);
  check('3.1 Migrate primitive number: returns default structure', fromNumber && typeof fromNumber === 'object');
  check('3.1 Migrate primitive number: no NaN', assertNoNaN(fromNumber));

  const fromString = migrateHabitsData('{"corrupted": true}');
  check('3.1 Migrate string: returns default structure', fromString && typeof fromString === 'object');
  check('3.1 Migrate string: no NaN', assertNoNaN(fromString));

  const fromEmpty = migrateHabitsData({});
  check('3.1 Migrate empty object {}: hydration exists', fromEmpty.hydration && fromEmpty.hydration.currentMl === 0);
  check('3.1 Migrate empty object {}: sleep exists', fromEmpty.sleep && fromEmpty.sleep.sleepDurationHours === 8.0);
  check('3.1 Migrate empty object {}: keystones exist', fromEmpty.keystones && typeof fromEmpty.keystones.cleanDiet === 'boolean');
  check('3.1 Migrate empty object {}: reading exists', fromEmpty.reading && Array.isArray(fromEmpty.reading.books));
  check('3.1 Migrate empty object {}: dailyRecords exists', fromEmpty.dailyRecords && typeof fromEmpty.dailyRecords === 'object');
  check('3.1 Migrate empty object {}: no NaN', assertNoNaN(fromEmpty));
}

// 3.2 Legacy object lacking hydration or keystones
{
  const legacyBlob = {
    sleep: {
      bedtimeRaw: '22:30',
      wakeupRaw: '06:30',
      sleepDuration: '8h 00m',
      sleepDurationHours: 8.0,
      sunlightDone: true,
    },
    detox: {
      cleanDays: 12,
      tierName: 'Disciplined',
      cleanDiet: true,
      zeroReels: true, // legacy property name
      noPhoneInBed: true,
      dailySupplements: true,
      bedMade: true,
    },
    reading: {
      activeBookId: 'book_1',
      startPage: 10,
      endPage: 30,
      pagesReadToday: 20,
    },
    // lacking hydration and keystones entirely
  };

  const migrated = migrateHabitsData(legacyBlob);
  check('3.2 Legacy lacking hydration: populated with defaults', migrated.hydration.targetMl === 3500 && migrated.hydration.currentMl === 0);
  check('3.2 Legacy lacking keystones: cleanDiet mapped', migrated.keystones.cleanDiet === true);
  check('3.2 Legacy zeroReels mapped to zeroDoomscroll', migrated.keystones.zeroDoomscroll === true);
  check('3.2 Legacy lacking keystones: bedMade mapped', migrated.keystones.bedMade === true);
  check('3.2 Legacy lacking keystones: roomReset has default', typeof migrated.keystones.roomReset === 'boolean');
  check('3.2 Legacy sleep preserved', migrated.sleep.bedtimeRaw === '22:30' && migrated.sleep.sunlightDone === true);
  check('3.2 Legacy reading preserved', migrated.reading.pagesReadToday === 20);
  check('3.2 Legacy no NaN anywhere', assertNoNaN(migrated));
}

// 3.3 Corrupted dailyRecords (null entries, primitives, NaNs, missing fields)
{
  const corruptedBlob = {
    dailyRecords: {
      'null-record': null,
      'undefined-record': undefined,
      'string-record': 'malformed',
      'number-record': 9999,
      'nan-fields-record': {
        sleepDurationHours: NaN,
        sleepMinutes: NaN,
        hydrationMl: NaN,
        hydrationCurrentMl: NaN,
        hydrationTargetMl: NaN,
        pagesRead: NaN,
        readingMinutes: NaN,
      },
      'empty-fields-record': {},
      'valid-record': {
        sleepDurationHours: 7.5,
        bedtimeRaw: '23:00',
        wakeupRaw: '06:30',
        hydrationCurrentMl: 3500,
        cleanDay: true,
      },
    },
  };

  const migrated = migrateHabitsData(corruptedBlob);
  check('3.3 Corrupted dailyRecords: null skipped', migrated.dailyRecords['null-record'] === undefined);
  check('3.3 Corrupted dailyRecords: primitive skipped', migrated.dailyRecords['string-record'] === undefined);
  check('3.3 Corrupted dailyRecords: empty-fields-record defaulted', migrated.dailyRecords['empty-fields-record'].sleepDurationHours === 8.0);
  check('3.3 Corrupted dailyRecords: valid-record preserved', migrated.dailyRecords['valid-record'].sleepDurationHours === 7.5);

  const nanRec = migrated.dailyRecords['nan-fields-record'];
  check('3.3 Corrupted dailyRecords: nan-record durHours defaulted to 8.0', nanRec.sleepDurationHours === 8.0);
  check('3.3 Corrupted dailyRecords: nan-record durFormatted is "8h 00m"', nanRec.sleepDuration === '8h 00m');
  check('3.3 Corrupted dailyRecords: nan-record hydMl is undefined (not NaN)', nanRec.hydrationMl === undefined);
  check('3.3 Corrupted dailyRecords: nan-record pagesRead is undefined (not NaN)', nanRec.pagesRead === undefined);

  // Check if NaN leaked into sleepMinutes, hydrationTargetMl, or readingMinutes
  const sleepMinutesNoNaN = typeof nanRec.sleepMinutes !== 'number' || !isNaN(nanRec.sleepMinutes);
  const hydTargetNoNaN = typeof nanRec.hydrationTargetMl !== 'number' || !isNaN(nanRec.hydrationTargetMl);
  const readingMinsNoNaN = typeof nanRec.readingMinutes !== 'number' || !isNaN(nanRec.readingMinutes);
  check('3.3 Corrupted dailyRecords: sleepMinutes is NOT NaN', sleepMinutesNoNaN, { val: nanRec.sleepMinutes });
  check('3.3 Corrupted dailyRecords: hydrationTargetMl is NOT NaN', hydTargetNoNaN, { val: nanRec.hydrationTargetMl });
  check('3.3 Corrupted dailyRecords: readingMinutes is NOT NaN', readingMinsNoNaN, { val: nanRec.readingMinutes });
  check('3.3 Corrupted dailyRecords: overall no NaN leak in migrated structure', assertNoNaN(migrated));
}

// ----------------------------------------------------------------------------
// 4. KEYSTONE & CLEAN STREAK BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n--- 4. Keystone & Clean Streak Boundaries ---');

{
  check('4.1 evaluateCleanDay null: false', evaluateCleanDay(null) === false);
  check('4.1 evaluateCleanDay undefined: false', evaluateCleanDay(undefined) === false);
  check('4.1 evaluateCleanDay empty {}: false', evaluateCleanDay({}) === false);
  check('4.1 evaluateCleanDay non-boolean "yes": false', evaluateCleanDay({ cleanDiet: 'yes', zeroDoomscroll: true, dailySupplements: true, bedMade: true }) === false);
  check('4.1 evaluateCleanDay 3/4 true: false', evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: false }) === false);
  check('4.1 evaluateCleanDay 4/4 true: true', evaluateCleanDay({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: true }) === true);

  check('4.2 countCleanMarkers null: 0', countCleanMarkers(null) === 0);
  check('4.2 countCleanMarkers partial 3: 3', countCleanMarkers({ cleanDiet: true, zeroDoomscroll: true, dailySupplements: true, bedMade: false }) === 3);

  check('4.3 Tier negative streak: Calibrated', classifyCleanStreakTier(-5) === 'Calibrated');
  check('4.3 Tier 0: Calibrated', classifyCleanStreakTier(0) === 'Calibrated');
  check('4.3 Tier 6: Calibrated', classifyCleanStreakTier(6) === 'Calibrated');
  check('4.3 Tier 7: Disciplined', classifyCleanStreakTier(7) === 'Disciplined');
  check('4.3 Tier 13: Disciplined', classifyCleanStreakTier(13) === 'Disciplined');
  check('4.3 Tier 14: Fortified', classifyCleanStreakTier(14) === 'Fortified');
  check('4.3 Tier 29: Fortified', classifyCleanStreakTier(29) === 'Fortified');
  check('4.3 Tier 30: Unbreakable', classifyCleanStreakTier(30) === 'Unbreakable');
  check('4.3 Tier 89: Unbreakable', classifyCleanStreakTier(89) === 'Unbreakable');
  check('4.3 Tier 90: Sovereign', classifyCleanStreakTier(90) === 'Sovereign');
  check('4.3 Tier 1000: Sovereign', classifyCleanStreakTier(1000) === 'Sovereign');

  const tierInfo90 = getCleanDayTierInfo(90);
  check('4.4 Tier info Sovereign nextTierDays is null', tierInfo90.nextTierDays === null);
  check('4.4 Tier info Sovereign daysToNextTier is 0', tierInfo90.daysToNextTier === 0);

  const tierInfo10 = getCleanDayTierInfo(10);
  check('4.4 Tier info Disciplined daysToNextTier is 4 (14-10)', tierInfo10.daysToNextTier === 4);

  check('4.5 Streak calc invalid date: returns 0', calculateCleanStreak({}, 'invalid-date') === 0);
  check('4.5 Streak calc null date: returns 0', calculateCleanStreak({}, null) === 0);
  check('4.5 Streak calc null map: returns 0', calculateCleanStreak(null, '2026-09-05') === 0);
}

// ----------------------------------------------------------------------------
// 5. HORIZON SCALING & LEDGER BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n--- 5. Horizon Scaling & Ledger Boundaries ---');

{
  const dates7 = getHorizonDates(7, '2026-09-05');
  check('5.1 getHorizonDates returns 7 dates', dates7.length === 7);
  check('5.1 getHorizonDates anchor is 2026-09-05', dates7[0] === '2026-09-05');
  check('5.1 getHorizonDates end is 2026-08-30', dates7[6] === '2026-08-30');

  const scorecardsEmpty = computeHabitsScorecards({}, 7, '2026-09-05');
  check('5.2 Scorecards empty map: no NaN', assertNoNaN(scorecardsEmpty));
  check('5.2 Scorecards empty map: sleep target 56h', scorecardsEmpty.sleep.target === 56.0);
  check('5.2 Scorecards empty map: sleep actual 0h', scorecardsEmpty.sleep.actual === 0);
  check('5.2 Scorecards empty map: sleep debt 56h', scorecardsEmpty.sleep.debt === 56.0);
  check('5.2 Scorecards empty map: sleep pct 0%', scorecardsEmpty.sleep.pct === 0);
  check('5.2 Scorecards empty map: clean days target 7', scorecardsEmpty.cleanDays.target === 7);

  const scorecardsZeroTimeframe = computeHabitsScorecards({}, 0, '2026-09-05');
  check('5.3 Scorecards timeframe 0: no NaN', assertNoNaN(scorecardsZeroTimeframe));
  check('5.3 Scorecards timeframe 0: sleep pct 0', scorecardsZeroTimeframe.sleep.pct === 0);

  const matrixEmpty = evaluateConsistencyMatrix({}, '2026-09-05');
  check('5.4 Matrix empty map: 7 days returned', matrixEmpty.days.length === 7);
  check('5.4 Matrix empty map: scorePct is 0', matrixEmpty.scorePct === 0);
  check('5.4 Matrix empty map: noneCount is 35', matrixEmpty.noneCount === 35);
  check('5.4 Matrix empty map: no NaN', assertNoNaN(matrixEmpty));

  const ledgerEmpty = computeAdherenceLedger({}, 7, 'baseline', '2026-09-05');
  check('5.5 Ledger empty map: 5 benchmark rows', ledgerEmpty.rows.length === 5);
  check('5.5 Ledger empty map: metCount is 0', ledgerEmpty.metCount === 0);
  check('5.5 Ledger empty map: adherenceRate is 0', ledgerEmpty.adherenceRate === 0);
  check('5.5 Ledger empty map: no NaN', assertNoNaN(ledgerEmpty));
}

// ----------------------------------------------------------------------------
// 6. DAY BALANCE RIBBON & READING BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n--- 6. Day Balance Ribbon & Reading Boundaries ---');

{
  // Normal 8.0h sleep, 4.0h focus, 1.0h movement
  const ribbonNormal = computeDayBalanceRibbon(8.0, 4.0, 1.0);
  check('6.1 Ribbon normal: sleep 8h', ribbonNormal.sleepHours === 8.0);
  check('6.1 Ribbon normal: rest 11h (24 - 13)', ribbonNormal.restHours === 11.0);
  check('6.1 Ribbon normal: totalPct is 100', ribbonNormal.totalPct === 100);
  check('6.1 Ribbon normal: no NaN', assertNoNaN(ribbonNormal));

  // Extreme >24h sleep duration
  const ribbonExcessive = computeDayBalanceRibbon(28.0, 2.0, 1.0);
  check('6.2 Ribbon >24h: restHours clamped to minimum 1.0h', ribbonExcessive.restHours === 1.0);
  check('6.2 Ribbon >24h: total is 32.0h', ribbonExcessive.total === 32.0);
  check('6.2 Ribbon >24h: totalPct is 100', ribbonExcessive.totalPct === 100);
  check('6.2 Ribbon >24h: no NaN', assertNoNaN(ribbonExcessive));

  // Undefined and null inputs
  const ribbonNull = computeDayBalanceRibbon(null, null, null);
  check('6.3 Ribbon null inputs: defaults sleep to 8.0h', ribbonNull.sleepHours === 8.0);
  check('6.3 Ribbon null inputs: totalPct is 100', ribbonNull.totalPct === 100);
  check('6.3 Ribbon null inputs: no NaN', assertNoNaN(ribbonNull));

  // NaN inputs to computeDayBalanceRibbon
  const ribbonNaN = computeDayBalanceRibbon(NaN, NaN, NaN);
  const ribbonNaNLeaks = !assertNoNaN(ribbonNaN);
  check('6.4 Ribbon NaN inputs: does NOT leak NaN', !ribbonNaNLeaks, {
    sleepHours: ribbonNaN.sleepHours,
    sleepPct: ribbonNaN.sleepPct,
    total: ribbonNaN.total
  });

  // Reading stats boundaries
  const readingNormal = calculateReadingStats({ currentPage: 50, totalPages: 100 }, 20, 50);
  check('6.5 Reading normal: pagesReadToday is 30', readingNormal.pagesReadToday === 30);
  check('6.5 Reading normal: bookProgressPercent is 50', readingNormal.bookProgressPercent === 50);

  const readingNull = calculateReadingStats(null, null, null);
  check('6.6 Reading null inputs: pagesReadToday is 0', readingNull.pagesReadToday === 0);
  check('6.6 Reading null inputs: bookProgressPercent is 0', readingNull.bookProgressPercent === 0);
  check('6.6 Reading null inputs: no NaN', assertNoNaN(readingNull));

  const readingZeroPages = calculateReadingStats({ currentPage: 0, totalPages: 0 }, 0, 0);
  check('6.7 Reading 0 totalPages: clamped >= 1 to prevent /0', readingZeroPages.bookProgressPercent === 0);
  check('6.7 Reading 0 totalPages: no NaN', assertNoNaN(readingZeroPages));

  const readingNaN = calculateReadingStats({ currentPage: NaN, totalPages: NaN }, NaN, NaN);
  const readingNaNLeaks = !assertNoNaN(readingNaN);
  check('6.8 Reading NaN inputs: does NOT leak NaN', !readingNaNLeaks, {
    pagesReadToday: readingNaN.pagesReadToday,
    bookProgressPercent: readingNaN.bookProgressPercent
  });
}

// ----------------------------------------------------------------------------
// 7. ERGONOMIC & BANNED EMOJI BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n--- 7. Ergonomics & Banned Emojis ---');

{
  check('7.1 Banned emoji 🔥 detected', containsBannedEmojis('Streak 🔥') === true);
  check('7.1 Banned emoji 💧 detected', containsBannedEmojis('Hydration 💧') === true);
  check('7.1 Banned emoji ⚡ detected', containsBannedEmojis('Energy ⚡') === true);
  check('7.1 Pure cockpit string has no banned emojis', containsBannedEmojis('PulseSync OS Cockpit [3500ml]') === false);
  check('7.1 Null text has no banned emojis', containsBannedEmojis(null) === false);

  check('7.2 Tap target 44x44 valid', auditTapTargetSize(44, 44) === true);
  check('7.2 Tap target 48x48 valid', auditTapTargetSize(48, 48) === true);
  check('7.2 Tap target 40x44 invalid', auditTapTargetSize(40, 44) === false);
  check('7.2 Tap target 44x32 invalid', auditTapTargetSize(44, 32) === false);
}

console.log('\n======================================================================');
console.log(`STRESS TEST EXECUTION COMPLETE`);
console.log(`Total Assertions : ${totalTests}`);
console.log(`Passed           : ${passedTests}`);
console.log(`Failed           : ${failedTests}`);
console.log('======================================================================\n');

if (failures.length > 0) {
  console.log('Detected Failure Modes:');
  for (const f of failures) {
    console.log(`- ${f.testName}: ${JSON.stringify(f.details)}`);
  }
}
