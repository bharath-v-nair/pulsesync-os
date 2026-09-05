import React from 'react';
import { Menu, Activity, BarChart2, Settings } from 'lucide-react';
import { ActiveView, UserProfile } from '../../types';

interface HeaderProps {
  activeView: ActiveView;
  onToggleOverview: () => void;
  onOpenSidebar: () => void;
  onOpenSettings?: () => void;
  activeProfile?: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onToggleOverview,
  onOpenSidebar,
  onOpenSettings,
  activeProfile,
}) => {
  const isOverviewActive = activeView === 'overview';

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

      {/* Right: Actions (Settings & Overview Toggle) */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="spring-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141b29] border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-white text-xs font-mono tap-target transition-all"
            title={`Active Profile: ${activeProfile?.name || 'Default'}`}
            aria-label="User Settings and Profiles"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="hidden sm:inline font-medium text-slate-200 truncate max-w-[80px]">
              {activeProfile?.name || 'Default'}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-amber-300" />
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
