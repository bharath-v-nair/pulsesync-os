import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { WorkoutLog } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

export interface ExerciseBenchmark {
  id: string;
  name: string;
  category: 'pullup' | 'pushup' | 'barbell';
  barbellLift?: string;
  tier1MEDReps: number; // Minimum Effective Dose (Maintenance)
  tier2RecompReps: number; // Optimal Hypertrophy & Fat Loss Recomposition
  suggestedSetReps: number;
  maxDailySets: number; // Safe physiological daily cap (prevents cramming injury/fatigue)
  unit: string;
}

export const EXERCISE_BENCHMARKS: ExerciseBenchmark[] = [
  { id: 'pullup', name: 'Half Pull-ups', category: 'pullup', tier1MEDReps: 50, tier2RecompReps: 100, suggestedSetReps: 5, maxDailySets: 4, unit: 'reps' },
  { id: 'pushup', name: 'Push-ups', category: 'pushup', tier1MEDReps: 150, tier2RecompReps: 250, suggestedSetReps: 15, maxDailySets: 3, unit: 'reps' },
  { id: 'squats', name: 'Squats', category: 'barbell', barbellLift: 'Squats', tier1MEDReps: 40, tier2RecompReps: 75, suggestedSetReps: 10, maxDailySets: 2, unit: 'reps' },
  { id: 'ohp', name: 'Overhead Press', category: 'barbell', barbellLift: 'Overhead Press', tier1MEDReps: 40, tier2RecompReps: 70, suggestedSetReps: 8, maxDailySets: 2, unit: 'reps' },
  { id: 'rows', name: 'Bent Rows', category: 'barbell', barbellLift: 'Bent Rows', tier1MEDReps: 40, tier2RecompReps: 75, suggestedSetReps: 10, maxDailySets: 2, unit: 'reps' },
  { id: 'rdls', name: 'RDLs', category: 'barbell', barbellLift: 'RDLs', tier1MEDReps: 30, tier2RecompReps: 50, suggestedSetReps: 8, maxDailySets: 2, unit: 'reps' },
  { id: 'deadlifts', name: 'Deadlifts', category: 'barbell', barbellLift: 'Deadlifts', tier1MEDReps: 30, tier2RecompReps: 50, suggestedSetReps: 6, maxDailySets: 2, unit: 'reps' },
  { id: 'curls', name: 'Bicep Curls', category: 'barbell', barbellLift: 'Bicep Curls', tier1MEDReps: 30, tier2RecompReps: 50, suggestedSetReps: 10, maxDailySets: 2, unit: 'reps' },
];

interface WeeklyRebalanceCardProps {
  workouts: WorkoutLog[];
  onNavigateToMove?: () => void;
}

export const WeeklyRebalanceCard: React.FC<WeeklyRebalanceCardProps> = ({
  workouts,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [targetTier, setTargetTier] = useState<'med' | 'recomp'>('recomp');

  // Determine current day of week (1 = Monday, 7 = Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1-7
  const daysRemaining = Math.max(1, 8 - dayOfWeek); // inclusive of today

  // Calculate current week's logs (last 7 days ending today)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekLogs = workouts.filter((w) => {
    if (!w.dateStr) return false;
    const [y, m, d] = w.dateStr.split('-').map(Number);
    const logDate = new Date(y, m - 1, d);
    return logDate >= weekStart;
  });

  // Calculate reps completed for each benchmark this week
  const benchmarkStats = EXERCISE_BENCHMARKS.map((bm) => {
    let completedReps = 0;
    if (bm.category === 'pullup') {
      completedReps = thisWeekLogs
        .filter((l) => l.category === 'pullup')
        .reduce((sum, l) => sum + (l.reps || 0), 0);
    } else if (bm.category === 'pushup') {
      completedReps = thisWeekLogs
        .filter((l) => l.category === 'pushup')
        .reduce((sum, l) => sum + (l.reps || 0), 0);
    } else if (bm.category === 'barbell') {
      completedReps = thisWeekLogs
        .filter((l) => l.category === 'barbell' && l.name.includes(bm.barbellLift || ''))
        .reduce((sum, l) => sum + (l.reps || 0), 0);
    }

    const targetReps = targetTier === 'med' ? bm.tier1MEDReps : bm.tier2RecompReps;
    const progressPct = Math.min(100, Math.round((completedReps / targetReps) * 100));
    const isMet = completedReps >= targetReps;
    const deficit = Math.max(0, targetReps - completedReps);

    // Physiological Pacing Formula:
    // Deficit is distributed over remaining days, but STRICTLY capped at bm.maxDailySets.
    // Never prescribe an absurd compensatory cram (e.g. 9 sets on Day 6).
    const uncappedDailyNeeded = isMet ? 0 : Math.ceil(deficit / daysRemaining);
    const uncappedSets = Math.ceil(uncappedDailyNeeded / bm.suggestedSetReps);
    const suggestedSets = isMet ? 0 : Math.min(bm.maxDailySets, Math.max(1, uncappedSets));
    const isCapped = !isMet && uncappedSets > bm.maxDailySets;

    return {
      ...bm,
      completedReps,
      targetReps,
      progressPct,
      isMet,
      deficit,
      suggestedSets,
      isCapped,
    };
  });

  // Find priority lagging exercises (those with lowest progress % for chosen tier)
  const laggingExercises = benchmarkStats
    .filter((b) => !b.isMet)
    .sort((a, b) => a.progressPct - b.progressPct);

  const topPriority = laggingExercises.slice(0, 3);
  const targetsMetCount = benchmarkStats.filter((b) => b.isMet).length;

  return (
    <div className="matte-card p-4 space-y-3.5 border-sky-500/20 bg-[#090d16] shadow-lg">
      {/* Minimalist, Clean Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Weekly Rebalance Directive
            </h3>
          </div>

          {/* Goal Selector Toggle: MED vs Recomp */}
          <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setTargetTier('med');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all tap-target ${
                targetTier === 'med'
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
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
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all tap-target ${
                targetTier === 'recomp'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recomp
            </button>
          </div>
        </div>

        {/* Sub-header status bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/5 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">Day {dayOfWeek} of 7</span>
            <span className="text-slate-600">•</span>
            <span>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-slate-300 font-semibold">
              <span className={targetsMetCount === benchmarkStats.length ? 'text-emerald-400' : targetTier === 'recomp' ? 'text-amber-400' : 'text-sky-400'}>
                {targetsMetCount}/{benchmarkStats.length}
              </span> Met
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setIsExpanded((p) => !p);
              }}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-0.5 tap-target"
            >
              <span>{isExpanded ? 'Hide' : 'All Targets'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Rebalance Prescriptions */}
      <div className="space-y-2">
        <p className="text-xs text-slate-300 font-medium">
          {laggingExercises.length === 0 ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              All weekly targets met for {targetTier === 'recomp' ? 'Optimal Recomposition' : 'Maintenance'}! Excellent execution.
            </span>
          ) : (
            <span>
              Target: <strong className={targetTier === 'recomp' ? 'text-amber-300' : 'text-sky-300'}>
                {targetTier === 'recomp' ? 'Growth & Recomp' : 'Minimum Effective Dose'}
              </strong>. Prioritize these micro-doses today:
            </span>
          )}
        </p>

        {topPriority.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {topPriority.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{item.name}</span>
                  <span className={`text-[10px] font-mono font-semibold ${targetTier === 'recomp' ? 'text-amber-400' : 'text-sky-400'}`}>
                    {item.completedReps}/{item.targetReps}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${targetTier === 'recomp' ? 'bg-amber-400' : 'bg-sky-400'}`}
                    style={{ width: `${item.progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span>Today's Rx:</span>
                    {item.isCapped && (
                      <span className="text-[9px] text-amber-400/80 font-mono" title="Capped at safe physiological daily maximum">
                        (Capped)
                      </span>
                    )}
                  </span>
                  <strong className="text-sky-300">
                    {item.suggestedSets}x {item.suggestedSetReps} reps
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded All Benchmarks Breakdown */}
      {isExpanded && (
        <div className="pt-2 border-t border-white/10 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1">
            <span>Exercise</span>
            <span>Weekly Progress ({targetTier === 'recomp' ? 'Recomp Goal' : 'MED Goal'})</span>
          </div>

          <div className="space-y-1.5">
            {benchmarkStats.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.isMet ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0 ml-1 mr-0.5" />
                  )}
                  <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums text-slate-300">
                    <strong className="text-white">{item.completedReps}</strong> / {item.targetReps} reps
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                      item.isMet
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : targetTier === 'recomp'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-sky-500/15 text-sky-300'
                    }`}
                  >
                    {item.isMet ? 'Met ✓' : `${item.progressPct}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
