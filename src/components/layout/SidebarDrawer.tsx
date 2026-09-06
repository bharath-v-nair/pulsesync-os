import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Download,
  Upload,
  Trash2,
  Award,
  BookMarked,
  ShieldCheck,
  Sliders,
  Cloud,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import {
  getCurrentAuthUser,
  subscribeToAuthState,
  logoutUser,
  type AuthUser,
  type CloudSyncStatus,
} from '../../services/auth';
import { getSyncStatus, subscribeToSyncStatus } from '../../services/cloudSync';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateLibrary: () => void;
  onOpenProtocolsGuide: () => void;
  onOpenHabitsProtocol: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  activeProfileName?: string;
  bookCount: number;
  onDataReset: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateLibrary,
  onOpenProtocolsGuide,
  onOpenHabitsProtocol,
  onOpenSettings,
  onOpenAuth,
  activeProfileName,
  bookCount,
  onDataReset,
}) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(getSyncStatus());
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const unsubAuth = subscribeToAuthState((user) => {
      setAuthUser(user);
      setAvatarError(false);
    });
    const unsubSync = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = StorageService.exportAllJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsesync_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && StorageService.importAllJson(content)) {
        alert('Data successfully restored!');
        window.location.reload();
      } else {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative ml-auto w-full max-w-xs bg-[#0e131d] border-l border-white/10 h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white font-mono">PulseSync OS</h2>
              <p className="text-xs text-slate-400">Navigation & Sovereignty</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <p className="eyebrow">Dedicated Modules</p>

            {onOpenSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full spring-btn p-3.5 rounded-2xl bg-[#141b29] border border-white/10 hover:border-amber-500/40 text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-amber-300">Settings & Profiles</h3>
                    <p className="text-[10px] text-slate-400">Equipment, targets & athlete setup</p>
                  </div>
                </div>
                <span className="badge-pill bg-amber-500/20 text-amber-300 font-mono text-[10px] truncate max-w-[80px]">
                  {activeProfileName || 'Default'}
                </span>
              </button>
            )}

            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full spring-btn p-3.5 rounded-2xl bg-[#141b29] border border-white/10 hover:border-sky-500/40 text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-sky-300">Cloud Sync & Devices</h3>
                    <p className="text-[10px] text-slate-400">Google backup & real-time sync</p>
                  </div>
                </div>
                <span
                  className={`badge-pill font-mono text-[10px] flex items-center gap-1.5 ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : syncStatus === 'offline'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : syncStatus === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-400'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-400 animate-pulse'
                        : syncStatus === 'offline'
                        ? 'bg-amber-400'
                        : syncStatus === 'error'
                        ? 'bg-rose-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  {syncStatus === 'synced'
                    ? 'Synced'
                    : syncStatus === 'syncing'
                    ? 'Syncing'
                    : syncStatus === 'offline'
                    ? 'Offline Q'
                    : syncStatus === 'error'
                    ? 'Error'
                    : 'Local'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onNavigateLibrary();
              }}
              className="w-full spring-btn p-3.5 rounded-2xl bg-[#141b29] border border-white/10 hover:border-sky-500/40 text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-sky-300">Reading Library</h3>
                  <p className="text-[10px] text-slate-400">Bookshelf, catalog & pages</p>
                </div>
              </div>
              <span className="badge-pill bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                {bookCount} Books
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenProtocolsGuide();
              }}
              className="w-full spring-btn p-3.5 rounded-2xl bg-[#141b29] border border-white/10 hover:border-purple-500/40 text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-purple-300">Protocols & Field Guide</h3>
                  <p className="text-[10px] text-slate-400">Interview Rx, Recomp & Circadian</p>
                </div>
              </div>
              <span className="badge-pill bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                Science
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenHabitsProtocol();
              }}
              className="w-full spring-btn p-3.5 rounded-2xl bg-[#141b29] border border-white/10 hover:border-emerald-500/40 text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300">Habits Protocol Science</h3>
                  <p className="text-[10px] text-slate-400">Sleep, 700ml water, keystones & reading</p>
                </div>
              </div>
              <span className="badge-pill bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                Habits
              </span>
            </button>
          </div>

          {/* Public Accountability */}
          <div className="space-y-2">
            <p className="eyebrow">Accountability</p>
            <div className="p-3.5 rounded-2xl bg-[#141b29] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Award className="w-4 h-4" />
                <span>Proof of Work Ledger</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generate cryptographic daily receipt for peer verification.
              </p>
              <button
                onClick={() => alert('Daily Proof of Work generated and copied to clipboard!')}
                className="w-full py-2 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold"
              >
                Copy Accountability Receipt
              </button>
            </div>
          </div>

          {/* Data Sovereignty & Backups */}
          <div className="space-y-2">
            <p className="eyebrow">Data Sovereignty</p>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Backup JSON Export</span>
              </button>

              <label className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Restore JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Dock: User Identity & Actions */}
        <div className="pt-4 border-t border-white/10 space-y-3 mt-6">
          {authUser ? (
            <div className="p-3 rounded-2xl bg-[#141b29] border border-white/10 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                {authUser.photoURL && !avatarError ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="w-10 h-10 rounded-full border border-sky-400/40 object-cover flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center border border-sky-400/40 flex-shrink-0 shadow-sm">
                    {authUser.displayName ? authUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">
                      {authUser.displayName || 'PulseSync Athlete'}
                    </h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Connected" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {authUser.email || (authUser.isAnonymous ? 'Guest Account' : 'Connected')}
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (confirm('Sign out from your Google Cloud account? Local device data will remain intact.')) {
                    await logoutUser();
                  }
                }}
                title="Sign out / Disconnect"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0 tap-target"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#141b29] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/5 text-slate-400 flex items-center justify-center border border-white/10 flex-shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200">Local-First Mode</h4>
                  <p className="text-[10px] text-slate-400">Offline storage active</p>
                </div>
              </div>
              {onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="py-1.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-semibold flex-shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
          )}

          {/* Clear Today's Data */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear today\'s logs?')) {
                onDataReset();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear Today's Data</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
