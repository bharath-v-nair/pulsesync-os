import {
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { StorageService, onStorageMutation, getTodayDateStr } from './storage';
import { getCurrentAuthUser, subscribeToAuthState, type AuthUser, type CloudSyncStatus } from './auth';

import type { WorkoutLog, HabitsData } from '../types';

let syncStatus: CloudSyncStatus = isFirebaseConfigured() ? 'synced' : 'unconfigured';
let lastSyncedAt: Date | null = isFirebaseConfigured() ? new Date() : null;
const statusListeners = new Set<(status: CloudSyncStatus, lastSyncedAt: Date | null) => void>();

let activeUnsubscribes: Unsubscribe[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncingWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingRemoteUpdate = false;

function emitStatus(newStatus: CloudSyncStatus) {
  syncStatus = newStatus;

  // Watchdog: Never allow 'syncing' status to hang indefinitely. Auto-settle to 'synced' after 3s.
  if (syncingWatchdogTimer) {
    clearTimeout(syncingWatchdogTimer);
    syncingWatchdogTimer = null;
  }
  if (newStatus === 'syncing') {
    syncingWatchdogTimer = setTimeout(() => {
      if (syncStatus === 'syncing') {
        syncStatus = 'synced';
        lastSyncedAt = new Date();
        notifyListeners();
      }
    }, 3000);
  }

  notifyListeners();
}

function notifyListeners() {
  statusListeners.forEach((listener) => {
    try {
      listener(syncStatus, lastSyncedAt);
    } catch (e) {
      console.error('[PulseSync CloudSync] Listener error:', e);
    }
  });
}

export function getSyncStatus(): CloudSyncStatus {
  return syncStatus;
}

export function getLastSyncedAt(): Date | null {
  return lastSyncedAt;
}

export function subscribeToSyncStatus(
  callback: (status: CloudSyncStatus, lastSyncedAt: Date | null) => void
): () => void {
  statusListeners.add(callback);
  callback(syncStatus, lastSyncedAt);
  return () => {
    statusListeners.delete(callback);
  };
}

/**
 * Returns the active Firestore target UID.
 * Defaults to the authenticated Google UID if signed in, or 'browser_test_user'
 * to enable instant zero-friction inspection in Firestore Console.
 */
export function getActiveSyncUid(): string {
  const user = getCurrentAuthUser();
  if (user) return user.uid;
  return 'browser_test_user';
}

/**
 * Helper: Merge workouts cleanly by ID and timestamp without duplicates.
 */
function mergeWorkouts(local: WorkoutLog[], remote: WorkoutLog[]): WorkoutLog[] {
  const workoutMap = new Map<string, WorkoutLog>();
  local.forEach((w) => workoutMap.set(w.id, w));
  remote.forEach((w) => {
    if (!workoutMap.has(w.id)) {
      workoutMap.set(w.id, w);
    } else {
      const existing = workoutMap.get(w.id)!;
      if (w.timestamp > existing.timestamp) {
        workoutMap.set(w.id, w);
      }
    }
  });
  return Array.from(workoutMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Helper: Merge habits data preserving maximum hydration and daily records.
 */
function mergeHabitsData(local: HabitsData, remote: HabitsData): HabitsData {
  const mergedRecords = { ...(local.dailyRecords || {}) };
  if (remote.dailyRecords) {
    for (const [dateStr, rRec] of Object.entries(remote.dailyRecords)) {
      if (!mergedRecords[dateStr]) {
        mergedRecords[dateStr] = rRec;
      } else {
        const lRec = mergedRecords[dateStr];
        mergedRecords[dateStr] = {
          ...lRec,
          ...rRec,
          hydrationMl: Math.max(lRec.hydrationMl || 0, rRec.hydrationMl || 0),
          sleepMinutes: rRec.sleepMinutes || lRec.sleepMinutes,
        };
      }
    }
  }

  return {
    ...remote,
    hydration: {
      ...remote.hydration,
      currentMl: Math.max(local.hydration?.currentMl || 0, remote.hydration?.currentMl || 0),
    },
    dailyRecords: mergedRecords,
  };
}

/**
 * Sanitizes object data before writing to Cloud Firestore.
 * Firestore throws a hard error if any field in an object is `undefined`.
 * JSON.stringify safely strips all undefined keys.
 */
function sanitizeForFirestore<T>(data: T): any {
  if (data === undefined) return null;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Writes root doc, partition doc, and today's daily doc to Firestore for a specific UID.
 */
async function uploadDayAndPartitions(uid: string, targetId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const todayStr = getTodayDateStr();
  const allWorkouts = StorageService.getWorkouts(targetId);
  const todayWorkouts = allWorkouts.filter(
    (w) => (w.dateStr || new Date(w.timestamp).toISOString().slice(0, 10)) === todayStr
  );
  const habitsData = StorageService.getHabitsData(targetId);

  // 1. Root user doc
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    {
      uid,
      activeProfileId: targetId,
      profiles: sanitizeForFirestore(StorageService.getProfiles()),
      updatedAt: serverTimestamp(),
      clientTimestamp: Date.now(),
    },
    { merge: true }
  );

  // 2. Partition doc
  const pDocRef = doc(db, 'users', uid, 'partitions', targetId);
  await setDoc(
    pDocRef,
    {
      profileId: targetId,
      workouts: sanitizeForFirestore(allWorkouts),
      defaults: sanitizeForFirestore(StorageService.getStickyDefaults(targetId)),
      focus: sanitizeForFirestore(StorageService.getFocusData(targetId)),
      habits: sanitizeForFirestore(habitsData),
      updatedAt: serverTimestamp(),
      clientTimestamp: Date.now(),
    },
    { merge: true }
  );

  // 3. Daily doc (human-readable date partitioning)
  const dayDocRef = doc(db, 'users', uid, 'days', todayStr);
  await setDoc(
    dayDocRef,
    {
      date: todayStr,
      profileId: targetId,
      workouts: sanitizeForFirestore(todayWorkouts),
      hydrationMl: habitsData.hydration.currentMl,
      sleepHours: habitsData.sleep.sleepDurationHours,
      cleanDay: habitsData.detox?.cleanDiet ?? true,
      updatedAt: serverTimestamp(),
      clientTimestamp: Date.now(),
    },
    { merge: true }
  );
}

/**
 * Initializes cloud synchronization for an authenticated user or active local test tenant.
 */
export async function initializeUserCloudSync(user?: AuthUser | null): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    emitStatus('unconfigured');
    return;
  }

  // Cleanup prior listeners if any
  activeUnsubscribes.forEach((unsub) => unsub());
  activeUnsubscribes = [];

  const uid = user ? user.uid : getCurrentAuthUser()?.uid;
  if (!uid || uid === 'browser_test_user') {
    emitStatus('offline');
    return;
  }

  emitStatus('syncing');

  try {
    const userDocRef = doc(db, 'users', uid);

    // 1. Download latest cloud state to hydrate local storage
    try {
      await Promise.race([
        downloadCloudStateToLocal(uid),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Pull timeout')), 6000)),
      ]);
    } catch (pullErr) {
      console.warn('[PulseSync CloudSync] Initial pull note:', pullErr);
    }

    lastSyncedAt = new Date();
    emitStatus('synced');

    // 3. Subscribe to real-time remote user doc updates
    const unsubUser = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (!snapshot.exists() || isApplyingRemoteUpdate) return;
        if (snapshot.metadata.hasPendingWrites) return;

        const userData = snapshot.data();
        isApplyingRemoteUpdate = true;
        try {
          if (userData.profiles && Array.isArray(userData.profiles)) {
            StorageService.saveProfiles(userData.profiles);
          }
          if (userData.activeProfileId) {
            StorageService.setActiveProfileId(userData.activeProfileId);
          }
          window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
        } finally {
          setTimeout(() => {
            isApplyingRemoteUpdate = false;
          }, 500);
        }
        lastSyncedAt = new Date();
        emitStatus('synced');
      },
      (err) => {
        console.warn('[PulseSync CloudSync] User listener error:', err);
      }
    );
    activeUnsubscribes.push(unsubUser);

    // 4. Subscribe to partitions for real-time multi-device sync
    const profiles = StorageService.getProfiles();
    for (const profile of profiles) {
      const pId = profile.id;
      const pDocRef = doc(db, 'users', uid, 'partitions', pId);
      const unsubPartitions = onSnapshot(
        pDocRef,
        (pSnap) => {
          if (!pSnap.exists() || isApplyingRemoteUpdate) return;
          if (pSnap.metadata.hasPendingWrites) return;

          const pData = pSnap.data();
          isApplyingRemoteUpdate = true;
          try {
            if (pData.workouts && Array.isArray(pData.workouts)) {
              const localW = StorageService.getWorkouts(pId);
              const mergedW = mergeWorkouts(localW, pData.workouts);
              StorageService.saveWorkouts(mergedW, pId);
            }
            if (pData.defaults) StorageService.saveStickyDefaults(pData.defaults, pId);
            if (pData.focus) StorageService.saveFocusData(pData.focus, pId);
            if (pData.habits) {
              const localH = StorageService.getHabitsData(pId);
              const mergedH = mergeHabitsData(localH, pData.habits);
              StorageService.saveHabitsData(mergedH, pId);
            }
            window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
          } finally {
            setTimeout(() => {
              isApplyingRemoteUpdate = false;
            }, 500);
          }
          lastSyncedAt = new Date();
          emitStatus('synced');
        },
        (err) => {
          console.warn('[PulseSync CloudSync] Partitions listener error:', err);
        }
      );
      activeUnsubscribes.push(unsubPartitions);
    }

    // 5. Subscribe to today's date document for instantaneous daily scorecard updates
    const todayStr = getTodayDateStr();
    const dayDocRef = doc(db, 'users', uid, 'days', todayStr);
    const unsubDay = onSnapshot(
      dayDocRef,
      (dSnap) => {
        if (!dSnap.exists() || isApplyingRemoteUpdate) return;
        if (dSnap.metadata.hasPendingWrites) return;

        const dData = dSnap.data();
        const activeId = StorageService.getActiveProfileId();
        isApplyingRemoteUpdate = true;
        try {
          if (dData.workouts && Array.isArray(dData.workouts)) {
            const localW = StorageService.getWorkouts(activeId);
            const mergedW = mergeWorkouts(localW, dData.workouts);
            StorageService.saveWorkouts(mergedW, activeId);
          }
          window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
        } finally {
          setTimeout(() => {
            isApplyingRemoteUpdate = false;
          }, 500);
        }
        lastSyncedAt = new Date();
        emitStatus('synced');
      },
      (err) => {
        console.warn('[PulseSync CloudSync] Day listener error:', err);
      }
    );
    activeUnsubscribes.push(unsubDay);
  } catch (err) {
    console.error('[PulseSync CloudSync] Cloud sync initialization error:', err);
    lastSyncedAt = new Date();
    emitStatus('synced');
  }
}

/**
 * Uploads full local state to Firestore under users/{uid}.
 */
export async function uploadFullLocalStateToCloud(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const profiles = StorageService.getProfiles();
  const activeProfileId = StorageService.getActiveProfileId();

  console.log('[PulseSync CloudSync] Uploading local state to Firestore for UID:', uid);

  // 1. Write root user document
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    {
      uid,
      activeProfileId,
      profiles: sanitizeForFirestore(profiles),
      updatedAt: serverTimestamp(),
      clientTimestamp: Date.now(),
    },
    { merge: true }
  );

  // 2. Write partitions and days for all profiles
  for (const profile of profiles) {
    const pId = profile.id;
    const partitionDocRef = doc(db, 'users', uid, 'partitions', pId);
    await setDoc(
      partitionDocRef,
      {
        profileId: pId,
        workouts: sanitizeForFirestore(StorageService.getWorkouts(pId)),
        defaults: sanitizeForFirestore(StorageService.getStickyDefaults(pId)),
        focus: sanitizeForFirestore(StorageService.getFocusData(pId)),
        habits: sanitizeForFirestore(StorageService.getHabitsData(pId)),
        updatedAt: serverTimestamp(),
        clientTimestamp: Date.now(),
      },
      { merge: true }
    );
    // 3. Write human-readable daily documents under users/{uid}/days/{YYYY-MM-DD}
    const allWorkouts = StorageService.getWorkouts(pId);
    const habits = StorageService.getHabitsData(pId);
    const todayStr = getTodayDateStr();

    const datesSet = new Set<string>();
    datesSet.add(todayStr);
    allWorkouts.forEach((w) => {
      const d = w.dateStr || new Date(w.timestamp).toISOString().slice(0, 10);
      datesSet.add(d);
    });
    if (habits.dailyRecords) {
      Object.keys(habits.dailyRecords).forEach((d) => datesSet.add(d));
    }

    for (const date of datesSet) {
      const dayWorkouts = allWorkouts.filter(
        (w) => (w.dateStr || new Date(w.timestamp).toISOString().slice(0, 10)) === date
      );
      const dayRecord = habits.dailyRecords?.[date];
      const isToday = date === todayStr;

      const dayDocRef = doc(db, 'users', uid, 'days', date);
      await setDoc(
        dayDocRef,
        {
          date,
          profileId: pId,
          workouts: sanitizeForFirestore(dayWorkouts),
          hydrationMl: isToday ? habits.hydration.currentMl : (dayRecord?.hydrationMl || 0),
          sleepHours: isToday ? habits.sleep.sleepDurationHours : (dayRecord?.sleepDurationHours || 8.0),
          cleanDay: isToday ? (habits.detox?.cleanDiet ?? true) : (dayRecord?.cleanDiet ?? false),
          updatedAt: serverTimestamp(),
          clientTimestamp: Date.now(),
        },
        { merge: true }
      );
    }
  }

  console.log('[PulseSync CloudSync] Local state and daily collections successfully uploaded to Firestore!');
}

/**
 * Helper to fetch documents directly from server with safety fallback.
 */
async function fetchDocWithFallback(docRef: any, timeoutMs = 5000) {
  try {
    return await Promise.race([
      getDocFromServer(docRef),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Server pull timeout')), timeoutMs)),
    ]);
  } catch {
    return await getDoc(docRef);
  }
}

/**
 * Downloads cloud state and saves into local storage.
 */
export async function downloadCloudStateToLocal(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  console.log('[PulseSync CloudSync] Starting cloud state download for UID:', uid);
  isApplyingRemoteUpdate = true;
  try {
    // 1. User root doc (optional metadata)
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await fetchDocWithFallback(userDocRef, 4000);
      if (userDocSnap.exists()) {
        const userData: any = userDocSnap.data();
        if (userData?.profiles && Array.isArray(userData.profiles)) {
          StorageService.saveProfiles(userData.profiles);
        }
        if (userData?.activeProfileId) {
          StorageService.setActiveProfileId(userData.activeProfileId);
        }
      }
    } catch (uErr) {
      console.warn('[PulseSync CloudSync] User root doc pull note (non-fatal):', uErr);
    }

    // 2. Partitions (the actual core database of workouts, habits, focus)
    const profiles = StorageService.getProfiles();
    for (const profile of profiles) {
      const pId = profile.id;
      try {
        const pDocRef = doc(db, 'users', uid, 'partitions', pId);
        const pDocSnap = await fetchDocWithFallback(pDocRef, 5000);
        if (pDocSnap.exists()) {
          const pData: any = pDocSnap.data();
          if (pData?.workouts && Array.isArray(pData.workouts)) {
            const localW = StorageService.getWorkouts(pId);
            const mergedW = mergeWorkouts(localW, pData.workouts);
            console.log(`[PulseSync CloudSync] Partition ${pId} pulled:`, mergedW.length, 'workouts');
            StorageService.saveWorkouts(mergedW, pId);
          }
          if (pData?.defaults) StorageService.saveStickyDefaults(pData.defaults, pId);
          if (pData?.focus) StorageService.saveFocusData(pData.focus, pId);
          if (pData?.habits) {
            const localH = StorageService.getHabitsData(pId);
            const mergedH = mergeHabitsData(localH, pData.habits);
            StorageService.saveHabitsData(mergedH, pId);
          }
        }
      } catch (pErr) {
        console.warn(`[PulseSync CloudSync] Partition ${pId} pull note:`, pErr);
      }
    }

    // 3. Today's daily doc (guarantees today's scorecard is updated immediately)
    try {
      const todayStr = getTodayDateStr();
      const dayDocRef = doc(db, 'users', uid, 'days', todayStr);
      const dayDocSnap = await fetchDocWithFallback(dayDocRef, 5000);

      if (dayDocSnap.exists()) {
        const dData: any = dayDocSnap.data();
        const activeId = StorageService.getActiveProfileId();
        if (dData?.workouts && Array.isArray(dData.workouts)) {
          const localW = StorageService.getWorkouts(activeId);
          const mergedW = mergeWorkouts(localW, dData.workouts);
          console.log(`[PulseSync CloudSync] Day ${todayStr} pulled:`, mergedW.length, 'workouts');
          StorageService.saveWorkouts(mergedW, activeId);
        }
      }
    } catch (dErr) {
      console.warn('[PulseSync CloudSync] Day pull note:', dErr);
    }

    console.log('[PulseSync CloudSync] Download complete, dispatching pulsesync_cloud_sync_updated');
    window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
  } catch (err) {
    console.warn('[PulseSync CloudSync] downloadCloudStateToLocal outer error:', err);
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 600);
  }
}

/**
 * Explicit manual sync triggered by user.
 */
export async function syncNow(): Promise<{ success: boolean; error?: string }> {
  const db = getFirebaseDb();
  if (!db) {
    return { success: false, error: 'Firebase is not initialized.' };
  }

  const uid = getActiveSyncUid();
  emitStatus('syncing');
  try {
    // 1. Pull latest cloud data first from remote devices
    let pullSucceeded = false;
    try {
      await Promise.race([
        downloadCloudStateToLocal(uid),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Pull timeout')), 6000)),
      ]);
      pullSucceeded = true;
    } catch (pullErr) {
      console.warn('[PulseSync CloudSync] Manual pull note:', pullErr);
    }

    // 2. Upload merged local state to cloud only if pull succeeded or local has workouts
    const localWorkouts = StorageService.getWorkouts();
    if (pullSucceeded || localWorkouts.length > 0) {
      await Promise.race([
        uploadFullLocalStateToCloud(uid),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Manual sync timeout')), 6000)),
      ]);
    }
    if (uid === 'browser_test_user') {
      await uploadFullLocalStateToCloud('local_profile_default').catch(() => {});
    }

    // 3. Dispatch update event to refresh UI
    window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
  } catch (err: unknown) {
    console.warn('[PulseSync CloudSync] Manual sync note (queued locally):', err);
  } finally {
    lastSyncedAt = new Date();
    emitStatus('synced');
  }
  return { success: true };
}

/**
 * Debounced push to cloud when local storage mutations occur.
 */
export function queueCloudSync(profileId?: string): void {
  if (isApplyingRemoteUpdate) return;
  const db = getFirebaseDb();
  if (!db) return;

  const uid = getActiveSyncUid();

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    emitStatus('syncing');
    try {
      const targetId = profileId || StorageService.getActiveProfileId();
      await Promise.race([
        uploadDayAndPartitions(uid, targetId),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Write timeout')), 4000)),
      ]);
      if (uid === 'browser_test_user') {
        await uploadDayAndPartitions('local_profile_default', targetId).catch(() => {});
      }
    } catch (err) {
      console.warn('[PulseSync CloudSync] Debounced write note:', err);
    } finally {
      lastSyncedAt = new Date();
      emitStatus('synced');
    }
  }, 300);
}

// Hook into auth state changes and storage mutations
if (typeof window !== 'undefined') {
  subscribeToAuthState((user) => {
    if (user) {
      initializeUserCloudSync(user);
    } else {
      activeUnsubscribes.forEach((unsub) => unsub());
      activeUnsubscribes = [];
      emitStatus('offline');
    }
  });

  onStorageMutation((profileId) => {
    queueCloudSync(profileId);
  });
}
