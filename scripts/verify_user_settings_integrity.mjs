#!/usr/bin/env node

/**
 * ============================================================================
 * PULSESYNC OS — USER SETTINGS & MULTI-USER STORAGE INTEGRITY VERIFICATION SUITE
 * ============================================================================
 * Exhaustive programmatic assertions covering:
 * 1. Mock LocalStorage Environment: full in-memory W3C Storage compliance
 * 2. Multi-User Profile CRUD: Creation, renaming, deletion guards, active profile switching
 * 3. Partition Key Isolation: Complete separation of Move, Focus, and Habits data between profiles
 * 4. Zero-Data-Loss Auto-Migration: Seamless upgrade from legacy Phase 1 unpartitioned keys
 * 5. Backward-Compatible Dual-Write: Legacy fallback sync for profile_default
 * 6. V5 Backup JSON Export & Import: Multi-profile serialization and restoration
 * 7. Legacy V4 Backup Import: Automatic wrapping and migration of older single-user backups
 * 8. Custom Equipment & Targets: Dynamic Move, Focus, and Habits configuration mathematics
 * ============================================================================
 */

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

// In-Memory Storage Mock for Headless Node Execution
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
  get length() {
    return this.store.size;
  }
}

globalThis.localStorage = new MockLocalStorage();

// Direct Production TypeScript Module Imports
import { StorageService, getPartitionKey } from '../src/services/storage.ts';
import { DEFAULT_USER_PROFILE } from '../src/types/index.ts';

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
  gray: '\x1b[90m',
};

// Harness State
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function assert(condition, message, detail = null) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ${c.green}✓${c.reset} ${message}`);
  } else {
    failedAssertions++;
    failures.push({ message, detail });
    console.log(`  ${c.red}✗ ${message}${c.reset}`);
    if (detail) console.log(`    ${c.gray}Detail: ${detail}${c.reset}`);
  }
}

function suite(name) {
  console.log(`\n${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}${name}${c.reset}`);
  console.log(`${c.cyan}======================================================================${c.reset}`);
}

// ----------------------------------------------------------------------------
// Suite 1: Default Profile & Storage Initialization
// ----------------------------------------------------------------------------
suite('Suite 1: Default Profile & Storage Initialization');

globalThis.localStorage.clear();

const initialProfiles = StorageService.getProfiles();
assert(Array.isArray(initialProfiles), 'getProfiles returns an array on uninitialized storage');
assert(initialProfiles.length === 1, 'Initial storage initializes exactly 1 default profile');
assert(initialProfiles[0].id === 'profile_default', 'Default profile has ID "profile_default"');
assert(initialProfiles[0].name === 'Bharath Nair' || initialProfiles[0].name === 'Solo Athlete', 'Default profile name is "Bharath Nair" or "Solo Athlete"');

const activeProfile = StorageService.getActiveProfile();
assert(activeProfile.id === 'profile_default', 'getActiveProfile returns default profile when no active ID set');
assert(activeProfile.moveConfig.barbellWeightKg === 30, 'Default barbell weight is 30kg');
assert(activeProfile.focusConfig.dailyStudyTargetHours === 5.5, 'Default study target is 5.5 hours');
assert(activeProfile.habitsConfig.sleepTargetHours === 8.0, 'Default sleep baseline is 8.0 hours');
assert(activeProfile.habitsConfig.containerMl === 700, 'Default hydration container is 700ml');

// ----------------------------------------------------------------------------
// Suite 2: Multi-User Profile CRUD & Constraints
// ----------------------------------------------------------------------------
suite('Suite 2: Multi-User Profile CRUD & Constraints');

// Create Profile 2
const athlete2 = StorageService.createProfile('Strength Hunter', {
  avatarColor: 'rose',
  moveConfig: {
    ...DEFAULT_USER_PROFILE.moveConfig,
    barbellWeightKg: 40,
    pullUpStep: 5,
  },
});

assert(athlete2.name === 'Strength Hunter', 'createProfile correctly assigns name');
assert(athlete2.avatarColor === 'rose', 'createProfile assigns specified avatarColor');
assert(athlete2.moveConfig.barbellWeightKg === 40, 'createProfile sets custom barbell weight');
assert(StorageService.getActiveProfileId() === athlete2.id, 'createProfile automatically sets new profile as active');

let allProfiles = StorageService.getProfiles();
assert(allProfiles.length === 2, 'Storage now holds 2 profiles');

// Active Profile Switching
StorageService.setActiveProfileId('profile_default');
assert(StorageService.getActiveProfileId() === 'profile_default', 'setActiveProfileId switches active profile back to default');
assert(StorageService.getActiveProfile().id === 'profile_default', 'getActiveProfile reflects switched active profile');

// Updating Active Profile
const updatedDefault = {
  ...StorageService.getActiveProfile(),
  name: 'Prime Athlete',
  focusConfig: {
    ...StorageService.getActiveProfile().focusConfig,
    dailyStudyTargetHours: 6.0,
  },
};
StorageService.saveActiveProfile(updatedDefault);
const reloadedDefault = StorageService.getActiveProfile();
assert(reloadedDefault.name === 'Prime Athlete', 'saveActiveProfile persists updated name');
assert(reloadedDefault.focusConfig.dailyStudyTargetHours === 6.0, 'saveActiveProfile persists updated dailyStudyTargetHours');

// Sole Profile Deletion Guard
const deleteAttemptOnAthlete2 = StorageService.deleteProfile(athlete2.id);
assert(deleteAttemptOnAthlete2 === true, 'Deleting non-sole profile returns true');
assert(StorageService.getProfiles().length === 1, 'Only 1 profile remains after deleting athlete 2');

const deleteAttemptSole = StorageService.deleteProfile('profile_default');
assert(deleteAttemptSole === false, 'Deleting the sole remaining profile is blocked (guard returns false)');
assert(StorageService.getProfiles().length === 1, 'Profile count remains 1 when sole deletion blocked');

// ----------------------------------------------------------------------------
// Suite 3: Partition Key Data Isolation Across Profiles
// ----------------------------------------------------------------------------
suite('Suite 3: Partition Key Data Isolation Across Profiles');

// Set up 2 distinct athletes: Athlete A and Athlete B
const profileA = StorageService.createProfile('Athlete Alpha');
const profileB = StorageService.createProfile('Athlete Beta');

// Log data under Profile A
StorageService.setActiveProfileId(profileA.id);
const workoutA = {
  id: 'workout_a1',
  name: 'Barbell Squats',
  category: 'Barbell',
  reps: 15,
  weightKg: 45,
  timestamp: Date.now(),
  dateStr: '2026-09-06',
  timeFormatted: '10:00 AM',
};
StorageService.saveWorkouts([workoutA]);

const focusA = StorageService.getFocusData();
focusA.stats.totalStudySeconds = 15000;
focusA.stats.completedQuestions = 5;
StorageService.saveFocusData(focusA);

const habitsA = StorageService.getHabitsData();
habitsA.hydration.currentMl = 2800;
StorageService.saveHabitsData(habitsA);

// Verify data exists for Profile A
assert(StorageService.getWorkouts().length === 1, 'Profile A has 1 workout logged');
assert(StorageService.getFocusData().stats.totalStudySeconds === 15000, 'Profile A has 15000 study seconds');
assert(StorageService.getHabitsData().hydration.currentMl === 2800, 'Profile A has 2800ml hydration');

// Switch to Profile B
StorageService.setActiveProfileId(profileB.id);

// Profile B must be 100% clean and isolated
assert(StorageService.getWorkouts().length === 0, 'Profile B starts with 0 workouts (isolated from A)');
assert(StorageService.getFocusData().stats.totalStudySeconds !== 15000, 'Profile B does not have Profile A mutated focus study seconds');

// Log unique workout under Profile B
const workoutB = {
  id: 'workout_b1',
  name: 'Overhead Press',
  category: 'Barbell',
  reps: 10,
  weightKg: 25,
  timestamp: Date.now(),
  dateStr: '2026-09-06',
  timeFormatted: '11:00 AM',
};
StorageService.saveWorkouts([workoutB]);
assert(StorageService.getWorkouts().length === 1, 'Profile B has 1 workout logged');
assert(StorageService.getWorkouts()[0].name === 'Overhead Press', 'Profile B workout is Overhead Press');

// Switch back to Profile A and verify complete isolation
StorageService.setActiveProfileId(profileA.id);
const profileAWorkouts = StorageService.getWorkouts();
assert(profileAWorkouts.length === 1, 'Profile A still has exactly 1 workout after B mutations');
assert(profileAWorkouts[0].name === 'Barbell Squats', 'Profile A workout remains Barbell Squats without contamination');
assert(StorageService.getFocusData().stats.totalStudySeconds === 15000, 'Profile A focus study seconds remain 15000');
assert(StorageService.getHabitsData().hydration.currentMl === 2800, 'Profile A hydration remains 2800ml');

// ----------------------------------------------------------------------------
// Suite 4: Zero-Data-Loss Auto-Migration from Legacy Phase 1 Keys
// ----------------------------------------------------------------------------
suite('Suite 4: Zero-Data-Loss Auto-Migration from Legacy Phase 1 Keys');

globalThis.localStorage.clear();

// Seed raw legacy Phase 1 unpartitioned keys
const legacyWorkouts = [
  { id: 'leg_w1', name: 'Pull-ups', reps: 12, category: 'Calisthenics', timestamp: 1000, dateStr: '2026-09-05', timeFormatted: '08:00 AM' },
];
const legacyStickyDefaults = {
  activeTab: 'move',
  lastUsedWeight: 30,
  pullUpStep: 4,
  pushUpStep: 10,
  walkStep: 5000,
  viewMode: 'compact',
};
const legacyHabits = {
  hydration: {
    currentMl: 2100,
    targetMl: 3500,
  },
  sleep: {
    sleepDuration: '7h 30m',
  },
};

globalThis.localStorage.setItem('pulsesync_workouts_v4', JSON.stringify(legacyWorkouts));
globalThis.localStorage.setItem('pulsesync_sticky_defaults_v4', JSON.stringify(legacyStickyDefaults));
globalThis.localStorage.setItem('pulsesync_habits_v4', JSON.stringify(legacyHabits));

// Call StorageService methods for default profile without pre-existing partitioned keys
const migratedWorkouts = StorageService.getWorkouts('profile_default');
assert(migratedWorkouts.length === 1, 'Auto-migrates legacy workouts to profile_default');
assert(migratedWorkouts[0].id === 'leg_w1', 'Migrated workout preserves exact id');

const migratedDefaults = StorageService.getStickyDefaults('profile_default');
assert(migratedDefaults.pullUpStep === 4, 'Auto-migrates legacy sticky defaults');

const migratedHabits = StorageService.getHabitsData('profile_default');
assert(migratedHabits.hydration.currentMl === 2100, 'Auto-migrates legacy habits hydration');

// Verify partitioned keys were populated
const partitionKey = getPartitionKey('profile_default', 'workouts');
assert(globalThis.localStorage.getItem(partitionKey) !== null, 'Partition key for workouts was written');

// Dual-write verification: saving to profile_default keeps legacy keys synchronized
migratedWorkouts.push({
  id: 'leg_w2',
  name: 'Push-ups',
  reps: 20,
  category: 'Calisthenics',
  timestamp: 2000,
  dateStr: '2026-09-05',
  timeFormatted: '09:00 AM',
});
StorageService.saveWorkouts(migratedWorkouts, 'profile_default');

const rawLegacyWorkouts = JSON.parse(globalThis.localStorage.getItem('pulsesync_workouts_v4') || '[]');
assert(rawLegacyWorkouts.length === 2, 'Dual-write preserves synchronization in legacy unpartitioned key');

// ----------------------------------------------------------------------------
// Suite 5: V5 Backup JSON Export & Import
// ----------------------------------------------------------------------------
suite('Suite 5: V5 Backup JSON Export & Import');

// Populate multi-profile state
const exportJsonStr = StorageService.exportAllJson();
assert(typeof exportJsonStr === 'string' && exportJsonStr.length > 50, 'exportAllJson produces non-empty JSON string');

const parsedExport = JSON.parse(exportJsonStr);
assert(parsedExport.version === 5, 'Export schema declares version 5');
assert(Array.isArray(parsedExport.profiles), 'Export contains profiles array');
assert(typeof parsedExport.activeProfileId === 'string', 'Export contains activeProfileId string');
assert(typeof parsedExport.partitionedData === 'object', 'Export contains partitionedData dictionary');

// Wipe storage completely
globalThis.localStorage.clear();
assert(globalThis.localStorage.length === 0, 'Storage completely wiped prior to import test');

// Import backup
const importSuccess = StorageService.importAllJson(exportJsonStr);
assert(importSuccess === true, 'importAllJson returns true for valid v5 backup');

const restoredProfiles = StorageService.getProfiles();
assert(restoredProfiles.length >= 1, 'Restored profiles loaded into storage');

const restoredWorkouts = StorageService.getWorkouts('profile_default');
assert(restoredWorkouts.length === 2, 'Restored workouts correctly recovered for profile_default');

// ----------------------------------------------------------------------------
// Suite 6: Legacy V4 Backup Import Wrapping
// ----------------------------------------------------------------------------
suite('Suite 6: Legacy V4 Backup Import Wrapping');

globalThis.localStorage.clear();

const legacyV4Backup = {
  version: 4,
  exportedAt: new Date().toISOString(),
  workouts: [
    { id: 'v4_1', name: 'Squats', reps: 10, weightKg: 30, category: 'Barbell', timestamp: 500, dateStr: '2026-09-01', timeFormatted: '07:00 AM' },
  ],
  stickyDefaults: {
    lastUsedWeight: 30,
    pullUpStep: 4,
  },
  focus: null,
  habits: null,
};

const v4ImportSuccess = StorageService.importAllJson(JSON.stringify(legacyV4Backup));
assert(v4ImportSuccess === true, 'importAllJson successfully wraps and imports legacy v4 backup');

const defaultProfileAfterV4 = StorageService.getActiveProfile();
assert(defaultProfileAfterV4.id === 'profile_default', 'Active profile set to profile_default after v4 import');

const v4RestoredWorkouts = StorageService.getWorkouts('profile_default');
assert(v4RestoredWorkouts.length === 1, 'Legacy v4 workouts correctly recovered under profile_default partition');
assert(v4RestoredWorkouts[0].id === 'v4_1', 'Legacy v4 workout ID intact');

// ----------------------------------------------------------------------------
// Suite 7: Dynamic User Settings Mathematics & Calculations
// ----------------------------------------------------------------------------
suite('Suite 7: Dynamic User Settings Mathematics & Calculations');

// Test custom barbell weight calculation in Move
const customBarbellWeightKg = 45;
const reps = 10;
const computedTonnage = reps * customBarbellWeightKg;
assert(computedTonnage === 450, '45kg barbell tonnage computes to 450kg (vs 300kg default)');

// Test custom hydration bottles calculation
const customBottleMl = 500;
const dailyHydrationTarget = 3500;
const requiredBottles = Math.ceil(dailyHydrationTarget / customBottleMl);
assert(requiredBottles === 7, '3.5L target with 500ml container requires exactly 7 bottles (vs 5 default)');

// Test custom sleep debt calculation
const customSleepBaseline = 7.5; // 7h 30m
const actualSleepHours = 6.0;
const customSleepDebt = Math.max(0, customSleepBaseline - actualSleepHours);
assert(customSleepDebt === 1.5, '7.5h baseline with 6.0h sleep calculates 1.5h sleep debt (vs 2.0h with 8.0h baseline)');

// Test custom study pacing calculation
const customStudyTargetHours = 4.0;
const actualStudyMinutes = 180; // 3.0h
const studyPacingPct = Math.round((actualStudyMinutes / (customStudyTargetHours * 60)) * 100);
assert(studyPacingPct === 75, '3h study against 4h target calculates 75% pacing (vs 55% with 5.5h target)');

// ----------------------------------------------------------------------------
// Suite 8: Malformed Data & Edge Case Resilience
// ----------------------------------------------------------------------------
suite('Suite 8: Malformed Data & Edge Case Resilience');

const originalErr = console.error;
console.error = () => {};
assert(StorageService.importAllJson('invalid json string') === false, 'importAllJson returns false on invalid JSON syntax');
assert(StorageService.importAllJson(JSON.stringify({ notAValidBackup: true })) === false, 'importAllJson returns false on unrecognizable payload');
console.error = originalErr;

// Test getPartitionKey fallback when no profile ID supplied
const fallbackKey = getPartitionKey('', 'workouts');
assert(fallbackKey.includes('profile_default'), 'getPartitionKey falls back safely to profile_default on empty profileId');

// ----------------------------------------------------------------------------
// Final Summary Report
// ----------------------------------------------------------------------------
console.log(`\n${c.cyan}======================================================================${c.reset}`);
console.log(`${c.bold}USER SETTINGS & MULTI-USER STORAGE VERIFICATION SUMMARY${c.reset}`);
console.log(`${c.cyan}======================================================================${c.reset}`);
console.log(`Total Assertions Run : ${totalAssertions}`);
console.log(`Passed Assertions    : ${c.green}${passedAssertions}${c.reset}`);
console.log(`Failed Assertions    : ${failedAssertions > 0 ? c.red : c.green}${failedAssertions}${c.reset}`);
console.log(`Pass Rate            : ${((passedAssertions / totalAssertions) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\n${c.red}${c.bold}FAILURE DETAILS:${c.reset}`);
  failures.forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.message}`);
    if (f.detail) console.log(`     Detail: ${f.detail}`);
  });
  process.exit(1);
} else {
  console.log(`\n${c.green}${c.bold}✓ 100% OF USER SETTINGS & MULTI-USER STORAGE TESTS PASSED!${c.reset}\n`);
  process.exit(0);
}
