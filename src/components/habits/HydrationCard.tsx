import React from 'react';
import { Droplets, Plus, Minus, RotateCcw, HelpCircle } from 'lucide-react';
import { HydrationRecord } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import {
  HYDRATION_RING_RADIUS,
  HYDRATION_CIRCUMFERENCE,
  calculateHydrationStats,
  DEFAULT_HYDRATION_TARGET_ML,
} from '../../utils/habitsMath';

interface HydrationCardProps {
  hydration: HydrationRecord;
  onUpdateHydration: (hydration: HydrationRecord) => void;
  onOpenProtocol?: (section: string) => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  hydration,
  onUpdateHydration,
  onOpenProtocol,
}) => {
  const currentMl = Math.max(0, hydration?.currentMl ?? 0);
  const targetMl = (hydration?.targetMl && hydration.targetMl > 0) ? hydration.targetMl : DEFAULT_HYDRATION_TARGET_ML;
  const stats = calculateHydrationStats(currentMl, targetMl);
  const percentage = stats.progressPercent;
  const strokeDashoffset = stats.strokeDashoffset;

  const bottlesCount = (currentMl / 700).toFixed(1);
  const totalBottles = (targetMl / 700).toFixed(0);

  const handleQuickAdd = (amount: number) => {
    triggerHaptic(15);
    const newMl = Math.max(0, currentMl + amount);
    onUpdateHydration({
      ...hydration,
      currentMl: newMl,
      lastLoggedAt: new Date().toISOString(),
    });
  };

  const handleStep = (delta: number) => {
    triggerHaptic(10);
    const newMl = Math.max(0, currentMl + delta);
    onUpdateHydration({
      ...hydration,
      currentMl: newMl,
      lastLoggedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    triggerHaptic(25);
    onUpdateHydration({
      ...hydration,
      currentMl: 0,
      lastLoggedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="matte-card p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Water</h3>
          {onOpenProtocol && (
            <button
              type="button"
              onClick={() => onOpenProtocol('hydration')}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Explain Hydration Protocol"
              aria-label="Hydration Protocol"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-pill bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-[10px] tabular-nums">
            {(targetMl / 1000).toFixed(1)}L Goal ({totalBottles} bottles)
          </span>
          <button
            type="button"
            onClick={handleReset}
            title="Reset water intake"
            aria-label="Reset water"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors tap-target"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Display: SVG Ring + Minimal Status */}
      <div className="flex items-center gap-5 p-3 rounded-2xl bg-[#090d16] border border-white/5">
        {/* Circular SVG Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={HYDRATION_RING_RADIUS}
              className="text-white/5"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active Progress Stroke */}
            <circle
              cx="60"
              cy="60"
              r={HYDRATION_RING_RADIUS}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={HYDRATION_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-sky-400 transition-all duration-300 ease-out"
            />
          </svg>
          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-extrabold font-mono text-white tabular-nums leading-none">
              {percentage}%
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
              {(currentMl / 1000).toFixed(2)}L
            </span>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xs font-mono font-bold text-white tabular-nums whitespace-nowrap">
              {currentMl.toLocaleString()} / {targetMl.toLocaleString()} ml
            </span>
            <span className="text-[10px] font-mono text-sky-400 font-semibold whitespace-nowrap">
              {bottlesCount} / {totalBottles} bottles
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {currentMl >= targetMl ? (
              <span className="text-emerald-400 font-semibold">✓ Daily goal reached</span>
            ) : (
              <span>{(targetMl - currentMl).toLocaleString()} ml remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* 700ml Bottle Quick-Logs */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleQuickAdd(700)}
          className="spring-btn min-h-[44px] px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 border border-sky-500/25 flex items-center justify-center gap-2 tap-target transition-all active:scale-[0.98]"
        >
          <Droplets className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold font-mono text-sky-200">+700 ml Bottle</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(350)}
          className="spring-btn min-h-[44px] px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 border border-sky-500/25 flex items-center justify-center gap-2 tap-target transition-all active:scale-[0.98]"
        >
          <Droplets className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold font-mono text-sky-200">+350 ml Half</span>
        </button>
      </div>

      {/* Fine-Tuning Steppers */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1017] border border-white/5">
        <span className="text-[10px] font-mono text-slate-400 pl-2">
          Adjust (100ml)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStep(-100)}
            disabled={currentMl <= 0}
            className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-slate-300 flex items-center justify-center tap-target active:scale-95 transition-all"
            aria-label="Subtract 100ml"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-16 text-center font-mono font-bold text-xs text-white tabular-nums">
            {currentMl} ml
          </span>
          <button
            type="button"
            onClick={() => handleStep(100)}
            className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 flex items-center justify-center tap-target active:scale-95 transition-all"
            aria-label="Add 100ml"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
