import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { StorageService, onStorageMutation } from './storage';
import { getCurrentAuthUser, subscribeToAuthState, type AuthUser, type CloudSyncStatus } from './auth';

let syncStatus: CloudSyncStatus = isFirebaseConfigured() ? 'offline' : 'unconfigured';
let lastSyncedAt: Date | null = null;
const statusListeners = new Set<(status: CloudSyncStatus, lastSyncedAt: Date | null) => void>();

let activeUnsubscribes: Unsubscribe[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingRemoteUpdate = false;

function emitStatus(newStatus: CloudSyncStatus) {
  syncStatus = newStatus;
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
 * Initializes cloud synchronization for an authenticated user.
 */
export async function initializeUserCloudSync(user: AuthUser): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    emitStatus('unconfigured');
    return;
  }

  // Cleanup prior listeners if any
  activeUnsubscribes.forEach((unsub) => unsub());
  activeUnsubscribes = [];

  emitStatus('syncing');

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // First-time cloud account: upload local data to cloud (Zero Data Loss Migration)
      console.log('[PulseSync CloudSync] First-time cloud account detected. Migrating local data to cloud...');
      await uploadFullLocalStateToCloud(user.uid);
    } else {
      // Existing cloud account: pull cloud data down to local
      console.log('[PulseSync CloudSync] Existing cloud account found. Pulling down cloud state...');
      await downloadCloudStateToLocal(user.uid);
    }

    lastSyncedAt = new Date();
    emitStatus('synced');

    // Subscribe to real-time remote updates
    const unsubUser = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (!snapshot.exists() || isApplyingRemoteUpdate) return;
        const data = snapshot.data();
        if (data.profiles && Array.isArray(data.profiles)) {
          isApplyingRemoteUpdate = true;
          try {
            StorageService.saveProfiles(data.profiles);
            if (data.activeProfileId) {
              StorageService.setActiveProfileId(data.activeProfileId);
            }
            window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
          } finally {
            isApplyingRemoteUpdate = false;
          }
        }
      },
      (err) => {
        console.warn('[PulseSync CloudSync] Snapshot listener error:', err);
        emitStatus('error');
      }
    );
    activeUnsubscribes.push(unsubUser);

    const partitionsColRef = collection(db, 'users', user.uid, 'partitions');
    const unsubPartitions = onSnapshot(
      partitionsColRef,
      (querySnap) => {
        if (querySnap.empty || isApplyingRemoteUpdate) return;
        isApplyingRemoteUpdate = true;
        try {
          querySnap.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const pId = change.doc.id;
              const pData = change.doc.data();
              if (pData.workouts) StorageService.saveWorkouts(pData.workouts, pId);
              if (pData.defaults) StorageService.saveStickyDefaults(pData.defaults, pId);
              if (pData.focus) StorageService.saveFocusData(pData.focus, pId);
              if (pData.habits) StorageService.saveHabitsData(pData.habits, pId);
            }
          });
          lastSyncedAt = new Date();
          emitStatus('synced');
          window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
        } finally {
          isApplyingRemoteUpdate = false;
        }
      },
      (err) => {
        console.warn('[PulseSync CloudSync] Partitions listener error:', err);
      }
    );
    activeUnsubscribes.push(unsubPartitions);
  } catch (err) {
    console.error('[PulseSync CloudSync] Failed to initialize cloud sync:', err);
    emitStatus('offline');
  }
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

  // 2. Write partitions for all profiles
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
  }

  console.log('[PulseSync CloudSync] Local state successfully uploaded to Firestore!');
}

/**
 * Downloads cloud state and saves into local storage.
 */
export async function downloadCloudStateToLocal(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) return;
  const userData = userDocSnap.data();

  isApplyingRemoteUpdate = true;
  try {
    if (userData.profiles && Array.isArray(userData.profiles)) {
      StorageService.saveProfiles(userData.profiles);
    }
    if (userData.activeProfileId) {
      StorageService.setActiveProfileId(userData.activeProfileId);
    }

    const profiles = StorageService.getProfiles();
    for (const profile of profiles) {
      const pId = profile.id;
      const pDocRef = doc(db, 'users', uid, 'partitions', pId);
      const pDocSnap = await getDoc(pDocRef);
      if (pDocSnap.exists()) {
        const pData = pDocSnap.data();
        if (pData.workouts) StorageService.saveWorkouts(pData.workouts, pId);
        if (pData.defaults) StorageService.saveStickyDefaults(pData.defaults, pId);
        if (pData.focus) StorageService.saveFocusData(pData.focus, pId);
        if (pData.habits) StorageService.saveHabitsData(pData.habits, pId);
      }
    }
    window.dispatchEvent(new CustomEvent('pulsesync_cloud_sync_updated'));
  } finally {
    isApplyingRemoteUpdate = false;
  }
}

/**
 * Explicit manual sync triggered by user.
 */
export async function syncNow(): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentAuthUser();
  if (!user) {
    return { success: false, error: 'No user signed in. Please sign in with Google first.' };
  }
  const db = getFirebaseDb();
  if (!db) {
    return { success: false, error: 'Firebase is not initialized.' };
  }

  emitStatus('syncing');
  try {
    await uploadFullLocalStateToCloud(user.uid);
    lastSyncedAt = new Date();
    emitStatus('synced');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[PulseSync CloudSync] Manual sync error:', err);
    emitStatus('offline');
    return { success: false, error: message };
  }
}

/**
 * Debounced push to cloud when local storage mutations occur.
 */
export function queueCloudSync(profileId?: string): void {
  if (isApplyingRemoteUpdate) return;
  const user = getCurrentAuthUser();
  if (!user) return;

  const db = getFirebaseDb();
  if (!db) return;

  emitStatus('syncing');

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      const targetId = profileId || StorageService.getActiveProfileId();
      const pDocRef = doc(db, 'users', user.uid, 'partitions', targetId);

      await setDoc(
        pDocRef,
        {
          profileId: targetId,
          workouts: sanitizeForFirestore(StorageService.getWorkouts(targetId)),
          defaults: sanitizeForFirestore(StorageService.getStickyDefaults(targetId)),
          focus: sanitizeForFirestore(StorageService.getFocusData(targetId)),
          habits: sanitizeForFirestore(StorageService.getHabitsData(targetId)),
          updatedAt: serverTimestamp(),
          clientTimestamp: Date.now(),
        },
        { merge: true }
      );

      lastSyncedAt = new Date();
      emitStatus('synced');
    } catch (err) {
      console.warn('[PulseSync CloudSync] Debounced write failed (will retry via offline cache):', err);
      emitStatus('offline');
    }
  }, 1000);
}

// Hook into auth state changes and storage mutations
if (typeof window !== 'undefined') {
  subscribeToAuthState((user) => {
    if (user) {
      initializeUserCloudSync(user);
    } else {
      activeUnsubscribes.forEach((unsub) => unsub());
      activeUnsubscribes = [];
      emitStatus(isFirebaseConfigured() ? 'offline' : 'unconfigured');
    }
  });

  onStorageMutation((profileId) => {
    queueCloudSync(profileId);
  });
}
