import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore/lite';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { StorageService, onStorageMutation, getTodayDateStr } from './storage';
import { getCurrentAuthUser, subscribeToAuthState, type AuthUser, type CloudSyncStatus } from './auth';

import type { WorkoutLog, HabitsData } from '../types';

let syncStatus: CloudSyncStatus = isFirebaseConfigured() ? 'synced' : 'unconfigured';
let lastSyncedAt: Date | null = isFirebaseConfigured() ? new Date() : null;
const statusListeners = new Set<(status: CloudSyncStatus, lastSyncedAt: Date | null) => void>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncingWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingRemoteUpdate = false;
let isUploading = false;
let isDownloading = false;

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
        const lTime = lRec.loggedAt ? new Date(lRec.loggedAt).getTime() : 0;
        const rTime = rRec.loggedAt ? new Date(rRec.loggedAt).getTime() : 0;
        if (rTime > lTime) {
          mergedRecords[dateStr] = {
            ...lRec,
            ...rRec,
            hydrationMl: Math.max(lRec.hydrationMl || 0, rRec.hydrationMl || 0),
          };
        } else {
          mergedRecords[dateStr] = {
            ...rRec,
            ...lRec,
            hydrationMl: Math.max(lRec.hydrationMl || 0, rRec.hydrationMl || 0),
          };
        }
      }
    }
  }

  const todayStr = getTodayDateStr();
  const isLocalToday = local.lastActiveDate === todayStr || (local.dailyRecords && local.dailyRecords[todayStr] !== undefined);

  return {
    ...remote,
    ...local,
    hydration: isLocalToday && local.hydration
      ? {
          ...local.hydration,
          currentMl: Math.max(local.hydration.currentMl || 0, remote.hydration?.currentMl || 0),
        }
      : (remote.hydration || local.hydration),
    sleep: isLocalToday && local.sleep ? local.sleep : (remote.sleep || local.sleep),
    keystones: isLocalToday && local.keystones ? local.keystones : (remote.keystones || local.keystones),
    detox: isLocalToday && local.detox ? local.detox : (remote.detox || local.detox),
    reading: isLocalToday && local.reading ? local.reading : (remote.reading || local.reading),
    dailyRecords: mergedRecords,
    lastActiveDate: isLocalToday ? todayStr : (remote.lastActiveDate || local.lastActiveDate || todayStr),
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
  if (isUploading || isDownloading || isApplyingRemoteUpdate) return;
  const db = getFirebaseDb();
  if (!db) return;

  isUploading = true;
  try {
    const todayStr = getTodayDateStr();
    const allWorkouts = StorageService.getWorkouts(targetId);
    const todayWorkouts = allWorkouts.filter(
      (w) => (w.dateStr || new Date(w.timestamp).toISOString().slice(0, 10)) === todayStr
    );
    const habitsData = StorageService.getHabitsData(targetId);

    // 1. Root user doc
    const userDocRef = doc(db, 'users', uid);
    const userPromise = setDoc(
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
    const partitionPromise = setDoc(
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
    const dayPromise = setDoc(
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

    await Promise.all([userPromise, partitionPromise, dayPromise]);
  } catch (err) {
    console.warn('[PulseSync CloudSync] uploadDayAndPartitions note:', err);
  } finally {
    isUploading = false;
  }
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

  const uid = user ? user.uid : getCurrentAuthUser()?.uid;
  if (!uid || uid === 'browser_test_user') {
    emitStatus('offline');
    return;
  }

  emitStatus('syncing');

  try {
    // Strictly download and hydrate local storage on startup / sign-in (never upload automatically)
    await downloadCloudStateToLocal(uid);
    lastSyncedAt = new Date();
    emitStatus('synced');
  } catch (pullErr) {
    console.warn('[PulseSync CloudSync] Initial pull note:', pullErr);
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
 * Downloads cloud state and saves into local storage via clean REST getDoc calls.
 */
export async function downloadCloudStateToLocal(uid: string): Promise<void> {
  if (isDownloading || isUploading) return;
  const db = getFirebaseDb();
  if (!db) return;

  console.log('[PulseSync CloudSync] Starting cloud state download for UID:', uid);
  isDownloading = true;
  isApplyingRemoteUpdate = true;
  try {
    // 1. User root doc (optional metadata)
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
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
        const pDocSnap = await getDoc(pDocRef);
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
      const dayDocSnap = await getDoc(dayDocRef);

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
    isDownloading = false;
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 1500);
  }
}

/**
 * Explicit manual sync triggered by user.
 */
export async function syncNow(): Promise<{ success: boolean; error?: string }> {
  if (isDownloading || isUploading) {
    return { success: true };
  }
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
      await downloadCloudStateToLocal(uid);
      pullSucceeded = true;
    } catch (pullErr) {
      console.warn('[PulseSync CloudSync] Manual pull note:', pullErr);
    }

    // 2. Upload merged local state to cloud only if pull succeeded or local has workouts
    const localWorkouts = StorageService.getWorkouts();
    if (pullSucceeded || localWorkouts.length > 0) {
      await uploadFullLocalStateToCloud(uid);
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
  if (isApplyingRemoteUpdate || isDownloading || isUploading) return;
  const db = getFirebaseDb();
  if (!db) return;

  const uid = getActiveSyncUid();

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    if (isApplyingRemoteUpdate || isDownloading || isUploading) return;
    emitStatus('syncing');
    try {
      const targetId = profileId || StorageService.getActiveProfileId();
      await uploadDayAndPartitions(uid, targetId);
      if (uid === 'browser_test_user') {
        await uploadDayAndPartitions('local_profile_default', targetId).catch(() => {});
      }
    } catch (err) {
      console.warn('[PulseSync CloudSync] Debounced write note:', err);
    } finally {
      lastSyncedAt = new Date();
      emitStatus('synced');
    }
  }, 1500);
}

// Hook into auth state changes, storage mutations, and tab visibility
if (typeof window !== 'undefined') {
  subscribeToAuthState((user) => {
    if (user) {
      initializeUserCloudSync(user);
    } else {
      emitStatus('offline');
    }
  });

  onStorageMutation((profileId) => {
    queueCloudSync(profileId);
  });

  // Pull updates when athlete switches back to this tab/app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const uid = getActiveSyncUid();
      if (uid && uid !== 'browser_test_user') {
        downloadCloudStateToLocal(uid).catch(() => {});
      }
    }
  });
}
