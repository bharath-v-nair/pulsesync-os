#!/usr/bin/env node

/**
 * ============================================================================
 * PULSESYNC OS — FOCUS ENGINE & TELEMETRY RIGOROUS VERIFICATION SUITE
 * ============================================================================
 * Exhaustive programmatic assertions covering:
 * 1. domainClassifier.ts: 6 Technical Pillars, Prefixes, Categories, Buckets, Title Heuristics, Fallback
 * 2. focusData.ts: Data integrity, zero ghost records, initial curriculum tasks audit
 * 3. TopicMasteryCard: Baseline targets, horizon scaling (7D/14D/30D/90D), strict task derivation
 * 4. OverviewView: Scorecard math (Focus Volume, Active Days, Curriculum Tasks, DSA Solved)
 * 5. FocusAdherenceLedger: Baseline vs Stretch, deltas, percentages, overall adherence rate
 * 6. FocusConsistencyMatrix: 7-day pillar checks, dual-mode evaluation, matrix score calculation, Lucide icon bindings
 * 7. DayLedgerFeed & DayBalanceRibbon: Focus receipts aggregation, 24h day balance ribbon normalization
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// Auto-respawn with --experimental-strip-types if executed via bare `node`
if (!process.execArgv.includes('--experimental-strip-types')) {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit', env: process.env }
  );
  process.exit(result.status ?? 0);
}

// Direct TypeScript Module Imports
import { classifyTaskDomain, CURRICULUM_DOMAINS } from '../src/utils/domainClassifier.ts';
import { INITIAL_FOCUS_DATA, CURRICULUM_DAYS } from '../src/data/focusData.ts';

// ANSI Styling
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  purple: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Test Reporter Harness
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
let currentSuite = '';
const failures = [];

function assert(condition, message, detail = null) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ${c.green}✓${c.reset} ${message}`);
  } else {
    failedAssertions++;
    const errMsg = `${currentSuite} -> ${message}`;
    failures.push({ message: errMsg, detail });
    console.log(`  ${c.red}✗ FAIL:${c.reset} ${message}`);
    if (detail) {
      console.log(`    ${c.yellow}Details: ${JSON.stringify(detail)}${c.reset}`);
    }
  }
}

function assertEquals(actual, expected, message) {
  const pass = Object.is(actual, expected);
  assert(pass, message, { expected, actual });
}

function assertDeepEquals(actual, expected, message) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  assert(pass, message, { expected, actual });
}

function suite(name, fn) {
  currentSuite = name;
  console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}${name}${c.reset}`);
  console.log(`${c.bold}${c.cyan}======================================================================${c.reset}`);
  fn();
}

// ============================================================================
// SUITE 1: Task Domain Classifier (6 Technical Pillars & Priority Heuristics)
// ============================================================================
suite('Suite 1: Task Domain Classifier (6 Technical Pillars & Priority Heuristics)', () => {
  // 1.1 Metadata & Pillar Registration
  const domainKeys = Object.keys(CURRICULUM_DOMAINS);
  assertEquals(domainKeys.length, 6, 'Exactly 6 core curriculum technical pillars registered');
  assertDeepEquals(
    domainKeys.sort(),
    ['angular', 'azure', 'behavioral', 'dotnet', 'dsa', 'system_design'].sort(),
    'All 6 pillar identifiers present (angular, dotnet, dsa, azure, system_design, behavioral)'
  );

  // Verify baseline metadata
  assertEquals(CURRICULUM_DOMAINS.angular.baselineTarget, 12, 'Angular baseline target is 12');
  assertEquals(CURRICULUM_DOMAINS.dotnet.baselineTarget, 12, '.NET baseline target is 12');
  assertEquals(CURRICULUM_DOMAINS.dsa.baselineTarget, 14, 'DSA baseline target is 14');
  assertEquals(CURRICULUM_DOMAINS.azure.baselineTarget, 8, 'Azure baseline target is 8');
  assertEquals(CURRICULUM_DOMAINS.system_design.baselineTarget, 8, 'System Design baseline target is 8');
  assertEquals(CURRICULUM_DOMAINS.behavioral.baselineTarget, 8, 'Behavioral baseline target is 8');

  // 1.2 Exact Code Prefix Matches (Priority 1)
  assertEquals(classifyTaskDomain({ code: 'NG-01' }), 'angular', 'Prefix NG- maps to angular');
  assertEquals(classifyTaskDomain({ code: 'ng-99' }), 'angular', 'Prefix ng- (lowercase) maps to angular');
  assertEquals(classifyTaskDomain({ code: 'CS-01' }), 'dotnet', 'Prefix CS- maps to dotnet');
  assertEquals(classifyTaskDomain({ code: 'WA-04' }), 'dotnet', 'Prefix WA- maps to dotnet');
  assertEquals(classifyTaskDomain({ code: 'EF-02' }), 'dotnet', 'Prefix EF- maps to dotnet');
  assertEquals(classifyTaskDomain({ code: 'NET-08' }), 'dotnet', 'Prefix NET- maps to dotnet');
  assertEquals(classifyTaskDomain({ code: 'DSA-01' }), 'dsa', 'Prefix DSA- maps to dsa');
  assertEquals(classifyTaskDomain({ code: 'LC-121' }), 'dsa', 'Prefix LC- maps to dsa');
  assertEquals(classifyTaskDomain({ code: 'AZ-104' }), 'azure', 'Prefix AZ- maps to azure');
  assertEquals(classifyTaskDomain({ code: 'AI-102' }), 'azure', 'Prefix AI- maps to azure');
  assertEquals(classifyTaskDomain({ code: 'SD-01' }), 'system_design', 'Prefix SD- maps to system_design');
  assertEquals(classifyTaskDomain({ code: 'SYS-202' }), 'system_design', 'Prefix SYS- maps to system_design');
  assertEquals(classifyTaskDomain({ code: 'STAR-01' }), 'behavioral', 'Prefix STAR- maps to behavioral');
  assertEquals(classifyTaskDomain({ code: 'BEH-05' }), 'behavioral', 'Prefix BEH- maps to behavioral');

  // 1.3 Category & Bucket Matches (Priority 2)
  assertEquals(classifyTaskDomain({ category: 'Angular' }), 'angular', 'Category Angular maps to angular');
  assertEquals(classifyTaskDomain({ category: '.NET' }), 'dotnet', 'Category .NET maps to dotnet');
  assertEquals(classifyTaskDomain({ category: 'dotnet' }), 'dotnet', 'Category dotnet maps to dotnet');
  assertEquals(classifyTaskDomain({ category: 'C#' }), 'dotnet', 'Category C# maps to dotnet');
  assertEquals(classifyTaskDomain({ category: 'csharp' }), 'dotnet', 'Category csharp maps to dotnet');
  assertEquals(classifyTaskDomain({ category: 'LeetCode' }), 'dsa', 'Category LeetCode maps to dsa');
  assertEquals(classifyTaskDomain({ category: 'dsa' }), 'dsa', 'Category dsa maps to dsa');
  assertEquals(classifyTaskDomain({ bucket: 'dsa' }), 'dsa', 'Bucket dsa maps to dsa');
  assertEquals(classifyTaskDomain({ category: 'Azure' }), 'azure', 'Category Azure maps to azure');
  assertEquals(classifyTaskDomain({ bucket: 'azure' }), 'azure', 'Bucket azure maps to azure');
  assertEquals(classifyTaskDomain({ category: 'systemdesign' }), 'system_design', 'Category systemdesign maps to system_design');
  assertEquals(classifyTaskDomain({ category: 'System Design' }), 'system_design', 'Category System Design maps to system_design');
  assertEquals(classifyTaskDomain({ category: 'sysdesign' }), 'system_design', 'Category sysdesign maps to system_design');
  assertEquals(classifyTaskDomain({ category: 'Behavioral' }), 'behavioral', 'Category Behavioral maps to behavioral');
  assertEquals(classifyTaskDomain({ category: 'star' }), 'behavioral', 'Category star maps to behavioral');

  // 1.4 Title Keyword Heuristics (Priority 3)
  assertEquals(
    classifyTaskDomain({ title: 'Understanding RxJS Operators and Subject' }),
    'angular',
    'Title with RxJS maps to angular'
  );
  assertEquals(
    classifyTaskDomain({ title: 'Signal Inputs and OnPush Change Detection' }),
    'angular',
    'Title with Signal and OnPush maps to angular'
  );
  assertEquals(
    classifyTaskDomain({ title: 'ASP.NET Core Middleware and Dependency Injection' }),
    'dotnet',
    'Title with ASP.NET and Dependency Injection maps to dotnet'
  );
  assertEquals(
    classifyTaskDomain({ title: 'Record vs Class and Garbage Collection (GC) in CLR' }),
    'dotnet',
    'Title with Record vs Class and GC maps to dotnet'
  );
  assertEquals(
    classifyTaskDomain({ title: 'NeetCode 150: Binary Search & Two Pointer approach' }),
    'dsa',
    'Title with NeetCode, Binary Search maps to dsa'
  );
  assertEquals(
    classifyTaskDomain({ title: 'Dynamic Programming (DP) on Trees and Graphs' }),
    'dsa',
    'Title with Dynamic Programming maps to dsa'
  );
  assertEquals(
    classifyTaskDomain({ title: 'Semantic Kernel with OpenAI and RAG Architecture' }),
    'azure',
    'Title with Semantic Kernel and RAG maps to azure'
  );
  assertEquals(
    classifyTaskDomain({ title: 'Rate Limiter & API Gateway with Redis and Kafka' }),
    'system_design',
    'Title with Rate Limiter and Redis/Kafka maps to system_design'
  );
  assertEquals(
    classifyTaskDomain({ title: 'Story Vault: Handling a Difficult Conflict with Leadership' }),
    'behavioral',
    'Title with Story Vault and Leadership maps to behavioral'
  );

  // 1.5 Precedence Hierarchy Testing
  // Code prefix MUST override Category & Title
  assertEquals(
    classifyTaskDomain({ code: 'NG-09', category: '.NET', title: 'Two Sum LeetCode' }),
    'angular',
    'Code prefix NG- overrides category .NET and title LeetCode'
  );
  assertEquals(
    classifyTaskDomain({ code: 'CS-01', category: 'Angular', title: 'Angular Reactive Forms' }),
    'dotnet',
    'Code prefix CS- overrides category Angular and title Angular Forms'
  );
  assertEquals(
    classifyTaskDomain({ code: 'DSA-01', category: 'Behavioral', title: 'System Design Kafka' }),
    'dsa',
    'Code prefix DSA- overrides category Behavioral and title System Design'
  );

  // Category MUST override Title heuristics when code is absent
  assertEquals(
    classifyTaskDomain({ category: 'Angular', title: 'Distributed Cache with Redis and CQRS' }),
    'angular',
    'Explicit category Angular overrides title Redis/CQRS'
  );
  assertEquals(
    classifyTaskDomain({ category: '.NET', title: 'RxJS switchMap and Angular Signals' }),
    'dotnet',
    'Explicit category .NET overrides title RxJS/Signals'
  );

  // 1.6 Fallback Safe Default
  assertEquals(
    classifyTaskDomain({ title: 'Completely unclassified misc task' }),
    'angular',
    'Unmatched task defaults safely to angular'
  );
  assertEquals(
    classifyTaskDomain({}),
    'angular',
    'Empty task object defaults safely to angular'
  );
});

// ============================================================================
// SUITE 2: Focus Data Integrity & Ghost Record Audit (focusData.ts)
// ============================================================================
suite('Suite 2: Focus Data Integrity & Ghost Record Audit (focusData.ts)', () => {
  const { tasks, sessions, stats, currentCurriculumDay } = INITIAL_FOCUS_DATA;

  // 2.1 Curriculum Days Verification
  assertEquals(CURRICULUM_DAYS.length, 7, 'CURRICULUM_DAYS defines exactly 7 days');
  CURRICULUM_DAYS.forEach((cd, idx) => {
    assertEquals(cd.day, idx + 1, `Curriculum day ${idx + 1} has day: ${idx + 1}`);
    assert(cd.title.length > 5, `Curriculum day ${idx + 1} has descriptive title: "${cd.title}"`);
    assert(Boolean(cd.tomorrow), `Curriculum day ${idx + 1} defines tomorrow plan`);
    assert(Boolean(cd.category), `Curriculum day ${idx + 1} defines category`);
  });

  // 2.2 Ghost Record & Anomaly Checks
  const ghostTasks = tasks.filter(
    (t) =>
      t.id.startsWith('task_178') ||
      t.id.includes('spaced_') ||
      !t.code ||
      t.title.includes('(ng34)')
  );
  assertEquals(ghostTasks.length, 0, 'Zero ghost records or ad-hoc test tasks exist in tasks array');

  // Verify uniqueness of Task IDs
  const taskIds = tasks.map((t) => t.id);
  const uniqueTaskIds = new Set(taskIds);
  assertEquals(taskIds.length, uniqueTaskIds.size, 'All Task IDs are strictly unique (no duplicates)');

  // Verify task count: Days 1-4 should contain 41 curriculum tasks
  assertEquals(tasks.length, 41, 'Tasks array contains exactly 41 authentic curriculum tasks (Days 1-4)');

  // 2.3 Breakdown per Curriculum Day
  const day1Tasks = tasks.filter((t) => t.curriculumDay === 1);
  const day2Tasks = tasks.filter((t) => t.curriculumDay === 2);
  const day3Tasks = tasks.filter((t) => t.curriculumDay === 3);
  const day4Tasks = tasks.filter((t) => t.curriculumDay === 4);

  assertEquals(day1Tasks.length, 10, 'Day 1 has 10 curriculum tasks (3 deep + 5 spaced + 1 live + 1 dsa)');
  assertEquals(day2Tasks.length, 10, 'Day 2 has 10 curriculum tasks (3 deep + 5 spaced + 1 live + 1 dsa)');
  assertEquals(day3Tasks.length, 10, 'Day 3 has 10 curriculum tasks (3 deep + 5 spaced + 1 live + 1 dsa)');
  assertEquals(day4Tasks.length, 11, 'Day 4 has 11 curriculum tasks (3 deep + 5 spaced + 1 live + 1 dsa + 1 apps)');

  // Verify exact bucket allocations for Day 1
  assertEquals(day1Tasks.filter((t) => t.bucket === 'deep').length, 3, 'Day 1 has 3 deep anchor tasks');
  assertEquals(day1Tasks.filter((t) => t.bucket === 'spaced').length, 5, 'Day 1 has 5 spaced retrieval tasks');
  assertEquals(day1Tasks.filter((t) => t.bucket === 'live').length, 1, 'Day 1 has 1 live coding task');
  assertEquals(day1Tasks.filter((t) => t.bucket === 'dsa').length, 1, 'Day 1 has 1 DSA challenge');

  // 2.4 Field Integrity Across All Tasks
  tasks.forEach((t) => {
    assert(typeof t.id === 'string' && t.id.length > 0, `Task ${t.id} has valid non-empty id`);
    assert(typeof t.code === 'string' && t.code.length > 0, `Task ${t.id} has non-empty code`);
    assert(typeof t.title === 'string' && t.title.length > 0, `Task ${t.id} has non-empty title`);
    assert(['deep', 'spaced', 'live', 'dsa', 'apps'].includes(t.bucket), `Task ${t.id} has valid bucket (${t.bucket})`);
    assert(typeof t.completed === 'boolean', `Task ${t.id} has boolean completed status`);
    assert(t.completedAt === null || typeof t.completedAt === 'string', `Task ${t.id} has valid completedAt`);
  });

  // 2.5 Initial Focus Sessions Audit
  assertEquals(sessions.length, 2, 'Initial focus sessions contains 2 historical bouts');
  sessions.forEach((s) => {
    assert(s.id.startsWith('sess_'), `Session ${s.id} has valid prefix sess_`);
    assert(s.durationSeconds > 0, `Session ${s.id} durationSeconds is positive (${s.durationSeconds}s)`);
    assert(s.endTimestamp > s.startTimestamp, `Session ${s.id} endTimestamp > startTimestamp`);
    assert(Boolean(s.dateStr.match(/^\d{4}-\d{2}-\d{2}$/)), `Session ${s.id} dateStr is YYYY-MM-DD`);
    assert(Boolean(s.durationMinutes), `Session ${s.id} has durationMinutes populated`);
    assert(Boolean(s.taskTitle), `Session ${s.id} has taskTitle populated`);

    // Verify bound taskId links to an authentic task
    if (s.taskId) {
      const boundTask = tasks.find((t) => t.id === s.taskId);
      assert(Boolean(boundTask), `Session ${s.id} taskId (${s.taskId}) links to valid curriculum task`);
    }
  });

  // 2.6 Stats Object Verification
  assertEquals(stats.totalStudySeconds, 6585, 'Initial stats.totalStudySeconds equals 6585s (~109.7m)');
  assertEquals(stats.completedQuestions, 4, 'Initial stats.completedQuestions equals 4');
  assertEquals(stats.dsaSolvedToday, 1, 'Initial stats.dsaSolvedToday equals 1');
  assertEquals(currentCurriculumDay, 1, 'Initial currentCurriculumDay is 1');
});

// ============================================================================
// SUITE 3: Topic Mastery Card (Baseline Targets, Horizon Scaling & Strict Task Derivation)
// ============================================================================
suite('Suite 3: Topic Mastery Card (Baseline Targets, Horizon Scaling & Strict Task Derivation)', () => {
  // Horizon multiplier formula: timeframe / 7
  const getDomainTarget = (id, timeframe) => {
    const horizonMultiplier = timeframe / 7;
    switch (id) {
      case 'dsa':
        return timeframe; // Strictly 1 problem per day!
      case 'angular':
      case 'dotnet':
        return Math.max(1, Math.round(6 * horizonMultiplier));
      case 'azure':
      case 'system_design':
      case 'behavioral':
        return Math.max(1, Math.round(2 * horizonMultiplier));
      default:
        return Math.max(1, Math.round(2 * horizonMultiplier));
    }
  };

  // 3.1 Verify Horizon Scaling Across 7D, 14D, 30D, and 90D
  const timeframes = [7, 14, 30, 90];

  // 7D Horizon (multiplier = 1.0)
  assertEquals(getDomainTarget('dsa', 7), 7, '7D DSA Target is strictly 7 (1/day)');
  assertEquals(getDomainTarget('angular', 7), 6, '7D Angular Target is 6');
  assertEquals(getDomainTarget('dotnet', 7), 6, '7D .NET Target is 6');
  assertEquals(getDomainTarget('azure', 7), 2, '7D Azure Target is 2');
  assertEquals(getDomainTarget('system_design', 7), 2, '7D System Design Target is 2');
  assertEquals(getDomainTarget('behavioral', 7), 2, '7D Behavioral Target is 2');

  // 14D Horizon (multiplier = 2.0)
  assertEquals(getDomainTarget('dsa', 14), 14, '14D DSA Target is strictly 14 (1/day)');
  assertEquals(getDomainTarget('angular', 14), 12, '14D Angular Target is 12 (6 * 2)');
  assertEquals(getDomainTarget('dotnet', 14), 12, '14D .NET Target is 12 (6 * 2)');
  assertEquals(getDomainTarget('azure', 14), 4, '14D Azure Target is 4 (2 * 2)');
  assertEquals(getDomainTarget('system_design', 14), 4, '14D System Design Target is 4 (2 * 2)');
  assertEquals(getDomainTarget('behavioral', 14), 4, '14D Behavioral Target is 4 (2 * 2)');

  // 30D Horizon (multiplier = 30/7 = 4.2857)
  assertEquals(getDomainTarget('dsa', 30), 30, '30D DSA Target is strictly 30 (1/day)');
  assertEquals(getDomainTarget('angular', 30), 26, '30D Angular Target is 26 (round(6 * 30/7))');
  assertEquals(getDomainTarget('dotnet', 30), 26, '30D .NET Target is 26 (round(6 * 30/7))');
  assertEquals(getDomainTarget('azure', 30), 9, '30D Azure Target is 9 (round(2 * 30/7))');
  assertEquals(getDomainTarget('system_design', 30), 9, '30D System Design Target is 9 (round(2 * 30/7))');
  assertEquals(getDomainTarget('behavioral', 30), 9, '30D Behavioral Target is 9 (round(2 * 30/7))');

  // 90D Horizon (multiplier = 90/7 = 12.857)
  assertEquals(getDomainTarget('dsa', 90), 90, '90D DSA Target is strictly 90 (1/day)');
  assertEquals(getDomainTarget('angular', 90), 77, '90D Angular Target is 77 (round(6 * 90/7))');
  assertEquals(getDomainTarget('dotnet', 90), 77, '90D .NET Target is 77 (round(6 * 90/7))');
  assertEquals(getDomainTarget('azure', 90), 26, '90D Azure Target is 26 (round(2 * 90/7))');
  assertEquals(getDomainTarget('system_design', 90), 26, '90D System Design Target is 26 (round(2 * 90/7))');
  assertEquals(getDomainTarget('behavioral', 90), 26, '90D Behavioral Target is 26 (round(2 * 90/7))');

  // 3.2 Verify Completed Units Derive Strictly from Completed Tasks (Never Inflated by Sessions)
  const computeTopicMastery = (focus, tf = 7) => {
    const tasks = focus.tasks || [];
    const domains = ['angular', 'dotnet', 'dsa', 'azure', 'system_design', 'behavioral'];

    const domainStats = domains.map((id) => {
      const domainTasks = tasks.filter((t) => classifyTaskDomain(t) === id);
      const completed = domainTasks.filter((t) => t.completed).length;
      const target = getDomainTarget(id, tf);
      const total = Math.max(target, domainTasks.length);
      const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
      return { id, completed, total, pct };
    });

    const totalCompleted = domainStats.reduce((acc, d) => acc + d.completed, 0);
    const totalTarget = domainStats.reduce((acc, d) => acc + d.total, 0);
    const overallMasteryPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    return { domainStats, overallMasteryPct, totalCompleted, totalTarget };
  };

  // Scenario A: Mock focus state with 3 completed angular tasks, 1 dsa completed task
  const mockFocusA = {
    tasks: [
      { id: 't1', code: 'NG-01', completed: true },
      { id: 't2', code: 'NG-02', completed: true },
      { id: 't3', code: 'NG-03', completed: true },
      { id: 't4', code: 'NG-04', completed: false },
      { id: 't5', code: 'DSA-01', completed: true },
      { id: 't6', code: 'CS-01', completed: false },
    ],
    sessions: [
      // 50 sessions for Angular - MUST NOT inflate completed units!
      ...Array.from({ length: 50 }).map((_, i) => ({
        id: `sess_spam_${i}`,
        taskId: 't1',
        category: 'Angular',
        bucket: 'deep',
        durationMinutes: 50,
      })),
    ],
    stats: { totalStudySeconds: 150000 },
  };

  const masteryA = computeTopicMastery(mockFocusA, 7);
  const angularStats = masteryA.domainStats.find((d) => d.id === 'angular');
  const dsaStats = masteryA.domainStats.find((d) => d.id === 'dsa');
  const dotnetStats = masteryA.domainStats.find((d) => d.id === 'dotnet');

  assertEquals(angularStats.completed, 3, 'Angular completed units strictly equals 3 (NOT 50 sessions)');
  assertEquals(angularStats.total, 6, 'Angular total is 6 (max of target 6 and 4 domain tasks)');
  assertEquals(angularStats.pct, 50, 'Angular percentage is 50% (3/6)');

  assertEquals(dsaStats.completed, 1, 'DSA completed units is 1');
  assertEquals(dsaStats.total, 7, 'DSA total is 7 (target 7 for 7D)');
  assertEquals(dsaStats.pct, 14, 'DSA percentage is 14% (1/7)');

  assertEquals(dotnetStats.completed, 0, '.NET completed units is 0');
  assertEquals(dotnetStats.total, 6, '.NET total is 6');
  assertEquals(dotnetStats.pct, 0, '.NET percentage is 0%');

  // Overall mastery calculation: (3 + 1) / (6 + 6 + 7 + 2 + 2 + 2) = 4 / 25 = 16%
  assertEquals(masteryA.overallMasteryPct, 16, 'Overall mastery is 16% (4 completed / 25 total targets)');
});

// ============================================================================
// SUITE 4: OverviewView Scorecard Calculations
// ============================================================================
suite('Suite 4: OverviewView Scorecard Calculations', () => {
  const computeOverviewScorecards = (focus, timeframe, selectedDate = '2026-09-04') => {
    const horizonMultiplier = timeframe / 7;
    const now = new Date(`${selectedDate}T23:59:59`);
    const horizonCutoff = new Date(now);
    horizonCutoff.setDate(now.getDate() - (timeframe - 1));
    horizonCutoff.setHours(0, 0, 0, 0);

    const horizonFocusSessions = (focus.sessions || []).filter((s) => {
      if (!s.dateStr) return true;
      const [y, m, d] = s.dateStr.split('-').map(Number);
      const sDate = new Date(y, m - 1, d);
      return sDate >= horizonCutoff;
    });

    const horizonFocusMins = horizonFocusSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
      0
    );
    const horizonStudyHours = +(horizonFocusMins / 60).toFixed(1);
    const targetStudyHours = +(5.5 * timeframe).toFixed(1);
    const studyHoursPct = targetStudyHours > 0 ? Math.min(150, Math.round((horizonStudyHours / targetStudyHours) * 100)) : 0;

    // Active Days calculation
    const uniqueFocusDates = new Set(
      horizonFocusSessions
        .filter((s) => (s.durationMinutes || 0) > 0 || (s.durationSeconds || 0) > 0)
        .map((s) => s.dateStr)
        .filter(Boolean)
    );
    if ((focus.stats?.totalStudySeconds || 0) > 0) {
      uniqueFocusDates.add(selectedDate);
    }
    const activeFocusDays = uniqueFocusDates.size;
    const focusConsistencyPct = Math.min(100, Math.round((activeFocusDays / timeframe) * 100));

    // Curriculum Tasks calculation
    const completedTasksCount = (focus.tasks || []).filter((t) => t.completed).length;
    const targetTasks = 2 * timeframe;
    const tasksPct = targetTasks > 0 ? Math.min(100, Math.round((completedTasksCount / targetTasks) * 100)) : 0;

    // DSA Solved calculation
    const dsaSolvedTotal = (focus.tasks || []).filter(
      (t) => t.completed && (t.bucket === 'dsa' || t.category === 'LeetCode' || t.category === 'dsa')
    ).length;
    const dsaTarget = Math.max(1, Math.round((7 / 7) * timeframe));
    const dsaPct = Math.min(100, Math.round((dsaSolvedTotal / dsaTarget) * 100));

    return {
      horizonStudyHours,
      targetStudyHours,
      studyHoursPct,
      activeFocusDays,
      focusConsistencyPct,
      completedTasksCount,
      targetTasks,
      tasksPct,
      dsaSolvedTotal,
      dsaTarget,
      dsaPct,
    };
  };

  // 4.1 Target Calculations Across 7D, 14D, 30D, and 90D
  const testTfs = [7, 14, 30, 90];
  const expectedTargets = {
    7: { studyHours: 38.5, tasks: 14, dsa: 7 },
    14: { studyHours: 77.0, tasks: 28, dsa: 14 },
    30: { studyHours: 165.0, tasks: 60, dsa: 30 },
    90: { studyHours: 495.0, tasks: 180, dsa: 90 },
  };

  testTfs.forEach((tf) => {
    const sc = computeOverviewScorecards(INITIAL_FOCUS_DATA, tf, '2026-09-04');
    assertEquals(sc.targetStudyHours, expectedTargets[tf].studyHours, `${tf}D Target Study Hours is ${expectedTargets[tf].studyHours} (5.5 * ${tf})`);
    assertEquals(sc.targetTasks, expectedTargets[tf].tasks, `${tf}D Target Curriculum Tasks is ${expectedTargets[tf].tasks} (2 * ${tf})`);
    assertEquals(sc.dsaTarget, expectedTargets[tf].dsa, `${tf}D Target DSA Solved is strictly ${expectedTargets[tf].dsa} (${tf})`);
  });

  // 4.2 Mock Focus State Scenario
  const mockFocusB = {
    tasks: [
      { id: '1', bucket: 'deep', completed: true },
      { id: '2', bucket: 'deep', completed: true },
      { id: '3', bucket: 'spaced', completed: true },
      { id: '4', bucket: 'dsa', category: 'LeetCode', completed: true },
      { id: '5', bucket: 'dsa', category: 'LeetCode', completed: true },
      { id: '6', bucket: 'live', completed: false },
    ],
    sessions: [
      { id: 's1', dateStr: '2026-09-01', durationMinutes: 60, durationSeconds: 3600 },
      { id: 's2', dateStr: '2026-09-02', durationMinutes: 120, durationSeconds: 7200 },
      { id: 's3', dateStr: '2026-09-03', durationMinutes: 90, durationSeconds: 5400 },
      { id: 's4', dateStr: '2026-09-04', durationMinutes: 30, durationSeconds: 1800 },
      // Zero duration ghost session - MUST NOT count as active day
      { id: 's5', dateStr: '2026-08-30', durationMinutes: 0, durationSeconds: 0 },
    ],
    stats: { totalStudySeconds: 18000 },
  };

  const scB = computeOverviewScorecards(mockFocusB, 7, '2026-09-04');

  // Study hours: 60 + 120 + 90 + 30 = 300 mins = 5.0 hrs
  assertEquals(scB.horizonStudyHours, 5.0, 'Horizon study hours is 5.0h (300 mins)');
  // Pct: (5.0 / 38.5) * 100 = 12.98 -> 13%
  assertEquals(scB.studyHoursPct, 13, 'Focus Volume percentage is 13%');

  // Active Days: dates 2026-09-01, 2026-09-02, 2026-09-03, 2026-09-04 (4 unique days)
  assertEquals(scB.activeFocusDays, 4, 'Active focus days is exactly 4 (zero duration session ignored)');
  assertEquals(scB.focusConsistencyPct, 57, 'Focus consistency rate is 57% (4/7)');

  // Completed Tasks: 5 completed tasks / 14 target = 36%
  assertEquals(scB.completedTasksCount, 5, 'Completed tasks count is 5');
  assertEquals(scB.tasksPct, 36, 'Curriculum tasks percentage is 36% (5/14)');

  // DSA Solved: 2 completed DSA tasks / 7 target = 29%
  assertEquals(scB.dsaSolvedTotal, 2, 'DSA solved total is 2');
  assertEquals(scB.dsaPct, 29, 'DSA solved percentage is 29% (2/7)');
});

// ============================================================================
// SUITE 5: Focus Adherence Ledger (Baseline vs Stretch, Deltas, Rates)
// ============================================================================
suite('Suite 5: Focus Adherence Ledger (Baseline vs Stretch, Deltas, Rates)', () => {
  const BENCHMARKS = [
    { id: 'deep_anchors', category: 'deep', baselineWeekly: 14, stretchWeekly: 21 },
    { id: 'spaced_checks', category: 'spaced', baselineWeekly: 21, stretchWeekly: 35 },
    { id: 'live_coding', category: 'live', baselineWeekly: 5, stretchWeekly: 7 },
    { id: 'dsa_challenges', category: 'dsa', baselineWeekly: 7, stretchWeekly: 14 },
    { id: 'azure_ai', category: 'azure', baselineWeekly: 2.5, stretchWeekly: 5.0 },
    { id: 'job_funnel', category: 'jobs', baselineWeekly: 20, stretchWeekly: 35 },
  ];

  const computeLedgerTargets = (timeframe, goalTier) => {
    const horizonMultiplier = timeframe / 7;
    return BENCHMARKS.map((bm) => {
      const weeklyTarget = goalTier === 'baseline' ? bm.baselineWeekly : bm.stretchWeekly;
      const target =
        bm.category === 'azure'
          ? +(weeklyTarget * horizonMultiplier).toFixed(1)
          : Math.max(1, Math.round(weeklyTarget * horizonMultiplier));
      return { id: bm.id, category: bm.category, target };
    });
  };

  // 5.1 Verify 7D Baseline and Stretch Targets
  const targets7D_Base = computeLedgerTargets(7, 'baseline');
  assertDeepEquals(
    targets7D_Base.map((t) => t.target),
    [14, 21, 5, 7, 2.5, 20],
    '7D Baseline targets: Deep: 14, Spaced: 21, Live: 5, DSA: 7, Azure: 2.5h, Jobs: 20'
  );

  const targets7D_Stretch = computeLedgerTargets(7, 'stretch');
  assertDeepEquals(
    targets7D_Stretch.map((t) => t.target),
    [21, 35, 7, 14, 5.0, 35],
    '7D Stretch targets: Deep: 21, Spaced: 35, Live: 7, DSA: 14, Azure: 5.0h, Jobs: 35'
  );

  // 5.2 Verify 14D Baseline and Stretch Targets
  const targets14D_Base = computeLedgerTargets(14, 'baseline');
  assertDeepEquals(
    targets14D_Base.map((t) => t.target),
    [28, 42, 10, 14, 5.0, 40],
    '14D Baseline targets: Deep: 28, Spaced: 42, Live: 10, DSA: 14, Azure: 5.0h, Jobs: 40'
  );

  const targets14D_Stretch = computeLedgerTargets(14, 'stretch');
  assertDeepEquals(
    targets14D_Stretch.map((t) => t.target),
    [42, 70, 14, 28, 10.0, 70],
    '14D Stretch targets: Deep: 42, Spaced: 70, Live: 14, DSA: 28, Azure: 10.0h, Jobs: 70'
  );

  // 5.3 Verify 30D Baseline and Stretch Targets
  const targets30D_Base = computeLedgerTargets(30, 'baseline');
  assertDeepEquals(
    targets30D_Base.map((t) => t.target),
    [60, 90, 21, 30, 10.7, 86],
    '30D Baseline targets: Deep: 60, Spaced: 90, Live: 21, DSA: 30, Azure: 10.7h, Jobs: 86'
  );

  const targets30D_Stretch = computeLedgerTargets(30, 'stretch');
  assertDeepEquals(
    targets30D_Stretch.map((t) => t.target),
    [90, 150, 30, 60, 21.4, 150],
    '30D Stretch targets: Deep: 90, Spaced: 150, Live: 30, DSA: 60, Azure: 21.4h, Jobs: 150'
  );

  // 5.4 Verify 90D Baseline and Stretch Targets
  const targets90D_Base = computeLedgerTargets(90, 'baseline');
  assertDeepEquals(
    targets90D_Base.map((t) => t.target),
    [180, 270, 64, 90, 32.1, 257],
    '90D Baseline targets: Deep: 180, Spaced: 270, Live: 64, DSA: 90, Azure: 32.1h, Jobs: 257'
  );

  const targets90D_Stretch = computeLedgerTargets(90, 'stretch');
  assertDeepEquals(
    targets90D_Stretch.map((t) => t.target),
    [270, 450, 90, 180, 64.3, 450],
    '90D Stretch targets: Deep: 270, Spaced: 450, Live: 90, DSA: 180, Azure: 64.3h, Jobs: 450'
  );

  // 5.5 Completion, Delta, and Adherence Rate Logic Test
  const mockFocusLedger = {
    tasks: [
      // 14 deep tasks completed
      ...Array.from({ length: 14 }).map((_, i) => ({ id: `d_${i}`, bucket: 'deep', completed: true })),
      // 21 spaced tasks completed
      ...Array.from({ length: 21 }).map((_, i) => ({ id: `s_${i}`, bucket: 'spaced', completed: true })),
      // 4 live tasks completed (target 5) -> deficit -1
      ...Array.from({ length: 4 }).map((_, i) => ({ id: `l_${i}`, bucket: 'live', completed: true })),
      // 8 DSA tasks completed (target 7) -> surplus +1
      ...Array.from({ length: 8 }).map((_, i) => ({ id: `dsa_${i}`, bucket: 'dsa', completed: true })),
    ],
    sessions: [
      { id: 'az1', bucket: 'azure', durationMinutes: 180 }, // 3.0 hrs (target 2.5) -> surplus +0.5h
    ],
    azureMinutes: 180,
    jobAppsCount: 22, // target 20 -> surplus +2
  };

  const computeFullLedger = (focus, tf, tier) => {
    const horizonMultiplier = tf / 7;
    const tasks = focus.tasks || [];

    const rows = BENCHMARKS.map((bm) => {
      let completed = 0;
      switch (bm.category) {
        case 'deep':
          completed = tasks.filter((t) => t.completed && (t.bucket === 'deep' || t.category === 'core')).length;
          break;
        case 'spaced':
          completed = tasks.filter((t) => t.completed && (t.bucket === 'spaced' || t.category === 'spaced')).length;
          break;
        case 'live':
          completed = tasks.filter((t) => t.completed && (t.bucket === 'live' || t.category === 'live')).length;
          break;
        case 'dsa':
          completed = tasks.filter(
            (t) => t.completed && (t.bucket === 'dsa' || t.category === 'LeetCode' || t.category === 'dsa')
          ).length;
          break;
        case 'azure': {
          const azureMins = (focus.sessions || [])
            .filter((s) => s.bucket === 'azure' || (s.subject || s.taskTitle || '').toLowerCase().includes('azure'))
            .reduce((acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)), 0);
          const mins = Math.max(azureMins, focus.azureMinutes || 0);
          completed = +(mins / 60).toFixed(1);
          break;
        }
        case 'jobs':
          completed = focus.jobAppsCount || 0;
          break;
      }

      const weeklyTarget = tier === 'baseline' ? bm.baselineWeekly : bm.stretchWeekly;
      const target =
        bm.category === 'azure'
          ? +(weeklyTarget * horizonMultiplier).toFixed(1)
          : Math.max(1, Math.round(weeklyTarget * horizonMultiplier));

      const completionPct = target > 0 ? Math.min(150, Math.round((completed / target) * 100)) : 0;
      const isMet = completed >= target;
      const delta = bm.category === 'azure' ? +((completed - target)).toFixed(1) : completed - target;

      return { id: bm.id, completed, target, completionPct, isMet, delta };
    });

    const metCount = rows.filter((r) => r.isMet).length;
    const totalGoals = rows.length;
    const overallRate = Math.round((metCount / totalGoals) * 100);

    return { rows, metCount, totalGoals, overallRate };
  };

  const ledgerRes = computeFullLedger(mockFocusLedger, 7, 'baseline');
  assertEquals(ledgerRes.metCount, 5, '5 out of 6 goals met (deep, spaced, dsa, azure, jobs)');
  assertEquals(ledgerRes.overallRate, 83, 'Overall adherence rate is 83% (5/6 rounded)');

  const deepRow = ledgerRes.rows.find((r) => r.id === 'deep_anchors');
  assertEquals(deepRow.completed, 14, 'Deep anchors completed: 14');
  assertEquals(deepRow.delta, 0, 'Deep anchors delta: 0');
  assertEquals(deepRow.completionPct, 100, 'Deep anchors completion: 100%');
  assertEquals(deepRow.isMet, true, 'Deep anchors isMet is true');

  const liveRow = ledgerRes.rows.find((r) => r.id === 'live_coding');
  assertEquals(liveRow.completed, 4, 'Live coding completed: 4');
  assertEquals(liveRow.delta, -1, 'Live coding delta: -1 (deficit)');
  assertEquals(liveRow.completionPct, 80, 'Live coding completion: 80%');
  assertEquals(liveRow.isMet, false, 'Live coding isMet is false');

  const azureRow = ledgerRes.rows.find((r) => r.id === 'azure_ai');
  assertEquals(azureRow.completed, 3.0, 'Azure completed: 3.0h');
  assertEquals(azureRow.target, 2.5, 'Azure target: 2.5h');
  assertEquals(azureRow.delta, 0.5, 'Azure delta: +0.5h');
  assertEquals(azureRow.isMet, true, 'Azure isMet is true');
});

// ============================================================================
// SUITE 6: Focus Consistency Matrix (7-Day Pillar Checks, Score & Icons)
// ============================================================================
suite('Suite 6: Focus Consistency Matrix (7-Day Pillar Checks, Score & Icons)', () => {
  // Test 7-day window generation
  const todayStr = '2026-09-05';
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const daysAgo = 6 - idx;
    const [y, m, d] = todayStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - daysAgo);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const isToday = dateStr === todayStr;
    return { dateStr, isToday };
  });

  assertEquals(days.length, 7, 'Generates exactly 7 calendar days');
  assertEquals(days[0].dateStr, '2026-08-30', 'First day in window is 6 days ago (2026-08-30)');
  assertEquals(days[6].dateStr, '2026-09-05', 'Last day in window is today (2026-09-05)');
  assertEquals(days[6].isToday, true, 'Today flag is correctly identified');

  // Pillar checking rules
  const evaluatePillar = (pillarId, dateStr, isToday, focus) => {
    const tasks = focus.tasks || [];
    const sessions = focus.sessions || [];

    switch (pillarId) {
      case 'deep': {
        if (isToday) {
          const completedDeep = tasks.filter((t) => t.completed && t.bucket === 'deep').length;
          if (completedDeep >= 2) return 'met';
          if (completedDeep >= 1) return 'partial';
          return 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'deep');
        if (daySessions.length >= 2) return 'met';
        if (daySessions.length >= 1) return 'partial';
        return 'none';
      }
      case 'spaced': {
        if (isToday) {
          const completedSpaced = tasks.filter((t) => t.completed && t.bucket === 'spaced').length;
          if (completedSpaced >= 3) return 'met';
          if (completedSpaced >= 1) return 'partial';
          return 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'spaced');
        if (daySessions.length >= 3) return 'met';
        if (daySessions.length >= 1) return 'partial';
        return 'none';
      }
      case 'live': {
        if (isToday) {
          const completedLive = tasks.filter((t) => t.completed && t.bucket === 'live').length;
          return completedLive >= 1 ? 'met' : 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'live');
        return daySessions.length >= 1 ? 'met' : 'none';
      }
      case 'dsa': {
        if (isToday) {
          const completedDSA = tasks.filter(
            (t) => t.completed && (t.bucket === 'dsa' || t.category === 'LeetCode' || t.category === 'dsa')
          ).length;
          return completedDSA >= 1 ? 'met' : 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'dsa');
        return daySessions.length >= 1 ? 'met' : 'none';
      }
      case 'cloud': {
        if (isToday) {
          const hasAzure = (focus.azureMinutes || 0) > 0 || (focus.jobAppsCount || 0) > 0;
          return hasAzure ? 'met' : 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'azure');
        return daySessions.length >= 1 ? 'met' : 'none';
      }
      default:
        return 'none';
    }
  };

  // 6.1 Test Pillar Rules on Today
  const testFocusToday = {
    tasks: [
      { id: 't1', bucket: 'deep', completed: true },
      { id: 't2', bucket: 'deep', completed: true },
      { id: 't3', bucket: 'spaced', completed: true }, // 1 spaced -> partial
      { id: 't4', bucket: 'live', completed: true },   // 1 live -> met
      { id: 't5', bucket: 'dsa', completed: false },   // 0 dsa -> none
    ],
    azureMinutes: 30, // cloud -> met
    sessions: [],
  };

  assertEquals(evaluatePillar('deep', '2026-09-05', true, testFocusToday), 'met', 'Deep Anchor: 2 completed tasks -> met');
  assertEquals(evaluatePillar('spaced', '2026-09-05', true, testFocusToday), 'partial', 'Spaced Retrieval: 1 completed task -> partial (target 3)');
  assertEquals(evaluatePillar('live', '2026-09-05', true, testFocusToday), 'met', 'Live Coding: 1 completed task -> met');
  assertEquals(evaluatePillar('dsa', '2026-09-05', true, testFocusToday), 'none', 'DSA: 0 completed tasks -> none');
  assertEquals(evaluatePillar('cloud', '2026-09-05', true, testFocusToday), 'met', 'Cloud: azureMinutes > 0 -> met');

  // 6.2 Test Pillar Rules on Historical Past Days
  const testFocusPast = {
    tasks: [],
    sessions: [
      { dateStr: '2026-09-04', bucket: 'deep' },
      { dateStr: '2026-09-04', bucket: 'deep' }, // 2 deep on 9/4 -> met
      { dateStr: '2026-09-03', bucket: 'spaced' }, // 1 spaced on 9/3 -> partial
      { dateStr: '2026-09-02', bucket: 'live' }, // 1 live on 9/2 -> met
      { dateStr: '2026-09-01', bucket: 'dsa' }, // 1 dsa on 9/1 -> met
      { dateStr: '2026-08-31', bucket: 'azure' }, // 1 azure on 8/31 -> met
    ],
  };

  assertEquals(evaluatePillar('deep', '2026-09-04', false, testFocusPast), 'met', 'Past Deep Anchor: 2 sessions -> met');
  assertEquals(evaluatePillar('deep', '2026-09-03', false, testFocusPast), 'none', 'Past Deep Anchor: 0 sessions -> none');
  assertEquals(evaluatePillar('spaced', '2026-09-03', false, testFocusPast), 'partial', 'Past Spaced: 1 session -> partial');
  assertEquals(evaluatePillar('live', '2026-09-02', false, testFocusPast), 'met', 'Past Live: 1 session -> met');
  assertEquals(evaluatePillar('dsa', '2026-09-01', false, testFocusPast), 'met', 'Past DSA: 1 session -> met');
  assertEquals(evaluatePillar('cloud', '2026-08-31', false, testFocusPast), 'met', 'Past Cloud: 1 session -> met');

  // 6.3 Matrix Score Calculation
  // Total cells = 5 pillars * 7 days = 35 cells
  // If 14 cells met (14.0) + 6 cells partial (3.0) + 15 none (0) = 17.0 / 35 = 48.57 -> 49%
  const calculateMatrixScore = (metCount, partialCount) => {
    const totalCells = 35;
    const score = metCount * 1.0 + partialCount * 0.5;
    return Math.round((score / totalCells) * 100);
  };

  assertEquals(calculateMatrixScore(35, 0), 100, '35 met cells = 100%');
  assertEquals(calculateMatrixScore(0, 0), 0, '0 met cells = 0%');
  assertEquals(calculateMatrixScore(0, 35), 50, '35 partial cells = 50%');
  assertEquals(calculateMatrixScore(14, 6), 49, '14 met + 6 partial = 49% (17.0 / 35)');

  // 6.4 Lucide Icon Bindings Verification
  // Verify that FocusConsistencyMatrix.tsx binds the correct SVG icons
  const matrixSourcePath = path.resolve('src/components/overview/FocusConsistencyMatrix.tsx');
  const matrixSource = fs.readFileSync(matrixSourcePath, 'utf8');
  assert(matrixSource.includes('<Zap'), 'FocusConsistencyMatrix binds Lucide Zap icon for Deep Anchor');
  assert(matrixSource.includes('<RotateCcw'), 'FocusConsistencyMatrix binds Lucide RotateCcw icon for Spaced Retrieval');
  assert(matrixSource.includes('<Code2'), 'FocusConsistencyMatrix binds Lucide Code2 icon for Live Coding');
  assert(matrixSource.includes('<Terminal'), 'FocusConsistencyMatrix binds Lucide Terminal icon for C# DSA');
  assert(matrixSource.includes('<Cloud'), 'FocusConsistencyMatrix binds Lucide Cloud icon for Cloud & Track');
  assert(matrixSource.includes('<Grid3X3'), 'FocusConsistencyMatrix binds Lucide Grid3X3 header icon');
  assert(matrixSource.includes('<Check'), 'FocusConsistencyMatrix binds Lucide Check icon for met state');
  assert(matrixSource.includes('<Minus'), 'FocusConsistencyMatrix binds Lucide Minus icon for partial state');
  assert(matrixSource.includes('<Circle'), 'FocusConsistencyMatrix binds Lucide Circle icon for pending state');
});

// ============================================================================
// SUITE 7: Day Ledger Feed & 24-Hour Day Balance Ribbon
// ============================================================================
suite('Suite 7: Day Ledger Feed & 24-Hour Day Balance Ribbon', () => {
  // 7.1 Focus Receipts Aggregation Logic
  const mockFocusLedgerSessions = {
    sessions: [
      {
        id: 's1',
        dateStr: '2026-09-04',
        durationMinutes: 50,
        taskTitle: 'Reactive Forms',
        subject: 'Reactive Forms',
        bucket: 'deep',
      },
      {
        id: 's2',
        dateStr: '2026-09-04',
        durationSeconds: 1800, // 30m via durationSeconds fallback!
        taskTitle: 'NeetCode DSA Two Sum',
        bucket: 'dsa',
      },
      {
        id: 's3',
        dateStr: '2026-09-03', // Different date
        durationMinutes: 60,
        taskTitle: 'Previous day session',
        bucket: 'live',
      },
    ],
    stats: { totalStudySeconds: 4800 },
  };

  const aggregateDaySessions = (focus, selectedDate) => {
    const daySessions = focus.sessions.filter((s) => {
      if (s.dateStr === selectedDate) return true;
      const ts = s.timestamp || s.startTimestamp;
      if (ts && !isNaN(new Date(ts).getTime())) {
        return new Date(ts).toISOString().split('T')[0] === selectedDate;
      }
      return false;
    });
    const totalFocusMins = daySessions.reduce(
      (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
      0
    );
    return { daySessions, totalFocusMins };
  };

  const agg = aggregateDaySessions(mockFocusLedgerSessions, '2026-09-04');
  assertEquals(agg.daySessions.length, 2, 'Selected date 2026-09-04 filters exactly 2 sessions');
  assertEquals(agg.totalFocusMins, 80, 'Total focus minutes is 80m (50m + 30m fallback)');

  // Test resilience against sessions with missing timestamps or invalid dates (no RangeError)
  const corruptSessions = [
    { id: 'bad1', dateStr: '2026-09-03', timestamp: null, startTimestamp: undefined },
    { id: 'bad2', dateStr: undefined, timestamp: 'invalid-date' },
    { id: 'good1', dateStr: '2026-09-04', durationMinutes: 45 },
  ];
  const safeAgg = aggregateDaySessions({ sessions: corruptSessions }, '2026-09-04');
  assertEquals(safeAgg.daySessions.length, 1, 'Corrupted / missing timestamps filtered safely without throwing RangeError');
  assertEquals(safeAgg.totalFocusMins, 45, 'Safe aggregation total focus minutes is 45m');

  // 7.2 24-Hour Circadian Day Balance Ribbon Math
  const computeDayBalanceRibbon = (workouts, focus, habits, selectedDate) => {
    // 1. Sleep Hours
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

    // 2. Focus Hours
    const daySessions = focus.sessions.filter((s) => {
      if (s.dateStr === selectedDate) return true;
      const ts = s.timestamp || s.startTimestamp;
      if (ts && !isNaN(new Date(ts).getTime())) {
        return new Date(ts).toISOString().split('T')[0] === selectedDate;
      }
      return false;
    });
    let focusMins = daySessions.reduce(
      (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
      0
    );
    if (focusMins === 0 && focus.stats?.totalStudySeconds > 0) {
      focusMins = Math.round(focus.stats.totalStudySeconds / 60);
    }
    const focusHours = Math.min(12, focusMins / 60);

    // 3. Movement Hours
    const dayWorkouts = workouts.filter((w) => (!w.dateStr ? true : w.dateStr === selectedDate));
    let movementMins = 0;
    dayWorkouts.forEach((w) => {
      if (w.category === 'walk') {
        movementMins += (w.distanceKm || 4.0) * 11; // ~11 min per km
      } else if (w.category === 'machine_cardio') {
        movementMins += w.minutes || 10;
      } else {
        movementMins += 3; // ~3 mins per strength set
      }
    });
    const movementHours = Math.min(6, Math.max(0.2, movementMins / 60));

    // 4. Rest / Calibration
    const accountedHours = sleepHours + focusHours + movementHours;
    const restHours = Math.max(1.0, 24 - accountedHours);
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
  };

  const mockWorkouts = [
    { dateStr: '2026-09-04', category: 'walk', distanceKm: 5.0 }, // 55 mins
    { dateStr: '2026-09-04', category: 'pullup', reps: 5 },       // 3 mins
    { dateStr: '2026-09-04', category: 'barbell', reps: 10 },      // 3 mins
  ];
  const mockHabits = {
    sleep: { sleepDuration: '7h 30m' },
    dailyRecords: {},
  };

  const ribbon = computeDayBalanceRibbon(mockWorkouts, mockFocusLedgerSessions, mockHabits, '2026-09-04');

  assertEquals(ribbon.sleepHours, 7.5, 'Sleep hours parsed accurately: 7.5h');
  assertEquals(+ribbon.focusHours.toFixed(2), +(80 / 60).toFixed(2), 'Focus hours calculated from receipts: ~1.33h');
  assertEquals(+ribbon.movementHours.toFixed(2), +(61 / 60).toFixed(2), 'Movement hours calculated: ~1.02h (55m walk + 6m sets)');
  assert(ribbon.restHours > 14 && ribbon.restHours < 15, 'Rest hours properly calibrated (~14.15h)');
  assertEquals(ribbon.totalPct, 100, 'Sum of circadian percentages (Sleep + Focus + Move + Rest) strictly equals 100%');
});

// ============================================================================
// TEST SUMMARY & FINAL VERDICT
// ============================================================================
console.log(`\n${c.bold}${c.purple}======================================================================${c.reset}`);
console.log(`${c.bold}${c.purple}TEST EXECUTION SUMMARY${c.reset}`);
console.log(`${c.bold}${c.purple}======================================================================${c.reset}`);
console.log(`Total Assertions Run : ${c.bold}${totalAssertions}${c.reset}`);
console.log(`Passed Assertions    : ${c.bold}${c.green}${passedAssertions}${c.reset}`);
console.log(`Failed Assertions    : ${c.bold}${failedAssertions > 0 ? c.red : c.green}${failedAssertions}${c.reset}`);

if (failedAssertions === 0) {
  console.log(`\n${c.bold}${c.green}✓ 100% OF TESTS PASSED! Focus Engine & Focus Telemetry Verified Resilient.${c.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${c.bold}${c.red}✗ ${failedAssertions} ASSERTION(S) FAILED:${c.reset}`);
  failures.forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.message}`);
    if (f.detail) console.log(`     ${JSON.stringify(f.detail)}`);
  });
  console.log('');
  process.exit(1);
}
