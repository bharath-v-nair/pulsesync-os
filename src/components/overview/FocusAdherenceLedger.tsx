import React, { useState } from 'react';
import { FocusData } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import { Target, CheckCircle2 } from 'lucide-react';

interface FocusAdherenceLedgerProps {
  focus: FocusData;
  timeframe?: number;
}

export interface FocusGoalBenchmark {
  id: string;
  name: string;
  category: 'deep' | 'spaced' | 'live' | 'dsa' | 'azure' | 'jobs';
  unit: string;
  baselineWeekly: number; // 7-day standard pace
  stretchWeekly: number;  // 7-day accelerated pace
  description: string;
}

export const FOCUS_BENCHMARKS: FocusGoalBenchmark[] = [
  {
    id: 'deep_anchors',
    name: 'Deep Anchor Tasks',
    category: 'deep',
    unit: 'tasks',
    baselineWeekly: 14,   // 2 completed tasks / day
    stretchWeekly: 21,    // 3 completed tasks / day
    description: 'Architecture and core technical concepts',
  },
  {
    id: 'spaced_checks',
    name: 'Spaced Retrieval Checks',
    category: 'spaced',
    unit: 'checks',
    baselineWeekly: 21,   // 3 checks / day
    stretchWeekly: 35,    // 5 checks / day
    description: 'Active recall verification from prior sprint days',
  },
  {
    id: 'live_coding',
    name: 'Live Coding Builds',
    category: 'live',
    unit: 'builds',
    baselineWeekly: 5,    // 5 builds / week
    stretchWeekly: 7,     // 1 build / day
    description: 'Hands-on Angular & .NET architecture implementations',
  },
  {
    id: 'dsa_challenges',
    name: 'DSA Problem Solving',
    category: 'dsa',
    unit: 'problems',
    baselineWeekly: 7,    // 1 problem / day
    stretchWeekly: 14,   // 2 problems / day
    description: 'Algorithmic problem solving and whiteboard proofs',
  },
  {
    id: 'azure_ai',
    name: 'Azure AI Practice',
    category: 'azure',
    unit: 'hours',
    baselineWeekly: 2.5,  // 2.5 hrs / week (~20m / day)
    stretchWeekly: 5.0,   // 5.0 hrs / week (~45m Pomodoro / day)
    description: 'Azure AI services, Semantic Kernel, and cloud practice',
  },
  {
    id: 'job_funnel',
    name: 'Job Applications',
    category: 'jobs',
    unit: 'apps',
    baselineWeekly: 20,   // 20 apps / week
    stretchWeekly: 35,   // 5 apps / day
    description: 'Targeted SWE applications and STAR alignment',
  },
];

export const FocusAdherenceLedger: React.FC<FocusAdherenceLedgerProps> = ({
  focus,
  timeframe = 7,
}) => {
  const [goalTier, setGoalTier] = useState<'baseline' | 'stretch'>('baseline');
  const horizonMultiplier = timeframe / 7;
  const tasks = focus.tasks || [];

  // Completed counts derived strictly from verified completed tasks
  const goalRows = FOCUS_BENCHMARKS.map((bm) => {
    let completed = 0;

    switch (bm.category) {
      case 'deep':
        completed = tasks.filter((t) => t.completed && (t.bucket === 'deep' || t.category === 'core')).length;
        break;
      case 'spaced':
        completed = tasks.filter((t) => t.completed && (t.bucket === 'spaced' || t.category === 'spaced')).length;
        break;
      case 'live':
        completed = tasks.filter((t) => t.completed && (t.bucket === 'live' || t.category === 'live')).length;
        break;
      case 'dsa':
        completed = tasks.filter((t) => t.completed && (t.bucket === 'dsa' || t.category === 'LeetCode' || t.category === 'dsa')).length;
        break;
      case 'azure': {
        const azureMins = (focus.sessions || [])
          .filter((s) => s.bucket === 'azure' || (s.subject || s.taskTitle || '').toLowerCase().includes('azure'))
          .reduce((acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)), 0);
        const mins = Math.max(azureMins, focus.azureMinutes || 0);
        completed = +(mins / 60).toFixed(1);
        break;
      }
      case 'jobs':
        completed = focus.jobAppsCount || 0;
        break;
    }

    const weeklyTarget = goalTier === 'baseline' ? bm.baselineWeekly : bm.stretchWeekly;
    const target = bm.category === 'azure'
      ? +(weeklyTarget * horizonMultiplier).toFixed(1)
      : Math.max(1, Math.round(weeklyTarget * horizonMultiplier));

    const completionPct = target > 0 ? Math.min(150, Math.round((completed / target) * 100)) : 0;
    const isMet = completed >= target;
    const delta = bm.category === 'azure'
      ? +((completed - target) as number).toFixed(1)
      : completed - target;

    return {
      ...bm,
      completed,
      target,
      completionPct,
      isMet,
      delta,
    };
  });

  const metCount = goalRows.filter((r) => r.isMet).length;
  const totalGoals = goalRows.length;
  const overallRate = Math.round((metCount / totalGoals) * 100);

  return (
    <div className="matte-card p-3.5 space-y-3.5 border-purple-500/20 bg-[#090d16] shadow-lg">
      {/* Header with Baseline vs Stretch Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Focus & Study Target Ledger
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {timeframe}D Horizon Target vs. Completed Output
            </p>
          </div>
        </div>

        {/* Baseline vs Stretch Goal Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setGoalTier('baseline');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold min-h-[32px] flex items-center justify-center tap-target transition-all ${
              goalTier === 'baseline'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Baseline
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setGoalTier('stretch');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold min-h-[32px] flex items-center justify-center tap-target transition-all ${
              goalTier === 'stretch'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stretch
          </button>
        </div>
      </div>

      {/* Summary Scorecard Strip */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs">
        <div>
          <span className="text-[9px] text-slate-400 block mb-0.5">Goals Met</span>
          <p className="text-sm font-bold text-white tabular-nums">
            {metCount} <span className="text-slate-500 font-normal">/ {totalGoals}</span>
          </p>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block mb-0.5">Completion Rate</span>
          <p
            className={`text-sm font-bold tabular-nums ${
              overallRate >= 80 ? 'text-emerald-400' : overallRate >= 50 ? 'text-amber-400' : 'text-purple-400'
            }`}
          >
            {overallRate}%
          </p>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block mb-0.5">Target Mode</span>
          <p className="text-sm font-bold text-purple-300 truncate">
            {goalTier === 'baseline' ? 'Standard (5.5h)' : 'Accelerated'}
          </p>
        </div>
      </div>

      {/* Goals Table */}
      <div className="space-y-2">
        {goalRows.map((row) => (
          <div
            key={row.id}
            className="p-2.5 rounded-xl bg-[#0c101a] border border-white/10 hover:border-purple-500/30 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white font-mono truncate">{row.name}</span>
                  {row.isMet && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
              </div>

              <div className="text-right shrink-0 font-mono">
                <div className="text-xs font-bold text-white tabular-nums">
                  <span className={row.isMet ? 'text-emerald-300' : 'text-purple-300'}>
                    {row.completed}
                  </span>
                  <span className="text-slate-500 font-normal">
                    {' '}
                    / {row.target} {row.unit}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    row.isMet ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {row.delta >= 0 ? `+${row.delta}` : `${row.delta}`} ({row.completionPct}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, row.completionPct)}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  row.isMet
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
