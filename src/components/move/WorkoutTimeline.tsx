import React from 'react';
import { Trash2, History, Pencil } from 'lucide-react';
import { WorkoutLog } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface WorkoutTimelineProps {
  logs: WorkoutLog[];
  onDeleteLog: (id: string) => void;
  onEditLog?: (log: WorkoutLog) => void;
}

export const WorkoutTimeline: React.FC<WorkoutTimelineProps> = ({
  logs,
  onDeleteLog,
  onEditLog,
}) => {
  const formatLogSubtitle = (log: WorkoutLog): string => {
    switch (log.category) {
      case 'barbell':
        return `${log.reps || 0} reps • ${(log.reps || 0) * (log.weightKg || 30)} kg`;
      case 'machine_cardio': {
        const mins = log.minutes || 10;
        const machine = log.machineType === 'cycle' ? 'Cycle' : 'Elliptical';
        const tension = log.tensionLevel || 5;
        const steps = log.steps || mins * 110;
        return `${mins} mins ${machine} @ Level ${tension} (${steps.toLocaleString()} steps)`;
      }
      case 'walk': {
        const parts: string[] = [];
        if (log.distanceKm != null && log.distanceKm > 0) parts.push(`${log.distanceKm} km`);
        if (log.steps != null && log.steps > 0) parts.push(`${log.steps.toLocaleString()} steps`);
        if (parts.length === 0) return 'Walk completed';
        return parts.join(' • ');
      }
      case 'pullup':
      case 'dips':
      case 'pushup':
        return `${log.reps || 0} reps`;
      default:
        return log.reps != null ? `${log.reps} reps` : 'Activity completed';
    }
  };

  const getCategoryColor = (category: WorkoutLog['category']): string => {
    switch (category) {
      case 'pullup':
        return 'bg-sky-400';
      case 'dips':
        return 'bg-teal-400';
      case 'pushup':
        return 'bg-purple-400';
      case 'barbell':
        return 'bg-amber-400';
      case 'walk':
        return 'bg-emerald-400';
      case 'machine_cardio':
        return 'bg-sky-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="matte-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Activity Log</h3>
        </div>
        <span className="badge-pill bg-slate-800 text-slate-300 font-mono text-[10px]">
          {logs.length} {logs.length === 1 ? 'Entry' : 'Entries'}
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-1.5">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 mb-1">
            <History className="w-5 h-5 stroke-[1.5]" />
          </div>
          <p className="font-semibold text-slate-300">No activity recorded for this day</p>
          <p className="text-[11px] text-slate-500 max-w-[240px]">
            Use the steppers or quick-log cards above to record your sets and cardio.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {logs.map((log) => {
            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#0c1017] border border-white/10 flex items-center justify-between gap-3 text-xs hover:border-white/20 transition-colors"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(log.category)} shrink-0`}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-100 truncate">{log.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.timeFormatted}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono truncate pl-3.5">
                    {formatLogSubtitle(log)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onEditLog && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        onEditLog(log);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 tap-target transition-colors active:scale-95"
                      aria-label={`Edit ${log.name} at ${log.timeFormatted}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      onDeleteLog(log.id);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 tap-target transition-colors active:scale-95"
                    aria-label={`Delete ${log.name} at ${log.timeFormatted}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
