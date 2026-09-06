import React, { useState, useEffect } from 'react';
import { Menu, Activity, BarChart2, Cloud, CloudCheck, CloudOff, RefreshCw } from 'lucide-react';
import { ActiveView, UserProfile } from '../../types';
import { subscribeToSyncStatus } from '../../services/cloudSync';
import { subscribeToAuthState, type AuthUser, type CloudSyncStatus } from '../../services/auth';

interface HeaderProps {
  activeView: ActiveView;
  onToggleOverview: () => void;
  onOpenSidebar: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  activeProfile?: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onToggleOverview,
  onOpenSidebar,
  onOpenAuth,
}) => {
  const isOverviewActive = activeView === 'overview';
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('unconfigured');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubSync = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    const unsubAuth = subscribeToAuthState((user) => {
      setAuthUser(user);
    });
    return () => {
      unsubSync();
      unsubAuth();
    };
  }, []);

  return (
    <header className="flex items-center justify-between py-3.5 border-b border-white/[0.07] mb-4 gap-2">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="spring-btn p-2.5 rounded-xl bg-[#121724] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 tap-target shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-sky-400" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-widest uppercase text-white font-mono truncate">PulseSync</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Local Storage Active"></span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">Local-First PWA</p>
          </div>
        </div>
      </div>

      {/* Right: Cloud Sync Pill & Overview Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className={`spring-btn px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border transition-all tap-target ${
              syncStatus === 'synced'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : syncStatus === 'syncing'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : syncStatus === 'offline'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-[#141b29] text-slate-400 border-white/10 hover:border-white/20'
            }`}
            title="Cloud Synchronization & Auth"
            aria-label="Cloud Sync & Auth"
          >
            {syncStatus === 'synced' && <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            {syncStatus === 'offline' && <CloudOff className="w-3.5 h-3.5 text-amber-400" />}
            {syncStatus === 'unconfigured' && <Cloud className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">
              {syncStatus === 'synced' ? (authUser?.displayName ? authUser.displayName.split(' ')[0] : 'Cloud') : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Offline' : 'Local'}
            </span>
          </button>
        )}

        <button
          onClick={onToggleOverview}
          className={`spring-btn px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all tap-target ${
            isOverviewActive
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400'
              : 'bg-[#141b29] text-slate-300 border border-white/10 hover:border-white/20'
          }`}
          aria-label={isOverviewActive ? 'Close Overview' : 'Open Overview'}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">{isOverviewActive ? 'Close' : 'Overview'}</span>
        </button>
      </div>
    </header>
  );
};
