import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudCheck, CloudOff, RefreshCw, LogIn, LogOut, Shield, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import {
  getCurrentAuthUser,
  subscribeToAuthState,
  loginWithGoogle,
  loginAnonymously,
  logoutUser,
  type AuthUser,
  type CloudSyncStatus,
} from '../../services/auth';
import { subscribeToSyncStatus, syncNow, getActiveSyncUid } from '../../services/cloudSync';
import { isFirebaseConfigured } from '../../services/firebase';
import { getTodayDateStr } from '../../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('unconfigured');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const configured = isFirebaseConfigured();
  const activeUid = getActiveSyncUid();
  const todayStr = getTodayDateStr();

  useEffect(() => {
    const unsubAuth = subscribeToAuthState((currUser) => {
      setUser(currUser);
    });

    const unsubSync = subscribeToSyncStatus((status, syncedAt) => {
      setSyncStatus(status);
      setLastSynced(syncedAt);
    });

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginAnonymously();
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await syncNow();
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#0d121d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Cloud Sync & Identity
              </h2>
              <p className="text-[11px] text-slate-400">Bi-Directional Multi-Device Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          {/* Realtime Status Indicator Card */}
          <div className="p-4 rounded-xl bg-[#131926] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Sync Engine Status</span>
              {syncStatus === 'synced' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CloudCheck className="w-3 h-3" /> Live Synced
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <CloudOff className="w-3 h-3" /> Offline Queue
                </span>
              )}
              {syncStatus === 'unconfigured' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-white/10">
                  <Shield className="w-3 h-3" /> Local-First Mode
                </span>
              )}
            </div>

            {/* Firestore Destination Inspector */}
            <div className="p-3 rounded-lg bg-[#090d16] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="uppercase tracking-wider">Firestore Destination</span>
                <span className="text-sky-400">
                  {lastSynced
                    ? `Synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : 'Ready'}
                </span>
              </div>
              <p className="text-xs font-mono text-emerald-300 break-all select-all font-semibold">
                users/{activeUid}/days/{todayStr}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleManualSync}
                disabled={isLoading}
                className="spring-btn py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Force Cloud Sync
              </button>

              <button
                onClick={() => {
                  if (typeof (window as any).__pulseSyncCheckAppUpdate === 'function') {
                    (window as any).__pulseSyncCheckAppUpdate();
                  } else {
                    window.location.reload();
                  }
                }}
                className="spring-btn py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Fetches the newest PWA bundle and reloads the app"
              >
                <Download className="w-3.5 h-3.5" />
                Update / Reload
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              💡 <span className="text-slate-300 font-medium">Mobile PWA Tip:</span> Tap <span className="text-emerald-400">Update / Reload</span> to fetch new versions, or swipe PulseSync away from Android's Recent Apps screen to restart it.
            </p>
          </div>

          {/* User Account State */}
          {user ? (
            <div className="p-4 rounded-xl bg-[#131926] border border-sky-500/20 space-y-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-sky-400/40 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 font-bold text-sm">
                    {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {user.displayName || 'Authenticated Athlete'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {user.isAnonymous ? 'Anonymous Guest Session' : user.email}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full spring-btn py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          ) : configured ? (
            /* Unauthenticated with Firebase Configured */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#131926] border border-white/10 space-y-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Connect Cloud Storage
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign in to automatically sync workout sets, focus sessions, and habit streaks between your phone and laptop in real-time.
                </p>

                <div className="space-y-2 pt-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Preserves all existing local profile data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>0ms local UI latency (instant tap response)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Automatic disaster recovery & cloud backup</span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full spring-btn py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? 'Connecting...' : 'Sign in with Google'}
              </button>

              <button
                onClick={handleAnonymousLogin}
                disabled={isLoading}
                className="w-full spring-btn py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors text-center"
              >
                Use Anonymous Guest Cloud Session
              </button>
            </div>
          ) : (
            /* Unconfigured (.env.local missing) */
            <div className="p-4 rounded-xl bg-[#131926] border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider">
                  Firebase Credentials Pending
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                PulseSync is currently operating in <strong>Local-First Mode</strong>. All data is securely saved in your browser's persistent storage.
              </p>
              <div className="p-3 rounded-lg bg-[#090d16] border border-white/5 space-y-1.5 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-200">To enable multi-device cloud sync:</p>
                <p>1. Open your Firebase project console</p>
                <p>2. Copy your web app config keys</p>
                <p>3. Paste into <code className="text-sky-400 font-mono">.env.local</code> (template in <code className="text-sky-400 font-mono">.env.example</code>)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
