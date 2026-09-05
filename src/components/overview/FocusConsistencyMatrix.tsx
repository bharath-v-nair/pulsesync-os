import React from 'react';
import { FocusData } from '../../types';
import { Grid3X3, Check, Minus, Circle, Zap, RotateCcw, Code2, Terminal, Cloud } from 'lucide-react';
import { getTodayDateStr } from '../../services/storage';

interface FocusConsistencyMatrixProps {
  focus: FocusData;
}

interface PillarRow {
  id: string;
  name: string;
  icon: React.ReactNode;
  checkStatus: (dateStr: string, isToday: boolean) => 'met' | 'partial' | 'none';
}

export const FocusConsistencyMatrix: React.FC<FocusConsistencyMatrixProps> = ({ focus }) => {
  const todayStr = getTodayDateStr();
  const tasks = focus.tasks || [];
  const sessions = focus.sessions || [];

  // Generate the last 7 days
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const daysAgo = 6 - idx;
    const [y, m, d] = todayStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - daysAgo);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = dateStr === todayStr;

    return {
      dateStr,
      dayLabel,
      dayNumber: dateObj.getDate(),
      isToday,
    };
  });

  const pillars: PillarRow[] = [
    {
      id: 'deep',
      name: 'Deep Anchor',
      icon: <Zap className="w-3 h-3 text-sky-400" />,
      checkStatus: (dateStr, isToday) => {
        if (isToday) {
          const completedDeep = tasks.filter((t) => t.completed && t.bucket === 'deep').length;
          if (completedDeep >= 2) return 'met';
          if (completedDeep >= 1) return 'partial';
          return 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'deep');
        if (daySessions.length >= 2) return 'met';
        if (daySessions.length >= 1) return 'partial';
        return 'none';
      },
    },
    {
      id: 'spaced',
      name: 'Spaced Retrieval',
      icon: <RotateCcw className="w-3 h-3 text-purple-400" />,
      checkStatus: (dateStr, isToday) => {
        if (isToday) {
          const completedSpaced = tasks.filter((t) => t.completed && t.bucket === 'spaced').length;
          if (completedSpaced >= 3) return 'met';
          if (completedSpaced >= 1) return 'partial';
          return 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'spaced');
        if (daySessions.length >= 3) return 'met';
        if (daySessions.length >= 1) return 'partial';
        return 'none';
      },
    },
    {
      id: 'live',
      name: 'Live Coding',
      icon: <Code2 className="w-3 h-3 text-amber-400" />,
      checkStatus: (dateStr, isToday) => {
        if (isToday) {
          const completedLive = tasks.filter((t) => t.completed && t.bucket === 'live').length;
          if (completedLive >= 1) return 'met';
          return 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'live');
        return daySessions.length >= 1 ? 'met' : 'none';
      },
    },
    {
      id: 'dsa',
      name: 'C# DSA',
      icon: <Terminal className="w-3 h-3 text-emerald-400" />,
      checkStatus: (dateStr, isToday) => {
        if (isToday) {
          const completedDSA = tasks.filter(
            (t) => t.completed && (t.bucket === 'dsa' || t.category === 'LeetCode' || t.category === 'dsa')
          ).length;
          if (completedDSA >= 1) return 'met';
          return 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'dsa');
        return daySessions.length >= 1 ? 'met' : 'none';
      },
    },
    {
      id: 'cloud',
      name: 'Cloud & Track',
      icon: <Cloud className="w-3 h-3 text-cyan-400" />,
      checkStatus: (dateStr, isToday) => {
        if (isToday) {
          const hasAzure = (focus.azureMinutes || 0) > 0 || (focus.jobAppsCount || 0) > 0;
          return hasAzure ? 'met' : 'none';
        }
        const daySessions = sessions.filter((s) => s.dateStr === dateStr && s.bucket === 'azure');
        return daySessions.length >= 1 ? 'met' : 'none';
      },
    },
  ];

  // Calculate consistency percentage across matrix
  let totalCells = pillars.length * days.length;
  let metScore = 0;

  pillars.forEach((p) => {
    days.forEach((d) => {
      const status = p.checkStatus(d.dateStr, d.isToday);
      if (status === 'met') metScore += 1;
      else if (status === 'partial') metScore += 0.5;
    });
  });

  const matrixScorePct = Math.round((metScore / totalCells) * 100);

  return (
    <div className="matte-card p-3.5 space-y-3 border-purple-500/20 bg-[#090d16] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Grid3X3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              7-Day Consistency Matrix
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Execution Across 5 Core Cognitive Pillars
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[9px] text-slate-400 block">7D Score</span>
          <span className="text-xs font-bold text-purple-300 tabular-nums">
            {matrixScorePct}%
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="text-left py-1.5 pr-2 text-[10px] font-semibold text-slate-500 uppercase">
                Pillar
              </th>
              {days.map((d) => (
                <th
                  key={d.dateStr}
                  className={`text-center py-1.5 px-1 text-[10px] ${
                    d.isToday ? 'text-sky-300 font-bold' : 'text-slate-400 font-normal'
                  }`}
                >
                  <span className="block">{d.dayLabel}</span>
                  <span className="text-[9px] text-slate-500">{d.dayNumber}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pillars.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2 pr-2 text-[11px] text-slate-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="p-0.5 rounded bg-white/5 shrink-0">{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                </td>
                {days.map((d) => {
                  const status = p.checkStatus(d.dateStr, d.isToday);
                  return (
                    <td key={d.dateStr} className="text-center py-2 px-1">
                      <div className="flex items-center justify-center">
                        {status === 'met' ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : status === 'partial' ? (
                          <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center">
                            <Minus className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-black/40 border border-white/5 text-slate-600 flex items-center justify-center">
                            <Circle className="w-1.5 h-1.5 fill-slate-700 text-slate-700" />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 pt-1 text-[10px] font-mono text-slate-400 border-t border-white/5">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/60" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/60" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-white/10 border border-white/20" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};
