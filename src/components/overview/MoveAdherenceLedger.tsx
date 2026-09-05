import React, { useState } from 'react';
import { WorkoutLog } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { EXERCISE_BENCHMARKS } from './WeeklyRebalanceCard';

interface MoveAdherenceLedgerProps {
  workouts: WorkoutLog[];
  timeframe?: number;
}

export const MoveAdherenceLedger: React.FC<MoveAdherenceLedgerProps> = ({
  workouts,
  timeframe = 7,
}) => {
  const [targetTier, setTargetTier] = useState<'med' | 'recomp'>('recomp');

  // Multiplier from 7-day weekly benchmarks to current timeframe
  const horizonMultiplier = timeframe / 7;

  // 1. Calculate stats for each of the 8 lifting protocols
  const exerciseRows = EXERCISE_BENCHMARKS.map((bm) => {
    let completedReps = 0;
    let tonnageKg = 0;

    if (bm.category === 'pullup') {
      completedReps = workouts
        .filter((w) => w.category === 'pullup')
        .reduce((sum, w) => sum + (w.reps || 0), 0);
    } else if (bm.category === 'pushup') {
      completedReps = workouts
        .filter((w) => w.category === 'pushup')
        .reduce((sum, w) => sum + (w.reps || 0), 0);
    } else if (bm.category === 'barbell') {
      const matching = workouts.filter(
        (w) => w.category === 'barbell' && w.name.includes(bm.barbellLift || '')
      );
      completedReps = matching.reduce((sum, w) => sum + (w.reps || 0), 0);
      tonnageKg = matching.reduce((sum, w) => sum + (w.reps || 0) * (w.weightKg || 30), 0);
    }

    const weeklyTarget = targetTier === 'med' ? bm.tier1MEDReps : bm.tier2RecompReps;
    const targetReps = Math.round(weeklyTarget * horizonMultiplier);
    const adherencePct = targetReps > 0 ? Math.min(150, Math.round((completedReps / targetReps) * 100)) : 0;
    const isMet = completedReps >= targetReps;
    const delta = completedReps - targetReps;

    return {
      ...bm,
      completedReps,
      targetReps,
      adherencePct,
      tonnageKg,
      isMet,
      delta,
    };
  });

  // 2. Cardio row calculation
  const totalCardioSteps = workouts.reduce((acc, l) => {
    if (l.category === 'walk') {
      if (l.steps != null && l.steps > 0) return acc + l.steps;
      if (l.distanceKm != null && l.distanceKm > 0) return acc + Math.round(l.distanceKm * 1000);
      if (l.name.includes('5k')) return acc + 5000;
      return acc;
    }
    if (l.category === 'machine_cardio') {
      if (l.steps != null && l.steps > 0) return acc + l.steps;
      if (l.minutes != null && l.minutes > 0) return acc + l.minutes * 110;
      return acc;
    }
    return acc;
  }, 0);

  const weeklyCardioTarget = targetTier === 'med' ? 56000 : 70000; // 8k/day vs 10k/day
  const targetCardioSteps = Math.round(weeklyCardioTarget * horizonMultiplier);
  const cardioAdherencePct = targetCardioSteps > 0 ? Math.min(150, Math.round((totalCardioSteps / targetCardioSteps) * 100)) : 0;
  const isCardioMet = totalCardioSteps >= targetCardioSteps;
  const cardioDelta = totalCardioSteps - targetCardioSteps;

  // Cumulative Totals
  const totalBarbellTonnage = exerciseRows.reduce((acc, row) => acc + row.tonnageKg, 0);
  const totalBarbellTargetTonnage = exerciseRows
    .filter((r) => r.category === 'barbell')
    .reduce((acc, r) => acc + r.targetReps * 30, 0);

  const metCount = exerciseRows.filter((r) => r.isMet).length + (isCardioMet ? 1 : 0);
  const totalProtocols = exerciseRows.length + 1;

  return (
    <div className="matte-card p-4 space-y-3.5 border-emerald-500/20 bg-[#090d16] shadow-lg">
      {/* Header with MED / Recomp Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Target vs Actual Adherence Ledger
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Protocol Distribution • {timeframe}D Horizon
            </p>
          </div>
        </div>

        {/* Tier Selector */}
        <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setTargetTier('med');
            }}
            className={`px-2 py-0.5 rounded-lg font-semibold transition-all tap-target ${
              targetTier === 'med'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MED
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setTargetTier('recomp');
            }}
            className={`px-2 py-0.5 rounded-lg font-semibold transition-all tap-target ${
              targetTier === 'recomp'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recomp
          </button>
        </div>
      </div>

      {/* Compliance Overview Banner */}
      <div className="p-2.5 rounded-xl bg-[#0e131d] border border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Compliance Rate:</span>
          <span className="text-emerald-300 font-bold">
            {metCount} / {totalProtocols} Met
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Tonnage: <span className="text-amber-300 font-bold font-mono">{totalBarbellTonnage.toLocaleString()}</span> / {totalBarbellTargetTonnage.toLocaleString()} kg
        </div>
      </div>

      {/* Detailed Protocols Distribution Table / Cards */}
      <div className="space-y-2">
        {exerciseRows.map((row) => (
          <div
            key={row.id}
            className="p-2.5 rounded-xl bg-[#0e131d]/80 border border-white/5 space-y-1.5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">{row.name}</span>
                {row.category === 'barbell' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    30kg
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-bold tabular-nums">
                  {row.completedReps} <span className="text-[10px] text-slate-500 font-normal">/ {row.targetReps} reps</span>
                </span>
                {row.isMet ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Met
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {row.delta}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar & Sub-Metrics */}
            <div className="space-y-1">
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, row.adherencePct)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    row.isMet
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-sky-500 to-blue-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                <span>{row.adherencePct}% of {targetTier.toUpperCase()} target</span>
                {row.category === 'barbell' ? (
                  <span className="text-amber-300/80">{row.tonnageKg.toLocaleString()} kg volume</span>
                ) : (
                  <span className="text-slate-500">Bodyweight</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Cardio Row */}
        <div className="p-2.5 rounded-xl bg-[#0e131d]/80 border border-white/5 space-y-1.5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">Cardio</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Walk/Machine
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-bold tabular-nums">
                {totalCardioSteps.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500 font-normal">/ {targetCardioSteps.toLocaleString()} steps</span>
              </span>
              {isCardioMet ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Met
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {cardioDelta.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, cardioAdherencePct)}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isCardioMet
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-sky-500 to-blue-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
              <span>{cardioAdherencePct}% of {targetTier.toUpperCase()} target</span>
              <span className="text-sky-300/80">~{(totalCardioSteps * 0.0008).toFixed(1)} km equiv</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
