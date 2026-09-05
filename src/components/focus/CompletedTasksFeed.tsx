import React from 'react';
import { Check, RotateCcw, Pencil, Clock, Tag } from 'lucide-react';
import { FocusTask } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface CompletedTasksFeedProps {
  tasks: FocusTask[];
  onRevertTask: (id: string) => void;
  onEditTask: (task: FocusTask) => void;
}

export const CompletedTasksFeed: React.FC<CompletedTasksFeedProps> = ({
  tasks,
  onRevertTask,
  onEditTask,
}) => {
  const completedTasks = tasks.filter(
    (t) => t.completed && t.bucket !== 'azure' && !t.id.startsWith('task_azure_')
  );

  const getBucketBadge = (task: FocusTask) => {
    if (task.bucket === 'spaced') {
      return { label: 'Spaced', color: 'text-purple-400 bg-purple-950/40 border-purple-800/40' };
    }
    if (task.bucket === 'live') {
      return { label: 'Live Code', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
    }
    if (task.bucket === 'dsa') {
      return { label: 'C# DSA', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' };
    }
    return { label: 'Deep Anchor', color: 'text-sky-300 bg-sky-950/40 border-sky-800/40' };
  };

  return (
    <section className="space-y-2 pt-2">
      <div className="flex items-center justify-between px-1">
        <span className="eyebrow text-slate-400 font-mono text-[11px]">
          Completed Today
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {completedTasks.length} completed
        </span>
      </div>

      <div className="matte-card p-4 min-h-[70px] border-white/10 bg-[#0d131f] rounded-2xl">
        {completedTasks.length === 0 ? (
          <div className="text-center py-3 text-slate-500 text-xs font-mono">
            No completed tasks recorded yet today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {completedTasks.map((task) => {
              const badge = getBucketBadge(task);
              const duration =
                task.durationMinutes ||
                (task.activeSeconds
                  ? Math.max(1, Math.round(task.activeSeconds / 60))
                  : task.bucket === 'spaced'
                  ? 10
                  : 50);

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-[#090d15] border border-white/5 space-y-2 text-xs font-mono transition hover:border-white/10"
                >
                  {/* Top row: Title and status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-300 line-through font-medium text-xs leading-relaxed break-words">
                          {task.title}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Edit & Revert */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          onEditTask(task);
                        }}
                        className="spring-btn px-3 py-2 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs font-mono border border-sky-800/40 transition tap-target min-h-[44px] flex items-center gap-1.5 active:scale-95"
                        title="Edit completed task duration, timestamp, notes"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(12);
                          onRevertTask(task.id);
                        }}
                        className="spring-btn px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono border border-white/10 transition tap-target min-h-[44px] flex items-center gap-1.5 active:scale-95"
                        title="Revert back to active tasks"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Revert</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Chips Row: Duration, Time Done, Category */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 pt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>{duration}m spent</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300">
                      {task.startedAt ? `${task.startedAt} → ` : 'Done at '}
                      {task.completedAt || 'Logged'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${badge.color}`}>
                      {badge.label}
                    </span>

                    {task.category && (
                      <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{task.category}</span>
                      </span>
                    )}
                  </div>

                  {/* Notes / Feynman Mental Model Preview if present */}
                  {(task.notes || task.userHypothesis) && (
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 font-sans leading-relaxed">
                      <span className="text-amber-400 font-mono text-[10px] uppercase font-bold block mb-0.5">
                        💡 Key Mental Model:
                      </span>
                      {task.notes || task.userHypothesis}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

