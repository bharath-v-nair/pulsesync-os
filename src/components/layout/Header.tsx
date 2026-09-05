import React from 'react';
import { Menu, Activity, BarChart2 } from 'lucide-react';
import { ActiveView } from '../../types';

interface HeaderProps {
  activeView: ActiveView;
  onToggleOverview: () => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onToggleOverview,
  onOpenSidebar,
}) => {
  const isOverviewActive = activeView === 'overview';

  return (
    <header className="flex items-center justify-between py-3.5 border-b border-white/[0.07] mb-4">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="spring-btn p-2.5 rounded-xl bg-[#121724] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 tap-target"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-sky-400" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-widest uppercase text-white font-mono">PulseSync</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Local Storage Active"></span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Local-First PWA</p>
          </div>
        </div>
      </div>

      {/* Right: Overview Toggle Button */}
      <button
        onClick={onToggleOverview}
        className={`spring-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all tap-target ${
          isOverviewActive
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400'
            : 'bg-[#141b29] text-slate-300 border border-white/10 hover:border-white/20'
        }`}
      >
        <BarChart2 className="w-3.5 h-3.5" />
        <span>{isOverviewActive ? 'Close Overview' : 'Overview'}</span>
      </button>
    </header>
  );
};
