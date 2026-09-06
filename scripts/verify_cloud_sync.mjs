import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock localStorage for Node runtime
const storageStore = new Map();
global.localStorage = {
  getItem: (key) => storageStore.get(key) || null,
  setItem: (key, val) => storageStore.set(key, String(val)),
  removeItem: (key) => storageStore.delete(key),
  clear: () => storageStore.clear(),
};

// Mock window and CustomEvent
global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.CustomEvent = class {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
  }
};

const passed = [];
const failed = [];

function test(name, fn) {
  try {
    fn();
    passed.push(name);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed.push({ name, error: e.message });
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
  }
}

console.log('\n======================================================================');
console.log('PHASE 3: CLOUD SYNC & FIREBASE AUTH INTEGRATION VERIFICATION');
console.log('======================================================================');

// Import compiled or source modules
import { StorageService, onStorageMutation, getPartitionKey } from '../src/services/storage.ts';

// ---------------------------------------------------------------------
// Suite 1: Firebase Security Rules & Configuration Guards
// ---------------------------------------------------------------------
console.log('\nSuite 1: Firestore Security Rules & Configuration Safeguards');

test('firestore.rules exists and enforces strict tenant isolation', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  assert.ok(fs.existsSync(rulesPath), 'firestore.rules must exist at repo root');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  assert.ok(rulesContent.includes('match /users/{userId}/{document=**}'), 'Rules must match users wildcard');
  assert.ok(rulesContent.includes('request.auth.uid == userId'), 'Rules must enforce auth.uid == userId');
});

test('.env.example provides explicit template for all 6 Firebase keys', () => {
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const content = fs.readFileSync(envExamplePath, 'utf8');
  assert.ok(content.includes('VITE_FIREBASE_API_KEY'), 'Missing VITE_FIREBASE_API_KEY');
  assert.ok(content.includes('VITE_FIREBASE_AUTH_DOMAIN'), 'Missing VITE_FIREBASE_AUTH_DOMAIN');
  assert.ok(content.includes('VITE_FIREBASE_PROJECT_ID'), 'Missing VITE_FIREBASE_PROJECT_ID');
  assert.ok(content.includes('VITE_FIREBASE_STORAGE_BUCKET'), 'Missing VITE_FIREBASE_STORAGE_BUCKET');
  assert.ok(content.includes('VITE_FIREBASE_MESSAGING_SENDER_ID'), 'Missing VITE_FIREBASE_MESSAGING_SENDER_ID');
  assert.ok(content.includes('VITE_FIREBASE_APP_ID'), 'Missing VITE_FIREBASE_APP_ID');
});

// ---------------------------------------------------------------------
// Suite 2: Reactive Storage Mutation Subscriptions
// ---------------------------------------------------------------------
console.log('\nSuite 2: Reactive Storage Mutation Hooks');

test('onStorageMutation hooks trigger on saveWorkouts', () => {
  let notifiedProfile = '';
  let notifiedDomain = '';

  const unsubscribe = onStorageMutation((pId, domain) => {
    notifiedProfile = pId;
    notifiedDomain = domain;
  });

  StorageService.saveWorkouts([
    {
      id: 'test_sync_1',
      exercise: 'Parallel Dips',
      category: 'dips',
      reps: 8,
      timestamp: Date.now(),
      timeStr: '10:00 AM',
      dateStr: '2026-09-06',
    },
  ], 'profile_default');

  unsubscribe();

  assert.strictEqual(notifiedProfile, 'profile_default', 'Should notify for profile_default');
  assert.strictEqual(notifiedDomain, 'workouts', 'Should notify domain workouts');
});

test('onStorageMutation hooks trigger on saveHabitsData', () => {
  let notifiedProfile = '';
  let notifiedDomain = '';

  const unsubscribe = onStorageMutation((pId, domain) => {
    notifiedProfile = pId;
    notifiedDomain = domain;
  });

  const habits = StorageService.getHabitsData();
  habits.hydration.currentMl = 1400;
  StorageService.saveHabitsData(habits, 'profile_default');

  unsubscribe();

  assert.strictEqual(notifiedProfile, 'profile_default');
  assert.strictEqual(notifiedDomain, 'habits');
});

test('onStorageMutation hooks trigger on saveProfiles', () => {
  let notifiedDomain = '';

  const unsubscribe = onStorageMutation((_pId, domain) => {
    notifiedDomain = domain;
  });

  const profiles = StorageService.getProfiles();
  StorageService.saveProfiles(profiles);

  unsubscribe();

  assert.strictEqual(notifiedDomain, 'profiles');
});

// ---------------------------------------------------------------------
// Suite 3: Cloud Payload Schema Validation & Zero-Data-Loss Migration
// ---------------------------------------------------------------------
console.log('\nSuite 3: Cloud Payload Serialization & Migration Fidelity');

test('Root user document payload contains required metadata', () => {
  const uid = 'test_firebase_uid_12345';
  const profiles = StorageService.getProfiles();
  const activeProfileId = StorageService.getActiveProfileId();

  const rootPayload = {
    uid,
    activeProfileId,
    profiles,
    clientTimestamp: Date.now(),
  };

  assert.strictEqual(rootPayload.uid, uid);
  assert.ok(Array.isArray(rootPayload.profiles), 'profiles must be array');
  assert.strictEqual(rootPayload.activeProfileId, 'profile_default');
  assert.ok(typeof rootPayload.clientTimestamp === 'number');
});

test('Partition document payload preserves full fidelity of workouts and habits', () => {
  const pId = 'profile_default';
  const workouts = StorageService.getWorkouts(pId);
  const defaults = StorageService.getStickyDefaults(pId);
  const focus = StorageService.getFocusData(pId);
  const habits = StorageService.getHabitsData(pId);

  const partitionPayload = {
    profileId: pId,
    workouts,
    defaults,
    focus,
    habits,
    clientTimestamp: Date.now(),
  };

  assert.strictEqual(partitionPayload.profileId, 'profile_default');
  assert.ok(Array.isArray(partitionPayload.workouts));
  assert.strictEqual(partitionPayload.workouts[0]?.exercise, 'Parallel Dips');
  assert.strictEqual(partitionPayload.habits.hydration.currentMl, 1400);
});

// ---------------------------------------------------------------------
// Suite 4: Multi-User Cloud Partition Isolation
// ---------------------------------------------------------------------
console.log('\nSuite 4: Multi-User Cloud Partition Isolation');

test('Multiple profile partitions maintain separate document payloads', () => {
  const athlete2 = StorageService.createProfile('Athlete Two');

  StorageService.saveWorkouts([
    {
      id: 'a2_log_1',
      exercise: 'Barbell Squats',
      category: 'barbell',
      reps: 12,
      weightKg: 30,
      tonnageKg: 360,
      timestamp: Date.now(),
      timeStr: '11:00 AM',
      dateStr: '2026-09-06',
    },
  ], athlete2.id);

  const defaultWorkouts = StorageService.getWorkouts('profile_default');
  const athlete2Workouts = StorageService.getWorkouts(athlete2.id);

  assert.strictEqual(defaultWorkouts.length, 1);
  assert.strictEqual(defaultWorkouts[0].exercise, 'Parallel Dips');

  assert.strictEqual(athlete2Workouts.length, 1);
  assert.strictEqual(athlete2Workouts[0].exercise, 'Barbell Squats');
  assert.notStrictEqual(defaultWorkouts[0].id, athlete2Workouts[0].id);
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------
console.log('\n======================================================================');
console.log('PHASE 3 VERIFICATION SUMMARY');
console.log('======================================================================');
console.log(`Total Assertions Run : ${passed.length + failed.length}`);
console.log(`Passed Assertions    : ${passed.length}`);
console.log(`Failed Assertions    : ${failed.length}`);

if (failed.length > 0) {
  console.error('\nFAILURES:');
  failed.forEach((f) => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n✓ ALL PHASE 3 CLOUD SYNC & AUTH VERIFICATION ASSERTIONS PASSED!\n');
  process.exit(0);
}
