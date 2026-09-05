import React from 'react';
import { Check, Plus, X, Zap } from 'lucide-react';
import { FocusTask } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface FocusTaskRosterProps {
  tasks: FocusTask[];
  boundTaskId: string | null;
  onCheckTask: (id: string) => void;
  onBindTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddTask: () => void;
}

export const FocusTaskRoster: React.FC<FocusTaskRosterProps> = ({
  tasks,
  boundTaskId,
  onCheckTask,
  onBindTask,
  onDeleteTask,
  onOpenAddTask,
}) => {
  // Core tasks are deep, live, dsa that are NOT completed
  const coreTasks = tasks.filter(
    (t) => !t.completed && (t.bucket === 'deep' || t.bucket === 'live' || t.bucket === 'dsa')
  );

  const getBadgeStyle = (bucket: string) => {
    if (bucket === 'deep') {
      return {
        label: 'Deep Anchor (50m)',
        className: 'text-sky-300 bg-sky-950/60 border-sky-800/50',
      };
    }
    if (bucket === 'live') {
      return {
        label: 'Live Coding (1h)',
        className: 'text-amber-300 bg-amber-950/60 border-amber-800/50',
      };
    }
    return {
      label: 'C# DSA (1h)',
      className: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/50',
    };
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">
            Today's Tasks
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            onOpenAddTask();
          }}
          className="spring-btn tap-target min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task List Container */}
      {coreTasks.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs font-mono matte-card p-4 border-white/10 bg-[#0d131f]">
          All core tasks completed! Tap{' '}
          <span className="text-white font-bold">+ Add Task</span> to add more.
        </div>
      ) : (
        <div className="space-y-2.5">
          {coreTasks.map((task) => {
            const isBound = boundTaskId === task.id;
            const badge = getBadgeStyle(task.bucket);

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl bg-[#111622] border flex items-center justify-between gap-3 transition min-h-[56px] ${
                  isBound
                    ? 'border-sky-400/80 ring-1 ring-sky-400/30 shadow-lg shadow-sky-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Complete Checkbox + Title */}
                <div className="flex items-start gap-3 truncate min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      onCheckTask(task.id);
                    }}
                    className="w-7 h-7 rounded-lg border border-white/25 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-transparent hover:text-emerald-400 text-xs transition mt-0.5 shrink-0 tap-target min-h-[44px] min-w-[44px]"
                    aria-label={`Mark ${task.title} as completed`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="truncate min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 font-mono text-[11px] flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-slate-400">{task.category}</span>
                      {(task.activeSeconds ?? 0) > 0 && (
                        <span className="text-sky-400 text-[10px] font-mono font-semibold bg-sky-950/60 border border-sky-800/40 px-1.5 py-0.5 rounded">
                          ⏱️ {Math.max(1, Math.round((task.activeSeconds || 0) / 60))}m logged
                        </span>
                      )}
                      {task.startedAt && !task.activeSeconds && (
                        <span className="text-sky-400 text-[10px] font-mono">
                          Started: {task.startedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Focus + Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      onBindTask(task.id);
                    }}
                    className={`spring-btn px-3 py-2 rounded-xl text-xs font-bold min-h-[44px] flex items-center gap-1.5 tap-target transition active:scale-95 ${
                      isBound
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-[#1a2233] text-slate-200 hover:text-white border border-white/10'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isBound ? 'Active' : 'Focus'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      onDeleteTask(task.id);
                    }}
                    className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition tap-target min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Delete task ${task.title}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
