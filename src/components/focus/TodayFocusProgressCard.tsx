import React from 'react';
import { FocusTask } from '../../types';

interface TodayFocusProgressCardProps {
  tasks: FocusTask[];
  totalStudySeconds: number;
  targetHours?: number;
}

export const TodayFocusProgressCard: React.FC<TodayFocusProgressCardProps> = ({
  tasks,
  totalStudySeconds,
  targetHours = 5.5,
}) => {
  const deepTasks = tasks.filter((t) => t.bucket === 'deep');
  const deepCompleted = deepTasks.filter((t) => t.completed).length;

  const spacedTasks = tasks.filter((t) => t.bucket === 'spaced');
  const spacedCompleted = spacedTasks.filter((t) => t.completed).length;

  const liveTasks = tasks.filter((t) => t.bucket === 'live');
  const liveCompleted = liveTasks.filter((t) => t.completed).length;

  const dsaTasks = tasks.filter((t) => t.bucket === 'dsa');
  const dsaCompleted = dsaTasks.filter((t) => t.completed).length;

  const totalCompleted = deepCompleted + spacedCompleted + liveCompleted + dsaCompleted;
  const totalTarget = 10;
  const progressPct = Math.min(100, Math.round((totalCompleted / totalTarget) * 100));

  const hrs = Math.floor(totalStudySeconds / 3600);
  const mins = Math.floor((totalStudySeconds % 3600) / 60);
  const formattedStudyTime = `${hrs}h ${String(mins).padStart(2, '0')}m / ${targetHours}h Target`;

  return (
    <section className="matte-card p-4 space-y-3 border-white/10 bg-[#0d131f]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="eyebrow text-slate-300 font-mono text-[11px]">
          Today's Progress
        </span>
        <span className="text-xs font-bold font-mono text-white">
          {totalCompleted} / {totalTarget} Completed ({progressPct}%)
        </span>
      </div>

      {/* Clean Unified Progress Track */}
      <div className="progress-track h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="progress-fill bg-sky-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-sky-400/30"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* High-Level Breakdown Badges */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-[#090d15] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] tracking-wider uppercase">
            Anchors
          </span>
          <span className="font-bold text-sky-400 text-sm">
            {deepCompleted}/3
          </span>
        </div>
        <div className="p-2 rounded-xl bg-[#090d15] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] tracking-wider uppercase">
            Spaced
          </span>
          <span className="font-bold text-purple-400 text-sm">
            {spacedCompleted}/5
          </span>
        </div>
        <div className="p-2 rounded-xl bg-[#090d15] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] tracking-wider uppercase">
            Live Code
          </span>
          <span className="font-bold text-amber-400 text-sm">
            {liveCompleted}/1
          </span>
        </div>
        <div className="p-2 rounded-xl bg-[#090d15] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] tracking-wider uppercase">
            C# DSA
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            {dsaCompleted}/1
          </span>
        </div>
      </div>

      {/* Total Study Time vs Target */}
      <div className="flex justify-between items-center pt-1 border-t border-white/5 text-xs font-mono">
        <span className="text-slate-400">Total Study Time Today</span>
        <span className="text-white font-bold tracking-wide">
          {formattedStudyTime}
        </span>
      </div>
    </section>
  );
};
