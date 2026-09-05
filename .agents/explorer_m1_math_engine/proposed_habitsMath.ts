/**
 * ============================================================================
 * PULSESYNC OS — HABITS & CIRCADIAN BEHAVIORAL MATHEMATICS ENGINE
 * ============================================================================
 * Pure, deterministic mathematical utilities for sleep architecture, fluid
 * dynamics, keystone discipline streaks, dynamic horizon scaling, 7-day
 * consistency matrices, and adherence ledger benchmarks.
 *
 * Grounded in:
 * - Matthew Walker: 5-cycle sleep architecture (7.5h-8.5h), acute sleep debt
 * - Andrew Huberman: Circadian light timing, morning SCN anchor, 3.5L hydration
 * - James Clear: Keystone discipline, cue-friction loops, Clean Day matrix
 * ============================================================================
 */

import { DailyHabitRecord } from '../types';

// ============================================================================
// CONSTANTS & CANONICAL BENCHMARKS
// ============================================================================

export const DEFAULT_SLEEP_BASELINE_HOURS = 8.0;
export const DEFAULT_HYDRATION_TARGET_ML = 3500;
export const DEFAULT_READING_TARGET_PAGES = 20;

export const HYDRATION_RING_RADIUS = 50;
export const HYDRATION_CIRCUMFERENCE = 2 * Math.PI * HYDRATION_RING_RADIUS; // ~314.159265

export type CleanDayTierName = 'Calibrated' | 'Disciplined' | 'Fortified' | 'Unbreakable' | 'Sovereign';

export interface CleanDayTierInfo {
  name: CleanDayTierName;
  streak: number;
  minDays: number;
  nextTierDays: number | null;
  daysToNextTier: number;
  description: string;
  badgeClass: string;
}

export const CLEAN_DAY_TIERS: Record<CleanDayTierName, { min: number; next: number | null; desc: string; badge: string }> = {
  Calibrated: {
    min: 0,
    next: 7,
    desc: 'Foundation established. Neurological baseline calibration.',
    badge: 'bg-slate-800/80 text-slate-300 border-slate-700',
  },
  Disciplined: {
    min: 7,
    next: 14,
    desc: '1-week unbroken baseline. Dopamine receptor stabilization.',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  Fortified: {
    min: 14,
    next: 30,
    desc: '2-week neuroplastic consolidation. Habit friction eliminated.',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  Unbreakable: {
    min: 30,
    next: 90,
    desc: '30-day structural transformation. Automatic execution posture.',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  Sovereign: {
    min: 90,
    next: null,
    desc: 'Quarter-year circadian mastery. Uncompromising discipline.',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
};

export interface HabitBenchmark {
  id: 'sleep' | 'sunlight' | 'hydration' | 'cleanDay' | 'reading';
  name: string;
  category: 'sleep' | 'sunlight' | 'hydration' | 'discipline' | 'reading';
  unit: 'hours' | 'sessions' | 'liters' | 'days' | 'pages';
  baselineWeekly: number; // 7D standard pace
  stretchWeekly: number;  // 7D accelerated pace
  description: string;
}

export const HABIT_BENCHMARKS: HabitBenchmark[] = [
  {
    id: 'sleep',
    name: 'Circadian Sleep Recovery',
    category: 'sleep',
    unit: 'hours',
    baselineWeekly: 56.0, // 8.0h / day
    stretchWeekly: 59.5,  // 8.5h / day
    description: 'Optimal 5-cycle recovery window',
  },
  {
    id: 'sunlight',
    name: 'Morning Sunlight Anchor',
    category: 'sunlight',
    unit: 'sessions',
    baselineWeekly: 6,    // 6 / 7 days
    stretchWeekly: 7,     // 7 / 7 days
    description: '10m direct sunlight within 30m of waking',
  },
  {
    id: 'hydration',
    name: 'Hydration Fluid Dynamics',
    category: 'hydration',
    unit: 'liters',
    baselineWeekly: 24.5, // 3.5L / day
    stretchWeekly: 28.0,  // 4.0L / day
    description: 'Target fluid turnover for cognitive acuity',
  },
  {
    id: 'cleanDay',
    name: 'Keystone Clean Days',
    category: 'discipline',
    unit: 'days',
    baselineWeekly: 6,    // 6 / 7 days
    stretchWeekly: 7,     // 7 / 7 days
    description: 'Clean diet, zero doomscrolling, supps, bed made',
  },
  {
    id: 'reading',
    name: 'Technical Deep Reading',
    category: 'reading',
    unit: 'pages',
    baselineWeekly: 140,  // 20 pages / day
    stretchWeekly: 210,  // 30 pages / day
    description: 'Deliberate engineering & science reading',
  },
];

// ============================================================================
// 1. CIRCADIAN SLEEP & RECOVERY MATHEMATICS
// ============================================================================

export interface SleepDurationResult {
  durationMinutes: number;
  durationHours: number;
  durationFormatted: string;
}

export type CircadianPhase = 'optimal' | 'delayed' | 'shifted' | 'short' | 'variable';

/**
 * Parses time string in 'HH:mm' format into total minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return 0;
  }
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return ((h * 60 + m) % 1440 + 1440) % 1440;
}

/**
 * Computes sleep duration across the 24-hour midnight boundary.
 *
 * Formula:
 * - Tb = bedtime in minutes from midnight (0..1439)
 * - Tw = wakeup time in minutes from midnight (0..1439)
 * - If Tb === Tw: 0 minutes (not 24h)
 * - If Tw > Tb: Tw - Tb (same-day AM sleep, e.g. 01:30 to 09:00 -> 450m)
 * - If Tw < Tb: (1440 - Tb) + Tw (cross-midnight, e.g. 23:15 to 07:15 -> 480m)
 */
export function calculateSleepDuration(
  bedtimeRaw?: string | null,
  wakeupRaw?: string | null
): SleepDurationResult {
  if (!bedtimeRaw || !wakeupRaw) {
    return { durationMinutes: 0, durationHours: 0.0, durationFormatted: '0h 00m' };
  }

  const Tb = parseTimeToMinutes(bedtimeRaw);
  const Tw = parseTimeToMinutes(wakeupRaw);

  let durationMinutes = 0;
  if (Tb === Tw) {
    durationMinutes = 0;
  } else if (Tw >= Tb) {
    durationMinutes = Tw - Tb;
  } else {
    durationMinutes = (1440 - Tb) + Tw;
  }

  const durationHours = Math.round((durationMinutes / 60) * 100) / 100;
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  const durationFormatted = `${h}h ${String(m).padStart(2, '0')}m`;

  return { durationMinutes, durationHours, durationFormatted };
}

/**
 * Parses formatted sleep duration string (e.g. '8h 00m', '6h 20m') into decimal hours.
 */
export function parseSleepDuration(formatted?: string | null): number {
  if (!formatted || typeof formatted !== 'string') return 0;
  const match = formatted.match(/(\d+)h\s*(\d*)m?/);
  if (!match) return 0;
  const h = parseInt(match[1], 10) || 0;
  const m = parseInt(match[2], 10) || 0;
  return Math.round((h + m / 60) * 100) / 100;
}

/**
 * Checks if sleep duration falls within Matthew Walker's optimal 5-cycle recovery window (7.5h - 8.5h).
 */
export function isSleepOptimal(durationHours?: number | null): boolean {
  return typeof durationHours === 'number' && !isNaN(durationHours) && durationHours >= 7.5 && durationHours <= 8.5;
}

/**
 * Classifies sleep schedule into circadian phase profiles based on bedtime hour decimal and duration:
 * - 'short': Duration < 6.5h
 * - 'optimal': Bedtime 21:30 to 00:30 (21.5 <= Hdec <= 24.0 or Hdec <= 0.5) AND duration >= 7.5h
 * - 'delayed': Bedtime 00:30 to 02:30 (0.5 < Hdec <= 2.5)
 * - 'shifted': Bedtime 02:30 to 12:00 (2.5 < Hdec <= 12.0)
 * - 'variable': All other timings
 */
export function classifyCircadianPhase(
  bedtimeRaw?: string | null,
  durationHours?: number | null
): CircadianPhase {
  const hours = typeof durationHours === 'number' && !isNaN(durationHours) ? durationHours : 0;
  if (hours < 6.5) return 'short';

  const minutes = parseTimeToMinutes(bedtimeRaw);
  const Hdec = minutes / 60; // 0.0 to 24.0

  const isOptimalBedtime = Hdec >= 21.5 || Hdec <= 0.5;
  if (isOptimalBedtime && hours >= 7.5) {
    return 'optimal';
  }
  if (Hdec > 0.5 && Hdec <= 2.5) {
    return 'delayed';
  }
  if (Hdec > 2.5 && Hdec <= 12.0) {
    return 'shifted';
  }
  return 'variable';
}

// ============================================================================
// 2. SLEEP DEBT ACCUMULATION MATHEMATICS
// ============================================================================

export interface SleepDebtResult {
  accumulatedDebt: number; // Sum of positive deficits vs baseline
  netBalance: number;      // Net hours (surplus - deficit)
  daysEvaluated: number;
}

/**
 * Calculates daily delta against calibrated baseline (default 8.0h).
 * Negative indicates deficit; positive indicates surplus.
 */
export function calculateDailySleepDelta(durationHours: number, baselineHours = DEFAULT_SLEEP_BASELINE_HOURS): number {
  const h = typeof durationHours === 'number' && !isNaN(durationHours) ? durationHours : 0;
  return Math.round((h - baselineHours) * 100) / 100;
}

/**
 * Calculates daily acute sleep debt (0 if duration meets or exceeds baseline).
 */
export function calculateDailySleepDebt(durationHours: number, baselineHours = DEFAULT_SLEEP_BASELINE_HOURS): number {
  const h = typeof durationHours === 'number' && !isNaN(durationHours) ? durationHours : 0;
  return Math.max(0, Math.round((baselineHours - h) * 100) / 100);
}

/**
 * Computes accumulated sleep debt and net balance across an array of daily habit records or numeric hours.
 * Missing or null records in an active evaluated horizon accumulate full baseline debt (8.0h).
 */
export function calculateSleepDebt(
  dailyRecordsList: Array<{ sleepDurationHours?: number } | number | undefined | null>,
  baselineHours = DEFAULT_SLEEP_BASELINE_HOURS
): SleepDebtResult {
  if (!Array.isArray(dailyRecordsList) || dailyRecordsList.length === 0) {
    return { accumulatedDebt: 0.0, netBalance: 0.0, daysEvaluated: 0 };
  }

  let accumulatedDebt = 0;
  let netBalance = 0;

  for (const item of dailyRecordsList) {
    let hours = 0;
    if (typeof item === 'number') {
      hours = isNaN(item) ? 0 : Math.max(0, item);
    } else if (item && typeof item === 'object') {
      hours = typeof item.sleepDurationHours === 'number' && !isNaN(item.sleepDurationHours)
        ? Math.max(0, item.sleepDurationHours)
        : 0;
    }

    const deficit = Math.max(0, baselineHours - hours);
    accumulatedDebt += deficit;
    netBalance += (hours - baselineHours);
  }

  return {
    accumulatedDebt: Math.round(accumulatedDebt * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    daysEvaluated: dailyRecordsList.length,
  };
}

// ============================================================================
// 3. KEYSTONE DISCIPLINE & CLEAN DAY CALCULATION
// ============================================================================

export interface KeystoneMarkersInput {
  cleanDiet?: boolean | null;
  zeroDoomscroll?: boolean | null;
  dailySupplements?: boolean | null;
  bedMade?: boolean | null;
  roomReset?: boolean | null;
}

/**
 * Reactive calculation of Clean Day status.
 *
 * Canonical Formula:
 * cleanDay = cleanDiet && zeroDoomscroll && dailySupplements && bedMade
 */
export function evaluateCleanDay(keystones?: KeystoneMarkersInput | null): boolean {
  if (!keystones || typeof keystones !== 'object') return false;
  return Boolean(
    keystones.cleanDiet === true &&
    keystones.zeroDoomscroll === true &&
    keystones.dailySupplements === true &&
    keystones.bedMade === true
  );
}

/**
 * Returns count of satisfied markers (0 to 4).
 */
export function countCleanMarkers(keystones?: KeystoneMarkersInput | null): number {
  if (!keystones || typeof keystones !== 'object') return 0;
  let count = 0;
  if (keystones.cleanDiet === true) count++;
  if (keystones.zeroDoomscroll === true) count++;
  if (keystones.dailySupplements === true) count++;
  if (keystones.bedMade === true) count++;
  return count;
}

// ============================================================================
// 4. UNBROKEN CLEAN DAY STREAK COUNTER & 5-TIER CLASSIFICATION
// ============================================================================

/**
 * Classifies streak number into one of 5 cognitive discipline tiers:
 * - 0 to 6 days: Calibrated
 * - 7 to 13 days: Disciplined
 * - 14 to 29 days: Fortified
 * - 30 to 89 days: Unbreakable
 * - 90+ days: Sovereign
 */
export function classifyCleanStreakTier(streak: number): CleanDayTierName {
  const s = Math.max(0, streak || 0);
  if (s >= 90) return 'Sovereign';
  if (s >= 30) return 'Unbreakable';
  if (s >= 14) return 'Fortified';
  if (s >= 7) return 'Disciplined';
  return 'Calibrated';
}

/**
 * Returns comprehensive tier metadata including distance to next milestone.
 */
export function getCleanDayTierInfo(streak: number): CleanDayTierInfo {
  const s = Math.max(0, streak || 0);
  const tierName = classifyCleanStreakTier(s);
  const tierConfig = CLEAN_DAY_TIERS[tierName];

  const daysToNextTier = tierConfig.next !== null ? Math.max(0, tierConfig.next - s) : 0;

  return {
    name: tierName,
    streak: s,
    minDays: tierConfig.min,
    nextTierDays: tierConfig.next,
    daysToNextTier,
    description: tierConfig.desc,
    badgeClass: tierConfig.badge,
  };
}

/**
 * Computes unbroken consecutive clean days counting backwards from referenceDateStr.
 *
 * @param dailyRecordsMap Dictionary of daily habit records keyed by 'YYYY-MM-DD'
 * @param referenceDateStr Anchor date (usually today or selected historical date)
 * @param currentDayCleanOverride Optional override for the anchor date (e.g. live toggle)
 */
export function calculateCleanStreak(
  dailyRecordsMap: Record<string, DailyHabitRecord> | undefined | null,
  referenceDateStr: string,
  currentDayCleanOverride?: boolean
): number {
  if (!referenceDateStr || typeof referenceDateStr !== 'string') return 0;

  const [y, m, d] = referenceDateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return 0;

  let curDate = new Date(y, m - 1, d);
  let streak = 0;
  let isFirstIteration = true;

  while (true) {
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    let isClean = false;
    if (isFirstIteration && typeof currentDayCleanOverride === 'boolean') {
      isClean = currentDayCleanOverride;
    } else {
      const rec = dailyRecordsMap?.[key];
      isClean = rec?.cleanDay === true || evaluateCleanDay(rec);
    }

    if (isClean) {
      streak++;
      curDate.setDate(curDate.getDate() - 1);
      isFirstIteration = false;
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================================
// 5. HYDRATION & FLUID DYNAMICS STATS
// ============================================================================

export interface HydrationStats {
  currentMl: number;
  targetMl: number;
  adherenceRatio: number;   // e.g. 0.75
  progressPercent: number;  // clamped 0..100
  remainingMl: number;      // clamped >= 0
  volumeLiters: string;     // e.g. '2.63L'
  targetLiters: string;     // e.g. '3.5L'
  strokeDashoffset: number; // SVG ring strokeDashoffset (0..314.159)
}

/**
 * Computes comprehensive fluid dynamics telemetry and SVG circular progress geometry.
 *
 * SVG Progress Ring:
 * - Radius r = 50px
 * - Circumference C = 2 * PI * 50 = ~314.159px
 * - Clamped progress ratio = min(1, max(0, currentMl / targetMl))
 * - strokeDashoffset = C * (1 - clampedRatio)
 * - At 0ml: offset = 314.159 (empty)
 * - At 50%: offset = ~157.08 (half full)
 * - At 100%: offset = 0 (completely full ring)
 * - At >100%: offset remains 0 (no negative inversion artifacts)
 */
export function calculateHydrationStats(
  currentMl?: number | null,
  targetMl: number = DEFAULT_HYDRATION_TARGET_ML
): HydrationStats {
  const safeCurrent = Math.max(0, typeof currentMl === 'number' && !isNaN(currentMl) ? currentMl : 0);
  const safeTarget = Math.max(1, typeof targetMl === 'number' && !isNaN(targetMl) ? targetMl : DEFAULT_HYDRATION_TARGET_ML);

  const rawRatio = safeCurrent / safeTarget;
  const adherenceRatio = +rawRatio.toFixed(3);
  const progressPercent = Math.min(100, Math.round(rawRatio * 100));
  const remainingMl = Math.max(0, safeTarget - safeCurrent);

  const volumeLiters = `${(safeCurrent / 1000).toFixed(2)}L`;
  const targetLiters = `${(safeTarget / 1000).toFixed(1)}L`;

  const clampedRatio = Math.min(1, Math.max(0, rawRatio));
  const strokeDashoffset = +(HYDRATION_CIRCUMFERENCE * (1 - clampedRatio)).toFixed(3);

  return {
    currentMl: safeCurrent,
    targetMl: safeTarget,
    adherenceRatio,
    progressPercent,
    remainingMl,
    volumeLiters,
    targetLiters,
    strokeDashoffset,
  };
}

/**
 * 1-tap quick-add helper with upper bound clamping.
 */
export function applyHydrationQuickAdd(currentMl: number, quickAddMl: number, maxMl = 8000): number {
  const base = Math.max(0, currentMl || 0);
  const add = Math.max(0, quickAddMl || 0);
  return Math.min(maxMl, base + add);
}

/**
 * Custom stepper adjustment helper clamped between 0 and maxMl.
 */
export function applyHydrationStep(currentMl: number, stepDeltaMl: number, maxMl = 8000): number {
  const base = Math.max(0, currentMl || 0);
  return Math.min(maxMl, Math.max(0, base + stepDeltaMl));
}

// ============================================================================
// 6. DYNAMIC HORIZON SCALING QUAD MATHEMATICS
// ============================================================================

export interface ScaledScorecard<TActual = number, TTarget = number> {
  target: TTarget;
  actual: TActual;
  pct: number;
}

export interface HabitsHorizonScorecards {
  sleep: ScaledScorecard<number, number> & { debt: number };
  cleanDays: ScaledScorecard<number, number>;
  hydration: ScaledScorecard<number, number>;
  reading: ScaledScorecard<number, number>;
}

/**
 * Generates array of YYYY-MM-DD date strings for the horizon window ending on referenceDateStr.
 */
export function getHorizonDates(timeframe: number, referenceDateStr: string): string[] {
  const dates: string[] = [];
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const cur = new Date(y, m - 1, d);

  for (let i = 0; i < timeframe; i++) {
    const dObj = new Date(cur);
    dObj.setDate(cur.getDate() - i);
    const yStr = dObj.getFullYear();
    const mStr = String(dObj.getMonth() + 1).padStart(2, '0');
    const dStr = String(dObj.getDate()).padStart(2, '0');
    dates.push(`${yStr}-${mStr}-${dStr}`);
  }

  return dates;
}

/**
 * Computes Dynamic Horizon Scaling math for the 4 Scorecards across 7D, 14D, 30D, and 90D horizons.
 *
 * Targets scale linearly with timeframe T:
 * 1. Sleep: 8.0h * T (56h, 112h, 240h, 720h)
 * 2. Clean Days: 1d * T (7d, 14d, 30d, 90d)
 * 3. Hydration: 3.5L * T (24.5L, 49.0L, 105.0L, 315.0L)
 * 4. Reading: 20 pages * T (140p, 280p, 600p, 1800p)
 */
export function computeHabitsScorecards(
  dailyRecordsMap: Record<string, DailyHabitRecord> | undefined | null,
  timeframe: number,
  referenceDateStr: string
): HabitsHorizonScorecards {
  const horizonDates = getHorizonDates(timeframe, referenceDateStr);

  const targetSleepHours = +(8.0 * timeframe).toFixed(1);
  const targetCleanDays = timeframe;
  const targetHydrationLiters = +(3.5 * timeframe).toFixed(1);
  const targetPages = 20 * timeframe;

  let actualSleepHours = 0;
  let accumulatedSleepDebt = 0;
  let actualCleanDays = 0;
  let totalHydrationMl = 0;
  let actualPages = 0;

  for (const dt of horizonDates) {
    const rec = dailyRecordsMap?.[dt];

    const sleepH = rec?.sleepDurationHours ?? 0;
    actualSleepHours += sleepH;
    accumulatedSleepDebt += Math.max(0, 8.0 - sleepH);

    const isClean = rec?.cleanDay === true || evaluateCleanDay(rec);
    if (isClean) actualCleanDays++;

    totalHydrationMl += (rec?.hydrationCurrentMl ?? rec?.hydrationMl ?? 0);
    actualPages += (rec?.pagesRead ?? 0);
  }

  actualSleepHours = +actualSleepHours.toFixed(1);
  accumulatedSleepDebt = +accumulatedSleepDebt.toFixed(1);
  const actualHydrationLiters = +(totalHydrationMl / 1000).toFixed(1);

  const sleepPacingPct = targetSleepHours > 0 ? Math.min(150, Math.round((actualSleepHours / targetSleepHours) * 100)) : 0;
  const cleanConsistencyPct = targetCleanDays > 0 ? Math.min(100, Math.round((actualCleanDays / targetCleanDays) * 100)) : 0;
  const hydrationAdherencePct = targetHydrationLiters > 0 ? Math.min(150, Math.round((actualHydrationLiters / targetHydrationLiters) * 100)) : 0;
  const readingPacingPct = targetPages > 0 ? Math.min(150, Math.round((actualPages / targetPages) * 100)) : 0;

  return {
    sleep: {
      target: targetSleepHours,
      actual: actualSleepHours,
      debt: accumulatedSleepDebt,
      pct: sleepPacingPct,
    },
    cleanDays: {
      target: targetCleanDays,
      actual: actualCleanDays,
      pct: cleanConsistencyPct,
    },
    hydration: {
      target: targetHydrationLiters,
      actual: actualHydrationLiters,
      pct: hydrationAdherencePct,
    },
    reading: {
      target: targetPages,
      actual: actualPages,
      pct: readingPacingPct,
    },
  };
}

// ============================================================================
// 7. HABIT CONSISTENCY MATRIX (5 PILLARS X 7 DAYS)
// ============================================================================

export type HabitMatrixStatus = 'met' | 'partial' | 'none';

export interface HabitMatrixDay {
  dateStr: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
}

export interface HabitMatrixCell {
  dateStr: string;
  status: HabitMatrixStatus;
}

export interface HabitMatrixResult {
  days: HabitMatrixDay[];
  grid: Record<string, HabitMatrixCell[]>;
  scorePct: number;
  totalPoints: number;
  metCount: number;
  partialCount: number;
  noneCount: number;
}

/**
 * Evaluates a specific pillar's adherence on a single day:
 * - Sleep: Met >= 7.5h, Partial 6.0h - 7.49h, None < 6.0h
 * - Sunlight: Met (true), None (false)
 * - Hydration: Met >= 3500ml, Partial 2000ml - 3499ml, None < 2000ml
 * - Clean Day: Met (cleanDay or 4/4), Partial (3/4), None (<= 2/4)
 * - Reading: Met >= 20p, Partial 1p - 19p, None 0p
 */
export function evaluatePillarStatus(
  pillarId: 'sleep' | 'sunlight' | 'hydration' | 'cleanDay' | 'reading',
  rec?: DailyHabitRecord | null
): HabitMatrixStatus {
  if (!rec) return 'none';

  switch (pillarId) {
    case 'sleep': {
      const h = rec.sleepDurationHours ?? 0;
      if (h >= 7.5) return 'met';
      if (h >= 6.0) return 'partial';
      return 'none';
    }
    case 'sunlight': {
      return rec.sunlightDone === true ? 'met' : 'none';
    }
    case 'hydration': {
      const ml = rec.hydrationCurrentMl ?? rec.hydrationMl ?? 0;
      if (ml >= 3500) return 'met';
      if (ml >= 2000) return 'partial';
      return 'none';
    }
    case 'cleanDay': {
      if (rec.cleanDay === true) return 'met';
      const satisfied = countCleanMarkers(rec);
      if (satisfied === 4) return 'met';
      if (satisfied === 3) return 'partial';
      return 'none';
    }
    case 'reading': {
      const pages = rec.pagesRead ?? 0;
      if (pages >= 20) return 'met';
      if (pages >= 1) return 'partial';
      return 'none';
    }
    default:
      return 'none';
  }
}

/**
 * Computes 7-Day Habit Consistency Matrix across 5 pillars x 7 days (35 cells).
 * Met = 1.0 pt, Partial = 0.5 pt, None = 0.0 pt.
 * Aggregate percentage = round((totalPoints / 35) * 100).
 */
export function evaluateConsistencyMatrix(
  dailyRecordsMap: Record<string, DailyHabitRecord> | undefined | null,
  todayDateStr: string
): HabitMatrixResult {
  const [y, m, d] = todayDateStr.split('-').map(Number);
  const days: HabitMatrixDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const dObj = new Date(y, m - 1, d);
    dObj.setDate(dObj.getDate() - i);
    const yStr = dObj.getFullYear();
    const mStr = String(dObj.getMonth() + 1).padStart(2, '0');
    const dStr = String(dObj.getDate()).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    days.push({
      dateStr,
      dayLabel: dObj.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dayNumber: dObj.getDate(),
      isToday: i === 0,
    });
  }

  const pillars: Array<'sleep' | 'sunlight' | 'hydration' | 'cleanDay' | 'reading'> = [
    'sleep',
    'sunlight',
    'hydration',
    'cleanDay',
    'reading',
  ];

  const grid: Record<string, HabitMatrixCell[]> = {};
  let totalPoints = 0;
  let metCount = 0;
  let partialCount = 0;
  let noneCount = 0;

  for (const pillar of pillars) {
    grid[pillar] = [];
    for (const { dateStr } of days) {
      const rec = dailyRecordsMap?.[dateStr];
      const status = evaluatePillarStatus(pillar, rec);

      grid[pillar].push({ dateStr, status });

      if (status === 'met') {
        totalPoints += 1.0;
        metCount++;
      } else if (status === 'partial') {
        totalPoints += 0.5;
        partialCount++;
      } else {
        noneCount++;
      }
    }
  }

  const scorePct = Math.round((totalPoints / 35) * 100);

  return {
    days,
    grid,
    scorePct,
    totalPoints,
    metCount,
    partialCount,
    noneCount,
  };
}

// ============================================================================
// 8. HABITS ADHERENCE LEDGER MATHEMATICS
// ============================================================================

export interface HabitAdherenceRow {
  id: string;
  unit: string;
  target: number;
  completed: number;
  completionPct: number;
  isMet: boolean;
  delta: number;
}

export interface HabitsAdherenceLedgerResult {
  rows: HabitAdherenceRow[];
  metCount: number;
  totalGoals: number;
  adherenceRate: number;
}

/**
 * Computes baseline vs stretch targets and completion pacing across the chosen horizon.
 */
export function computeAdherenceLedger(
  dailyRecordsMap: Record<string, DailyHabitRecord> | undefined | null,
  timeframe: number,
  goalTier: 'baseline' | 'stretch' = 'baseline',
  referenceDateStr: string
): HabitsAdherenceLedgerResult {
  const horizonMultiplier = timeframe / 7;
  const horizonDates = getHorizonDates(timeframe, referenceDateStr);

  let totalSleep = 0;
  let sunlightDays = 0;
  let totalHydrationMl = 0;
  let cleanDaysCount = 0;
  let totalPages = 0;

  for (const dt of horizonDates) {
    const rec = dailyRecordsMap?.[dt];
    totalSleep += (rec?.sleepDurationHours ?? 0);
    if (rec?.sunlightDone === true) sunlightDays++;
    totalHydrationMl += (rec?.hydrationCurrentMl ?? rec?.hydrationMl ?? 0);
    if (rec?.cleanDay === true || evaluateCleanDay(rec)) cleanDaysCount++;
    totalPages += (rec?.pagesRead ?? 0);
  }

  const actuals: Record<string, number> = {
    sleep: +totalSleep.toFixed(1),
    sunlight: sunlightDays,
    hydration: +(totalHydrationMl / 1000).toFixed(1),
    cleanDay: cleanDaysCount,
    reading: totalPages,
  };

  const rows: HabitAdherenceRow[] = HABIT_BENCHMARKS.map((bm) => {
    const weeklyTarget = goalTier === 'baseline' ? bm.baselineWeekly : bm.stretchWeekly;
    const target = (bm.unit === 'hours' || bm.unit === 'liters')
      ? +(weeklyTarget * horizonMultiplier).toFixed(1)
      : Math.max(1, Math.round(weeklyTarget * horizonMultiplier));

    const completed = actuals[bm.id];
    const completionPct = target > 0 ? Math.min(150, Math.round((completed / target) * 100)) : 0;
    const isMet = completed >= target;
    const delta = (bm.unit === 'hours' || bm.unit === 'liters')
      ? +((completed - target)).toFixed(1)
      : completed - target;

    return {
      id: bm.id,
      unit: bm.unit,
      target,
      completed,
      completionPct,
      isMet,
      delta,
    };
  });

  const metCount = rows.filter((r) => r.isMet).length;
  const adherenceRate = Math.round((metCount / rows.length) * 100);

  return {
    rows,
    metCount,
    totalGoals: rows.length,
    adherenceRate,
  };
}

// ============================================================================
// 9. ADDITIONAL DOMAIN HELPERS (READING, DAY BALANCE RIBBON, ERGONOMICS)
// ============================================================================

export interface ReadingStatsResult {
  pagesReadToday: number;
  bookProgressPercent: number;
}

export function calculateReadingStats(
  book?: { currentPage?: number; totalPages?: number } | null,
  startPage?: number | null,
  endPage?: number | null
): ReadingStatsResult {
  const pagesReadToday = Math.max(0, (endPage ?? 0) - (startPage ?? 0));
  const currentPage = Math.max(0, book?.currentPage ?? endPage ?? 0);
  const totalPages = Math.max(1, book?.totalPages ?? 1);
  const bookProgressPercent = Math.min(100, Math.round((currentPage / totalPages) * 100));

  return { pagesReadToday, bookProgressPercent };
}

export interface DayBalanceRibbonResult {
  sleepHours: number;
  focusHours: number;
  movementHours: number;
  restHours: number;
  total: number;
  sleepPct: number;
  focusPct: number;
  movePct: number;
  restPct: number;
  totalPct: number;
}

export function computeDayBalanceRibbon(
  sleepHoursInput?: number | null,
  focusHoursInput?: number | null,
  movementHoursInput?: number | null
): DayBalanceRibbonResult {
  const sleepHours = Math.max(0, sleepHoursInput ?? 8.0);
  const focusHours = Math.max(0, focusHoursInput ?? 0);
  const movementHours = Math.max(0, movementHoursInput ?? 0);

  const accounted = sleepHours + focusHours + movementHours;
  const restHours = Math.max(1.0, 24.0 - accounted);
  const total = sleepHours + focusHours + movementHours + restHours;

  const sleepPct = Math.round((sleepHours / total) * 100);
  const focusPct = Math.round((focusHours / total) * 100);
  const movePct = Math.round((movementHours / total) * 100);
  const restPct = Math.max(0, 100 - (sleepPct + focusPct + movePct));

  return {
    sleepHours,
    focusHours,
    movementHours,
    restHours,
    total,
    sleepPct,
    focusPct,
    movePct,
    restPct,
    totalPct: sleepPct + focusPct + movePct + restPct,
  };
}

export const BANNED_EMOJIS_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

export function containsBannedEmojis(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  return BANNED_EMOJIS_REGEX.test(text);
}

export function auditTapTargetSize(widthPx: number, heightPx: number): boolean {
  return widthPx >= 44 && heightPx >= 44;
}
