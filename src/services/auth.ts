import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, googleAuthProvider, isFirebaseConfigured } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export type CloudSyncStatus = 'unconfigured' | 'offline' | 'syncing' | 'synced' | 'error';

let currentAuthUser: AuthUser | null = null;
const authListeners = new Set<(user: AuthUser | null) => void>();

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

// Initialize listener once auth is available
if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  const auth = getFirebaseAuth();
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      currentAuthUser = mapFirebaseUser(user);
      authListeners.forEach((listener) => {
        try {
          listener(currentAuthUser);
        } catch (err) {
          console.error('[PulseSync Auth] Listener error:', err);
        }
      });
    });
  }
}

export function getCurrentAuthUser(): AuthUser | null {
  return currentAuthUser;
}

export function subscribeToAuthState(callback: (user: AuthUser | null) => void): () => void {
  authListeners.add(callback);
  // Emit current known state immediately
  callback(currentAuthUser);

  return () => {
    authListeners.delete(callback);
  };
}

export async function loginWithGoogle(): Promise<{ user: AuthUser | null; error?: string }> {
  if (!isFirebaseConfigured()) {
    return {
      user: null,
      error: 'Firebase is not yet configured. Please add your API keys to .env.local',
    };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase Auth is unavailable' };
  }

  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const mapped = mapFirebaseUser(result.user);
    currentAuthUser = mapped;
    return { user: mapped };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Google Sign-In failed';
    console.error('[PulseSync Auth] Sign in error:', err);
    return { user: null, error: message };
  }
}

export async function loginAnonymously(): Promise<{ user: AuthUser | null; error?: string }> {
  if (!isFirebaseConfigured()) {
    return {
      user: null,
      error: 'Firebase is not yet configured. Please add your API keys to .env.local',
    };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase Auth is unavailable' };
  }

  try {
    const result = await signInAnonymously(auth);
    const mapped = mapFirebaseUser(result.user);
    currentAuthUser = mapped;
    return { user: mapped };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Anonymous Sign-In failed';
    console.error('[PulseSync Auth] Anonymous sign in error:', err);
    return { user: null, error: message };
  }
}

export async function logoutUser(): Promise<{ error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    currentAuthUser = null;
    return {};
  }

  try {
    await signOut(auth);
    currentAuthUser = null;
    return {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    return { error: message };
  }
}
