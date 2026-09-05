import React from 'react';
import { Send } from 'lucide-react';

interface JobApplicationFunnelCardProps {
  jobAppsCount: number;
}

export const JobApplicationFunnelCard: React.FC<JobApplicationFunnelCardProps> = ({
  jobAppsCount = 0,
}) => {
  const target = 40;
  const pct = Math.min(100, Math.round((jobAppsCount / target) * 100));

  const milestones = [
    { label: 'Day 4', count: 10 },
    { label: 'Day 5', count: 20 },
    { label: 'Day 6', count: 30 },
    { label: 'Day 7', count: 40 },
  ];

  return (
    <div className="matte-card p-3.5 space-y-3 border-sky-500/20 bg-[#090d16] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Job Application Funnel
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Sprint Milestone Scaling (Target: 40 Submissions)
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[9px] text-slate-400 block">Progress</span>
          <span className="text-xs font-bold text-sky-300 tabular-nums">
            {jobAppsCount} / {target} ({pct}%)
          </span>
        </div>
      </div>

      {/* Progress Bar with Milestone Markers */}
      <div className="space-y-2 pt-1">
        <div className="relative w-full bg-black/60 h-2 rounded-full overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
          />
        </div>

        {/* Clean Milestone Markers Track */}
        <div className="flex justify-between items-center px-1 font-mono text-[10px]">
          {milestones.map((m) => {
            const isReached = jobAppsCount >= m.count;
            return (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isReached ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-slate-700'
                  }`}
                />
                <span className={isReached ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                  {m.label} ({m.count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
