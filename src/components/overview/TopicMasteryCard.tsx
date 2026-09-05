import React from 'react';
import { FocusData } from '../../types';
import { BookOpen, Code2, Database, Award, Cpu, Layers, UserCheck } from 'lucide-react';
import { classifyTaskDomain, CurriculumDomainId } from '../../utils/domainClassifier';

interface TopicMasteryCardProps {
  focus: FocusData;
  timeframe?: number;
}

interface DomainConfig {
  id: CurriculumDomainId;
  name: string;
  icon: React.ReactNode;
  colorClass: string;
  bgGradient: string;
}

const DOMAINS: DomainConfig[] = [
  {
    id: 'angular',
    name: 'Angular',
    icon: <Code2 className="w-3.5 h-3.5 text-sky-400" />,
    colorClass: 'text-sky-300',
    bgGradient: 'bg-gradient-to-r from-sky-500 to-blue-500',
  },
  {
    id: 'dotnet',
    name: '.NET Core',
    icon: <Database className="w-3.5 h-3.5 text-purple-400" />,
    colorClass: 'text-purple-300',
    bgGradient: 'bg-gradient-to-r from-purple-500 to-indigo-400',
  },
  {
    id: 'dsa',
    name: 'DSA',
    icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
    colorClass: 'text-emerald-300',
    bgGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  {
    id: 'azure',
    name: 'Azure AI',
    icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
    colorClass: 'text-cyan-300',
    bgGradient: 'bg-gradient-to-r from-cyan-500 to-blue-600',
  },
  {
    id: 'system_design',
    name: 'System Design',
    icon: <Layers className="w-3.5 h-3.5 text-amber-400" />,
    colorClass: 'text-amber-300',
    bgGradient: 'bg-gradient-to-r from-amber-500 to-orange-400',
  },
  {
    id: 'behavioral',
    name: 'Behavioral STAR',
    icon: <UserCheck className="w-3.5 h-3.5 text-rose-400" />,
    colorClass: 'text-rose-300',
    bgGradient: 'bg-gradient-to-r from-rose-500 to-pink-500',
  },
];

export const TopicMasteryCard: React.FC<TopicMasteryCardProps> = ({ focus, timeframe = 7 }) => {
  const tasks = focus.tasks || [];
  const horizonMultiplier = timeframe / 7;

  const getDomainTarget = (id: CurriculumDomainId): number => {
    switch (id) {
      case 'dsa':
        return timeframe; // Strictly 1 problem per day!
      case 'angular':
      case 'dotnet':
        return Math.max(1, Math.round(6 * horizonMultiplier));
      case 'azure':
      case 'system_design':
      case 'behavioral':
        return Math.max(1, Math.round(2 * horizonMultiplier));
      default:
        return Math.max(1, Math.round(2 * horizonMultiplier));
    }
  };

  // Group verified tasks strictly by domain - NO session counts inflating units
  const domainStats = DOMAINS.map((dom) => {
    const domainTasks = tasks.filter((t) => classifyTaskDomain(t) === dom.id);
    const completed = domainTasks.filter((t) => t.completed).length;
    const target = getDomainTarget(dom.id);
    const total = Math.max(target, domainTasks.length);
    const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    return {
      ...dom,
      completed,
      total,
      pct,
    };
  });

  const totalCompleted = domainStats.reduce((acc, d) => acc + d.completed, 0);
  const totalTarget = domainStats.reduce((acc, d) => acc + d.total, 0);
  const overallMasteryPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  return (
    <div className="matte-card p-3.5 space-y-3 border-sky-500/20 bg-[#090d16] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Curriculum Domain Mastery
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Completed Tasks Across 6 Technical Pillars ({timeframe}D Horizon)
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[9px] text-slate-400 block">Overall Mastery</span>
          <span className="text-xs font-bold text-sky-300 tabular-nums">
            {overallMasteryPct}%
          </span>
        </div>
      </div>

      {/* 6 Domain Progress Rows - Fluff Free */}
      <div className="space-y-2">
        {domainStats.map((dom) => (
          <div
            key={dom.id}
            className="p-2.5 rounded-xl bg-[#0c101a] border border-white/5 hover:border-white/15 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                  {dom.icon}
                </div>
                <h4 className="text-xs font-bold text-white font-mono truncate">{dom.name}</h4>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono">
                <span className="text-[11px] text-slate-400 tabular-nums">
                  <span className="text-white font-bold">{dom.completed}</span> / {dom.total}
                </span>
                <span className={`text-xs font-bold tabular-nums w-9 text-right ${dom.colorClass}`}>
                  {dom.pct}%
                </span>
              </div>
            </div>

            {/* Clean Progress Bar */}
            <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${dom.pct}%` }}
                className={`h-full rounded-full transition-all duration-500 ${dom.bgGradient}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
