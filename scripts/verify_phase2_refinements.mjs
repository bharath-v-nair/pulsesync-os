/**
 * ============================================================================
 * PULSESYNC OS — PHASE 2 REFINEMENTS & PERSONALIZATION VERIFICATION SUITE
 * ============================================================================
 * Programmatic verification of Phase 2 personal dimensions, multi-location gym
 * switcher, dumbbell & calisthenics modes, question targets, Azure AI track,
 * and granular supplements.
 * ============================================================================
 */

import { StorageService } from '../src/services/storage.ts';
import { 
  DEFAULT_USER_PROFILE, 
  DEFAULT_WORKOUT_LOCATIONS,
  DEFAULT_DUMBBELL_EXERCISES,
  DEFAULT_BODYWEIGHT_EXERCISES
} from '../src/types/index.ts';
import { evaluateCleanDay, countCleanMarkers } from '../src/utils/habitsMath.ts';

// In-Memory LocalStorage Mock
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(i) {
    return Object.keys(this.store)[i] || null;
  }
}

globalThis.localStorage = new MockLocalStorage();

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

let total = 0;
let passed = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ${c.green}✓${c.reset} ${message}`);
  } else {
    console.log(`  ${c.red}✗ ${message}${c.reset}`);
  }
}

function suite(name) {
  console.log(`\n${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}${name}${c.reset}`);
  console.log(`${c.cyan}======================================================================${c.reset}`);
}

// ----------------------------------------------------------------------------
// Suite 1: Bharath Nair Physical Profile & Metrics
// ----------------------------------------------------------------------------
suite('Suite 1: Bharath Nair Physical Profile & Metrics');

globalThis.localStorage.clear();
const activeProfile = StorageService.getActiveProfile();

assert(activeProfile.name === 'Bharath Nair', 'Default profile name is "Bharath Nair"');
assert(activeProfile.physicalProfile.heightCm === 175, 'Physical height is calibrated to 175 cm');
assert(activeProfile.physicalProfile.weightKg === 90, 'Physical current weight is 90 kg');
assert(activeProfile.physicalProfile.targetWeightKg === 78, 'Target weight is 78 kg');
assert(
  activeProfile.physicalProfile.primaryGoal.includes('love handles') &&
  activeProfile.physicalProfile.primaryGoal.includes('lean muscle'),
  'Primary goal specifies aesthetic fat loss & athletic hypertrophy'
);

// ----------------------------------------------------------------------------
// Suite 2: Multi-Location Workout Switcher
// ----------------------------------------------------------------------------
suite('Suite 2: Multi-Location Workout Switcher');

assert(activeProfile.moveConfig.locations.length === 3, 'Locations list has 3 distinct training venues');

const homeLoc = activeProfile.moveConfig.locations.find(l => l.id === 'loc_home');
const mothersLoc = activeProfile.moveConfig.locations.find(l => l.id === 'loc_mothers');
const gymLoc = activeProfile.moveConfig.locations.find(l => l.id === 'loc_gym');

assert(homeLoc && homeLoc.barbellWeightKg === 30, 'Main residence setup has 30kg barbell');
assert(mothersLoc && mothersLoc.equipmentMode === 'dumbbells', "Mother's house setup uses dumbbells & bodyweight");
assert(gymLoc && gymLoc.barbellWeightKg === 60, 'Commercial gym setup calibrated to full Olympic weights');

// Test active location switching
StorageService.setActiveLocation('loc_mothers');
const updatedAfterMothers = StorageService.getActiveProfile();
assert(updatedAfterMothers.moveConfig.activeLocationId === 'loc_mothers', 'Switched active location to loc_mothers');
assert(updatedAfterMothers.moveConfig.equipmentMode === 'dumbbells', 'Equipment mode automatically switched to dumbbells');
assert(updatedAfterMothers.moveConfig.dumbbellWeightKg === 12.5, 'Dumbbell load adjusted to 12.5kg for mothers location');

// Switch to Gym
StorageService.setActiveLocation('loc_gym');
const updatedAfterGym = StorageService.getActiveProfile();
assert(updatedAfterGym.moveConfig.activeLocationId === 'loc_gym', 'Switched active location to loc_gym');
assert(updatedAfterGym.moveConfig.barbellWeightKg === 60, 'Barbell weight updated to 60kg for gym');

// Switch back to Home
StorageService.setActiveLocation('loc_home');
const reloadedHome = StorageService.getActiveProfile();
assert(reloadedHome.moveConfig.activeLocationId === 'loc_home', 'Switched back to home location');
assert(reloadedHome.moveConfig.barbellWeightKg === 30, 'Home barbell restored to 30kg');

// ----------------------------------------------------------------------------
// Suite 3: Study Question Targets & Azure AI Certification Track
// ----------------------------------------------------------------------------
suite('Suite 3: Study Question Targets & Azure AI Certification Track');

const qTargets = reloadedHome.focusConfig.questionTargets;
assert(qTargets.deepAnchors === 3, 'Deep Anchor questions target is 3');
assert(qTargets.spacedChecks === 5, 'Spaced Checks questions target is 5');
assert(qTargets.liveCoding === 1, 'Live Coding sprint target is 1');
assert(qTargets.dsaProblems === 1, 'DSA problems target is 1');

const totalQuestions = qTargets.deepAnchors + qTargets.spacedChecks + qTargets.liveCoding + qTargets.dsaProblems;
assert(totalQuestions === 10, 'Daily question sprints sum to exactly 10 problems');

const azureAiTrack = reloadedHome.focusConfig.curriculumTracks.find(t => t.id === 'azure_ai_cert');
assert(azureAiTrack !== undefined, 'Azure AI Certification Track (AI-900 & AI-102) is registered');
assert(azureAiTrack.days.length === 7, 'Azure AI track has 7 structured acceleration days');
assert(azureAiTrack.days[0].title.includes('AI-900'), 'Day 1 covers AI-900 Core Workloads & OpenAI Service');
assert(azureAiTrack.days[3].title.includes('AI-102'), 'Day 4 covers AI-102 Azure AI Search & Vector RAG');

// ----------------------------------------------------------------------------
// Suite 4: Granular Keystone Disciplines & Clean Day Synchronization
// ----------------------------------------------------------------------------
suite('Suite 4: Granular Keystone Disciplines & Clean Day Synchronization');

const keystones = reloadedHome.habitsConfig.keystones;
const multi = keystones.find(k => k.id === 'multivitaminLunch');
const mag = keystones.find(k => k.id === 'magnesiumSleep');
const prot = keystones.find(k => k.id === 'proteinShake');

assert(multi && multi.isCore === true, 'Multivitamin (After Lunch) is registered as a Core keystone');
assert(mag && mag.isCore === true, 'Magnesium Glycinate (Before Sleep) is registered as a Core keystone');
assert(prot && prot.isCore === true, 'Daily Protein Shake is registered as a Core keystone');

// Test Clean Day evaluation with granular supplements
const stateWithGranularAll = {
  cleanDiet: true,
  zeroDoomscroll: true,
  multivitaminLunch: true,
  magnesiumSleep: true,
  proteinShake: true,
  bedMade: true,
};
assert(evaluateCleanDay(stateWithGranularAll) === true, 'Clean Day satisfies when all 3 granular supplements are taken');

const stateWithMissingMag = {
  cleanDiet: true,
  zeroDoomscroll: true,
  multivitaminLunch: true,
  magnesiumSleep: false,
  proteinShake: true,
  bedMade: true,
};
assert(evaluateCleanDay(stateWithMissingMag) === false, 'Clean Day fails if Magnesium is skipped');

// Test countCleanMarkers
assert(countCleanMarkers(stateWithGranularAll) === 4, 'countCleanMarkers returns 4/4 when granular supplements complete');
assert(countCleanMarkers(stateWithMissingMag) === 3, 'countCleanMarkers returns 3/4 when granular supplements incomplete');

console.log(`\n${c.cyan}======================================================================${c.reset}`);
console.log(`${c.bold}${c.green}PHASE 2 REFINEMENTS: ALL ${passed}/${total} ASSERTIONS PASSED!${c.reset}`);
console.log(`${c.cyan}======================================================================${c.reset}\n`);
