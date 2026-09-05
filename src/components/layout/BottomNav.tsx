import React from 'react';
import { Dumbbell, Brain, ShieldCheck } from 'lucide-react';
import { AppTab } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'move', label: 'Move', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'focus', label: 'Focus', icon: <Brain className="w-5 h-5" /> },
    { id: 'habits', label: 'Habits', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  const handleTabClick = (tabId: AppTab) => {
    triggerHaptic(15);
    onSelectTab(tabId);
  };

  return (
    <nav aria-label="Main Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-[#080a0f]/90 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2">
      <div role="tablist" aria-label="Engines" className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`${tab.label} engine`}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all tap-target ${
                isActive
                  ? 'text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-transform ${
                  isActive ? 'bg-sky-500/15 scale-110' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
