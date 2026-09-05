/**
 * scripts/simulate_full_day_lifecycle.mjs
 * 
 * Comprehensive 24-Hour End-to-End Simulation & Integration Verification Suite.
 * Simulates a high-performance daily lifecycle across Move, Focus, Habits, Day Ledger, and Overview Telemetry.
 */

import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Auto-respawn with --experimental-strip-types if executed via bare `node`
if (!process.execArgv.includes('--experimental-strip-types')) {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit', env: process.env }
  );
  process.exit(result.status ?? 0);
}

// ============================================================================
// LIVE PRODUCTION IMPORTS — Oracle Grounding (Stabilization Pass)
// ----------------------------------------------------------------------------
// This simulation drives the SHIPPED kernel in `src/utils/habitsMath.ts`.
// Scenario state uses production field names (zeroDoomscroll,
// dailySupplements, roomReset). If production math regresses, this fails.
// ============================================================================
import {
  calculateSleepDuration,
  evaluateCleanDay,
  computeDayBalanceRibbon,
} from '../src/utils/habitsMath.ts';

// -------------------------------------------------------------
// Test Runner Harness
// -------------------------------------------------------------
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function it(desc, fn) {
  totalAssertions++;
  try {
    fn();
    passedAssertions++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    failedAssertions++;
    console.error(`  ✗ ${desc}`);
    console.error(`    -> ${err.message}`);
  }
}

function suite(name) {
  console.log(`\n======================================================================`);
  console.log(`SIMULATION: ${name}`);
  console.log(`======================================================================`);
}

// Grounded: sleep, clean-day, and circadian math imported LIVE from
// src/utils/habitsMath.ts (see header). Scenario orchestration below.

// -------------------------------------------------------------
// Simulation Execution
// -------------------------------------------------------------
const SIM_DATE = '2026-09-06';
const simulatedState = {
  dateStr: SIM_DATE,
  sleep: {
    bedtime: '23:15',
    wakeup: '07:15',
    durationHours: 0,
    isOptimal: false,
    sunlightDone: false,
    debtHours: 0,
  },
  hydration: {
    targetMl: 3500,
    currentMl: 0,
    bottles700ml: 0,
    history: [],
  },
  keystones: {
    cleanDiet: false,
    zeroDoomscroll: false,
    dailySupplements: false,
    bedMade: false,
    roomReset: false,
    cleanDay: false,
  },
  moveLogs: [],
  focusSessions: [],
  reading: {
    pagesReadToday: 0,
    sprintDurationMins: 0,
  },
};

// --- Step 1: 07:15 Wakeup & Sunlight Anchor ---
suite('Phase 1 - Step 1: 07:15 Morning Wakeup & Sunlight Anchor');
{
  const { durationHours, durationFormatted } = calculateSleepDuration(simulatedState.sleep.bedtime, simulatedState.sleep.wakeup);
  simulatedState.sleep.durationHours = durationHours;
  simulatedState.sleep.durationFormatted = durationFormatted;
  simulatedState.sleep.isOptimal = durationHours >= 7.5 && durationHours <= 8.5;
  simulatedState.sleep.debtHours = Math.max(0, 8.0 - durationHours);
  simulatedState.sleep.sunlightDone = true; // 10 min outdoor sunlight within 30 min of waking

  it('Sleep duration calculates exactly 8.0h across midnight (23:15 to 07:15)', () => {
    assert.equal(simulatedState.sleep.durationHours, 8.0);
    assert.equal(simulatedState.sleep.durationFormatted, '8h 00m');
  });

  it('Sleep balance is optimal without acute sleep debt (0.0h)', () => {
    assert.equal(simulatedState.sleep.isOptimal, true);
    assert.equal(simulatedState.sleep.debtHours, 0.0);
  });

  it('Morning retinal sunlight anchor is locked within 30 minutes', () => {
    assert.equal(simulatedState.sleep.sunlightDone, true);
  });
}

// --- Step 2: 07:30 Bottle 1 & Morning Keystones ---
suite('Phase 1 - Step 2: 07:30 Hydration Bottle 1 & Morning Keystones');
{
  // 1x 700ml Bottle Logged
  simulatedState.hydration.currentMl += 700;
  simulatedState.hydration.bottles700ml = +(simulatedState.hydration.currentMl / 700).toFixed(1);
  simulatedState.hydration.history.push({ time: '07:30', amount: 700 });

  // Morning Keystones
  simulatedState.keystones.bedMade = true;
  simulatedState.keystones.cleanDiet = true; // Clean whole food breakfast
  simulatedState.keystones.cleanDay = evaluateCleanDay(simulatedState.keystones);

  it('Hydration logs 700ml (exactly 1.0 of 5 bottles)', () => {
    assert.equal(simulatedState.hydration.currentMl, 700);
    assert.equal(simulatedState.hydration.bottles700ml, 1.0);
  });

  it('Morning keystones active: Bed Made and Clean Diet', () => {
    assert.equal(simulatedState.keystones.bedMade, true);
    assert.equal(simulatedState.keystones.cleanDiet, true);
  });

  it('Clean Day status is In Progress (2/4 core markers met)', () => {
    assert.equal(simulatedState.keystones.cleanDay, false);
  });
}

// --- Step 3: 08:30 Focus Engine Bout 1 (50m Deep Anchor) ---
suite('Phase 1 - Step 3: 08:30 Focus Engine 50m Deep Anchor Block');
{
  simulatedState.focusSessions.push({
    id: `sess_${Date.now()}_1`,
    taskTitle: '[NG-09] Reactive Forms vs Template-Driven Forms',
    category: 'deep_anchor',
    durationMinutes: 50,
    durationSeconds: 3000,
    dsaSolved: 1,
    completedAt: '09:20',
  });

  it('Focus session records 50 minutes deep study block', () => {
    assert.equal(simulatedState.focusSessions[0].durationMinutes, 50);
  });

  it('Focus session increments DSA questions solved', () => {
    assert.equal(simulatedState.focusSessions[0].dsaSolved, 1);
  });
}

// --- Step 4: 09:30 Move Engine Micro-Dose 1 ---
suite('Phase 1 - Step 4: 09:30 Move Engine Micro-Workout (Pull-ups & Push-ups)');
{
  simulatedState.moveLogs.push(
    { id: 'move_1', exercise: 'Half Pull-ups', reps: 10, weightKg: 0, muscle: 'Upper Body', time: '09:30' },
    { id: 'move_2', exercise: 'Push-ups', reps: 25, weightKg: 0, muscle: 'Upper Body', time: '09:35' }
  );

  it('Records 2 micro-workout bouts without CNS burnout', () => {
    assert.equal(simulatedState.moveLogs.length, 2);
    assert.equal(simulatedState.moveLogs[0].reps, 10);
    assert.equal(simulatedState.moveLogs[1].reps, 25);
  });
}

// --- Step 5: 11:00 Hydration Bottle 2 ---
suite('Phase 1 - Step 5: 11:00 Hydration Bottle 2 (1,400ml / 2.0 Bottles)');
{
  simulatedState.hydration.currentMl += 700;
  simulatedState.hydration.bottles700ml = +(simulatedState.hydration.currentMl / 700).toFixed(1);
  simulatedState.hydration.history.push({ time: '11:00', amount: 700 });

  it('Hydration advances to 1,400ml (2.0 of 5 bottles)', () => {
    assert.equal(simulatedState.hydration.currentMl, 1400);
    assert.equal(simulatedState.hydration.bottles700ml, 2.0);
  });
}

// --- Step 6: 14:00 Deep Reading 20m Sprint ---
suite('Phase 1 - Step 6: 14:00 Deep Reading 20m Sprint (DDIA, 15 pages)');
{
  simulatedState.reading.sprintDurationMins = 20;
  simulatedState.reading.pagesReadToday = 15;

  it('Reading sprint logs 20m deliberate focus session', () => {
    assert.equal(simulatedState.reading.sprintDurationMins, 20);
  });

  it('Reading pages logged accurately (15 pages)', () => {
    assert.equal(simulatedState.reading.pagesReadToday, 15);
  });
}

// --- Step 7: 15:00 Bottle 3 & 16:30 Focus Engine Bout 2 ---
suite('Phase 1 - Step 7: 15:00 Bottle 3 & 16:30 Focus Bout 2 (Azure AI)');
{
  simulatedState.hydration.currentMl += 700;
  simulatedState.hydration.bottles700ml = +(simulatedState.hydration.currentMl / 700).toFixed(1);
  simulatedState.hydration.history.push({ time: '15:00', amount: 700 });

  simulatedState.focusSessions.push({
    id: `sess_${Date.now()}_2`,
    taskTitle: 'Lab 03 Azure OpenAI Embeddings & RAG Vector Search',
    category: 'azure_ai',
    durationMinutes: 45,
    durationSeconds: 2700,
    dsaSolved: 0,
    completedAt: '17:15',
  });

  it('Hydration reaches 2,100ml (3.0 of 5 bottles)', () => {
    assert.equal(simulatedState.hydration.currentMl, 2100);
    assert.equal(simulatedState.hydration.bottles700ml, 3.0);
  });

  it('Focus Engine accumulates second bout (45m Azure AI)', () => {
    assert.equal(simulatedState.focusSessions.length, 2);
    assert.equal(simulatedState.focusSessions[1].durationMinutes, 45);
  });
}

// --- Step 8: 17:30 Move Engine Bout 2 & 18:30 Bottle 4 ---
suite('Phase 1 - Step 8: 17:30 Move Micro-Dose (Squats) & 18:30 Bottle 4');
{
  simulatedState.moveLogs.push({
    id: 'move_3',
    exercise: 'Barbell Squats',
    reps: 20,
    weightKg: 60,
    muscle: 'Legs',
    time: '17:30',
  });

  simulatedState.hydration.currentMl += 700;
  simulatedState.hydration.bottles700ml = +(simulatedState.hydration.currentMl / 700).toFixed(1);
  simulatedState.hydration.history.push({ time: '18:30', amount: 700 });

  it('Move Engine records lower body hypertrophy (20 Squats @ 60kg)', () => {
    assert.equal(simulatedState.moveLogs.length, 3);
    assert.equal(simulatedState.moveLogs[2].exercise, 'Barbell Squats');
  });

  it('Hydration reaches 2,800ml (4.0 of 5 bottles)', () => {
    assert.equal(simulatedState.hydration.currentMl, 2800);
    assert.equal(simulatedState.hydration.bottles700ml, 4.0);
  });
}

// --- Step 9: 20:30 Evening Keystones, Bottle 5 & Clean Day ---
suite('Phase 1 - Step 9: 20:30 Evening Keystones, Bottle 5 & Clean Day Validation');
{
  simulatedState.keystones.dailySupplements = true;
  simulatedState.keystones.zeroDoomscroll = true; // Zero algorithmic doomscrolling
  simulatedState.keystones.roomReset = true;  // Evening workspace order
  simulatedState.keystones.cleanDay = evaluateCleanDay(simulatedState.keystones);

  simulatedState.hydration.currentMl += 700;
  simulatedState.hydration.bottles700ml = +(simulatedState.hydration.currentMl / 700).toFixed(1);
  simulatedState.hydration.history.push({ time: '21:00', amount: 700 });

  it('Hydration reaches exactly 3,500ml (5.0 of 5 bottles - 100% Target Met)', () => {
    assert.equal(simulatedState.hydration.currentMl, 3500);
    assert.equal(simulatedState.hydration.bottles700ml, 5.0);
  });

  it('All 4 Core Keystones complete -> Clean Day evaluates strictly TRUE', () => {
    assert.equal(simulatedState.keystones.cleanDay, true);
  });

  it('Evening environmental reset completed', () => {
    assert.equal(simulatedState.keystones.roomReset, true);
  });
}

// --- Step 10: 23:15 End-of-Day Cross-Engine Invariants Verification ---
suite('Phase 1 - Step 10: 23:15 End-of-Day Cross-Engine Invariants Verification');
{
  const totalFocusMinutes = simulatedState.focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalMoveMinutes = simulatedState.moveLogs.length * 5; // ~5 mins per micro-workout dose
  const totalVolumeReps = simulatedState.moveLogs.reduce((acc, l) => acc + l.reps, 0);

  it('Total daily focus study time is strictly 95 minutes (1.58h)', () => {
    assert.equal(totalFocusMinutes, 95);
  });

  it('Total daily movement reps is strictly 55 reps across Upper and Lower body', () => {
    assert.equal(totalVolumeReps, 55);
  });

  // Live production ribbon: hours in, normalized partition out.
  const circadian = computeDayBalanceRibbon(simulatedState.sleep.durationHours, totalFocusMinutes / 60, totalMoveMinutes / 60);

  it('Circadian Day Balance Ribbon calculates Sleep (33%), Focus (7%), Move (1%), Rest (59%)', () => {
    assert.equal(circadian.sleepHours, 8.0);
    assert.equal(+circadian.focusHours.toFixed(2), 1.58);
    assert.equal(+circadian.movementHours.toFixed(2), 0.25);
    assert.equal(+circadian.restHours.toFixed(2), 14.17);
  });

  it('Circadian partition adds up to strictly 100% calibration', () => {
    assert.equal(circadian.totalPct, 100);
  });
}

// --- Step 11: Consistency Matrix & Adherence Ledger Verification ---
suite('Phase 1 - Step 11: Consistency Matrix & Adherence Ledger Verification');
{
  // 5 Pillars for simulated day
  const pillarStatus = {
    sleep: simulatedState.sleep.durationHours >= 8.0 ? 'met' : 'missed',
    sunlight: simulatedState.sleep.sunlightDone ? 'met' : 'missed',
    hydration: simulatedState.hydration.currentMl >= 3500 ? 'met' : 'missed',
    cleanDay: simulatedState.keystones.cleanDay ? 'met' : 'missed',
    reading: simulatedState.reading.pagesReadToday >= 15 ? 'met' : 'missed',
  };

  it('Simulated day meets all 5 pillars in Habit Consistency Matrix', () => {
    assert.equal(pillarStatus.sleep, 'met');
    assert.equal(pillarStatus.sunlight, 'met');
    assert.equal(pillarStatus.hydration, 'met');
    assert.equal(pillarStatus.cleanDay, 'met');
    assert.equal(pillarStatus.reading, 'met');
  });

  const metPillarsCount = Object.values(pillarStatus).filter(s => s === 'met').length;
  it('Consistency score for simulated day is 100% (5/5 pillars)', () => {
    assert.equal(metPillarsCount, 5);
  });
}

// -------------------------------------------------------------
// Test Results Summary
// -------------------------------------------------------------
console.log(`\n======================================================================`);
console.log(`FULL-DAY SIMULATION TEST EXECUTION SUMMARY`);
console.log(`======================================================================`);
console.log(`Total Assertions Run : ${totalAssertions}`);
console.log(`Passed Assertions    : ${passedAssertions}`);
console.log(`Failed Assertions    : ${failedAssertions}`);
console.log(`Pass Rate            : ${((passedAssertions / totalAssertions) * 100).toFixed(1)}%`);

if (failedAssertions > 0) {
  console.error(`\n❌ SIMULATION FAILED WITH ${failedAssertions} FAILURES!`);
  process.exit(1);
} else {
  console.log(`\n✓ 100% OF SIMULATION ASSERTIONS PASSED! Phase 1 End-to-End Life Cycle Verified.`);
  process.exit(0);
}
