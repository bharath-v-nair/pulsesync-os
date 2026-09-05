import React from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { HabitsData } from '../../types';
import {
  computeAdherenceLedger,
  HABIT_BENCHMARKS,
  HabitAdherenceRow,
} from '../../utils/habitsMath';
import { getTodayDateStr } from '../../services/storage';

interface HabitsAdherenceLedgerProps {
  habits: HabitsData;
  timeframe: 7 | 14 | 30 | 90;
  selectedDate?: string;
}

export const HabitsAdherenceLedger: React.FC<HabitsAdherenceLedgerProps> = ({
  habits,
  timeframe,
  selectedDate,
}) => {
  const referenceDate = selectedDate || getTodayDateStr();
  const ledger = computeAdherenceLedger(habits.dailyRecords, timeframe, 'baseline', referenceDate);
  const { rows, adherenceRate } = ledger;

  const benchmarkMetaMap = new Map(HABIT_BENCHMARKS.map((b) => [b.id, b]));

  return (
    <div className="matte-card p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Habits Adherence Ledger ({timeframe}D Horizon)
          </h3>
        </div>
        <span className="badge-pill bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-[10px] tabular-nums">
          {adherenceRate}% Target Pace
        </span>
      </div>

      {/* Benchmark Rows */}
      <div className="space-y-2.5">
        {rows.map((row: HabitAdherenceRow) => {
          const meta = benchmarkMetaMap.get(row.id as any);
          const clampedPacing = Math.min(100, Math.max(0, row.completionPct));
          return (
            <div
              key={row.id}
              className="p-3 rounded-xl bg-[#090d16] border border-white/5 space-y-2 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {meta?.name || row.id}
                    </span>
                    {row.isMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {meta?.description || 'Calibrated protocol target'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-mono text-white tabular-nums">
                    {row.completed} / {row.target} {row.unit}
                  </span>
                  <span
                    className={`text-[10px] font-mono block mt-0.5 tabular-nums ${
                      row.isMet ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {row.completionPct}% pacing
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    row.isMet ? 'bg-emerald-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${clampedPacing}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
