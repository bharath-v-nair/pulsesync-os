import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore/lite';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const rawConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    rawConfig.apiKey &&
    rawConfig.projectId &&
    !rawConfig.apiKey.includes('your-api-key') &&
    !rawConfig.projectId.includes('your-project-id')
  );
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (appInstance) return appInstance;

  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(rawConfig);
    }
    return appInstance;
  } catch (err) {
    console.warn('[PulseSync Firebase] Initialization skipped or failed:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch (err) {
    console.warn('[PulseSync Firebase] Auth init failed:', err);
    return null;
  }
}

/**
 * Automatically purges any legacy corrupted Firestore multi-tab cache from both
 * localStorage and IndexedDB.
 * Fixes the "400 Bad Request: Unknown SID" channel reconnection error.
 */
export function purgeLegacyFirestoreCache(): void {
  if (typeof window === 'undefined') return;

  // 1. Purge corrupted multi-tab sync keys from localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('firestore_') || k.includes('firestore/'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        console.log('[PulseSync Firebase] Self-healing: Purging corrupted localStorage key:', k);
        localStorage.removeItem(k);
      });
    }
  } catch (e) {
    console.warn('[PulseSync Firebase] LocalStorage purge note:', e);
  }

  // 2. Purge corrupted IndexedDB databases
  if ('indexedDB' in window && typeof window.indexedDB?.databases === 'function') {
    window.indexedDB.databases().then((dbs) => {
      dbs.forEach((db) => {
        if (db.name && db.name.toLowerCase().includes('firestore')) {
          console.log('[PulseSync Firebase] Self-healing: Purging legacy Firestore IndexedDB cache:', db.name);
          try {
            window.indexedDB.deleteDatabase(db.name);
          } catch (e) {
            console.warn('[PulseSync Firebase] Stale DB purge note:', e);
          }
        }
      });
    }).catch(() => {});
  }
}

// Run self-healing immediately on module load in browser
if (typeof window !== 'undefined') {
  purgeLegacyFirestoreCache();
}

export function getFirebaseDb(): Firestore | null {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    // Pure, stateless REST-based Firestore Lite client.
    // Eliminates all WebChannel streaming sockets, Listen/channel retry loops, and 400 Bad Request errors.
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('[PulseSync Firebase] Firestore Lite init failed:', err);
    return null;
  }
}

