import React from 'react';
import {
  ShieldCheck,
  Check,
  Apple,
  Smartphone,
  Pill,
  CheckCheck,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { KeystonesState, DetoxState } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import { evaluateCleanDay } from '../../utils/habitsMath';

interface KeystonesCardProps {
  keystones: KeystonesState;
  detox: DetoxState;
  onUpdateKeystones: (keystones: KeystonesState) => void;
  onOpenProtocol?: (section: string) => void;
}

export const KeystonesCard: React.FC<KeystonesCardProps> = ({
  keystones,
  detox,
  onUpdateKeystones,
  onOpenProtocol,
}) => {
  const isCleanDay = evaluateCleanDay(keystones);

  // Count core markers completed
  const coreMarkersCount = [
    keystones.cleanDiet,
    keystones.zeroDoomscroll,
    keystones.dailySupplements,
    keystones.bedMade,
  ].filter(Boolean).length;

  const toggleMarker = (key: keyof KeystonesState) => {
    triggerHaptic(15);
    const updatedKeystones: KeystonesState = {
      ...keystones,
      [key]: !keystones[key],
    };
    onUpdateKeystones(updatedKeystones);
  };

  const markers: {
    key: keyof KeystonesState;
    label: string;
    icon: React.ReactNode;
    isCore: boolean;
  }[] = [
    {
      key: 'cleanDiet',
      label: 'Clean Nutrition',
      icon: <Apple className="w-4 h-4 text-emerald-400" />,
      isCore: true,
    },
    {
      key: 'zeroDoomscroll',
      label: 'Zero Doomscrolling',
      icon: <Smartphone className="w-4 h-4 text-sky-400" />,
      isCore: true,
    },
    {
      key: 'dailySupplements',
      label: 'Daily Supplements',
      icon: <Pill className="w-4 h-4 text-amber-400" />,
      isCore: true,
    },
    {
      key: 'bedMade',
      label: 'Bed Made Upon Waking',
      icon: <CheckCheck className="w-4 h-4 text-purple-400" />,
      isCore: true,
    },
    {
      key: 'roomReset',
      label: 'Evening Desk Reset',
      icon: <Sparkles className="w-4 h-4 text-slate-400" />,
      isCore: false,
    },
  ];

  return (
    <div className="matte-card p-4 space-y-3.5">
      {/* Header with Clean Streak and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Keystone Discipline</h3>
          {onOpenProtocol && (
            <button
              type="button"
              onClick={() => onOpenProtocol('keystones')}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Explain Keystone Science"
              aria-label="Keystone Science"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-pill font-mono text-[10px] bg-white/5 text-slate-300 border border-white/10">
            {detox.cleanDays || 0}d Clean Streak
          </span>
          <span
            className={`badge-pill font-mono text-[10px] font-bold ${
              isCleanDay
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {isCleanDay ? '✓ Clean Day Done' : `In Progress (${coreMarkersCount}/4)`}
          </span>
        </div>
      </div>

      {/* Simplified Markers List with Zero Clutter */}
      <div className="space-y-2">
        {markers.map((item) => {
          const isChecked = Boolean(keystones[item.key]);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleMarker(item.key)}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-left tap-target transition-all active:scale-[0.99] ${
                isChecked
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-[#090d16] border-white/5 hover:border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-emerald-500/20' : 'bg-white/5'
                  }`}
                >
                  {item.icon}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold block truncate">
                    {item.label}
                  </span>
                  {item.isCore ? (
                    <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                      Core
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                      Reset
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ml-2 transition-all ${
                  isChecked
                    ? 'bg-emerald-400 text-black shadow-md'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
