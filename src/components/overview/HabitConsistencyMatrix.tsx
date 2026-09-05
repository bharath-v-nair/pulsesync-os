import React from 'react';
import { Moon, Sun, Droplets, ShieldCheck, BookOpen } from 'lucide-react';
import { HabitsData } from '../../types';
import { evaluateConsistencyMatrix, HabitMatrixDay, HabitMatrixCell } from '../../utils/habitsMath';
import { getTodayDateStr } from '../../services/storage';

interface HabitConsistencyMatrixProps {
  habits: HabitsData;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export const HabitConsistencyMatrix: React.FC<HabitConsistencyMatrixProps> = ({
  habits,
  selectedDate,
  onSelectDate,
}) => {
  const todayStr = getTodayDateStr();
  const matrixResult = evaluateConsistencyMatrix(habits.dailyRecords, selectedDate || todayStr);
  const { days, grid, metCount, scorePct } = matrixResult;

  const pillars: { id: string; name: string; icon: React.ReactNode }[] = [
    { id: 'sleep', name: 'Sleep', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'sunlight', name: 'Sunlight', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'hydration', name: 'Water', icon: <Droplets className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'cleanDay', name: 'Clean Day', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'reading', name: 'Reading', icon: <BookOpen className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  return (
    <div className="matte-card p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            7-Day Habit Consistency Matrix
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[10px] tabular-nums">
            {metCount}/35 • {scorePct}% Consistency
          </span>
        </div>
      </div>

      {/* 7-Day Consistency Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[340px] space-y-2">
          {/* Day Headers */}
          <div className="grid grid-cols-[76px_repeat(7,1fr)] gap-1.5 text-center items-center">
            <span className="text-[9px] font-mono text-slate-500 text-left uppercase tracking-wider pl-1">
              Pillar
            </span>
            {days.map((d: HabitMatrixDay) => (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => onSelectDate?.(d.dateStr)}
                className={`py-1 rounded-lg text-center font-mono transition-colors tap-target ${
                  d.isToday
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold'
                    : d.dateStr === selectedDate
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-[10px] block leading-none">{d.dayLabel}</span>
                <span className="text-[8px] text-slate-500 block leading-none mt-0.5">
                  {d.dateStr.slice(8)}
                </span>
              </button>
            ))}
          </div>

          {/* Pillar Rows */}
          {pillars.map((pillar) => {
            const cells = grid[pillar.id] || [];
            return (
              <div
                key={pillar.id}
                className="grid grid-cols-[76px_repeat(7,1fr)] gap-1.5 items-center p-1.5 rounded-xl bg-[#090d16] border border-white/5"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-0.5" title={pillar.name}>
                  <div className="shrink-0">{pillar.icon}</div>
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {pillar.name}
                  </span>
                </div>

                {cells.map((cell: HabitMatrixCell) => {
                  const isMet = cell.status === 'met';
                  const isPartial = cell.status === 'partial';
                  return (
                    <div
                      key={cell.dateStr}
                      title={`${pillar.name} on ${cell.dateStr}: ${cell.status.toUpperCase()}`}
                      className={`h-7 rounded-lg flex items-center justify-center transition-all ${
                        isMet
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                          : isPartial
                          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold'
                          : 'bg-white/[0.03] border border-white/[0.05] text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-mono">
                        {isMet ? '✓' : isPartial ? '½' : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
