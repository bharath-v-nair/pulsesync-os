import React from 'react';
import { WorkoutLog } from '../../types';
import { PieChart } from 'lucide-react';

interface MuscleDistributionCardProps {
  workouts: WorkoutLog[];
  timeframe?: number;
}

interface MuscleGroupStat {
  name: string;
  category: string;
  color: string;
  bgColor: string;
  borderColor: string;
  sets: number;
  reps: number;
  volumeKg: number;
  pct: number;
}

export const MuscleDistributionCard: React.FC<MuscleDistributionCardProps> = ({
  workouts,
  timeframe = 7,
}) => {
  // 1. Back & Lats (Half Pull-ups + Bent Rows)
  const backLogs = workouts.filter(
    (w) =>
      w.category === 'pullup' ||
      (w.category === 'barbell' && (w.name.includes('Bent Rows') || w.name.includes('Rows')))
  );
  const backSets = backLogs.length;
  const backReps = backLogs.reduce((acc, w) => acc + (w.reps || 0), 0);
  const backVol = backLogs.reduce(
    (acc, w) => acc + (w.category === 'barbell' ? (w.reps || 0) * (w.weightKg || 30) : 0),
    0
  );

  // 2. Chest & Anterior (Push-ups)
  const chestLogs = workouts.filter((w) => w.category === 'pushup');
  const chestSets = chestLogs.length;
  const chestReps = chestLogs.reduce((acc, w) => acc + (w.reps || 0), 0);
  const chestVol = 0; // bodyweight

  // 3. Shoulders (Overhead Press)
  const shoulderLogs = workouts.filter(
    (w) => w.category === 'barbell' && (w.name.includes('Overhead Press') || w.name.includes('OHP'))
  );
  const shoulderSets = shoulderLogs.length;
  const shoulderReps = shoulderLogs.reduce((acc, w) => acc + (w.reps || 0), 0);
  const shoulderVol = shoulderLogs.reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

  // 4. Quads & Legs (Squats)
  const quadLogs = workouts.filter(
    (w) => w.category === 'barbell' && w.name.includes('Squats')
  );
  const quadSets = quadLogs.length;
  const quadReps = quadLogs.reduce((acc, w) => acc + (w.reps || 0), 0);
  const quadVol = quadLogs.reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

  // 5. Posterior Chain (RDLs + Deadlifts)
  const postLogs = workouts.filter(
    (w) =>
      w.category === 'barbell' &&
      (w.name.includes('RDLs') || w.name.includes('Deadlifts'))
  );
  const postSets = postLogs.length;
  const postReps = postLogs.reduce((acc, w) => acc + (w.reps || 0), 0);
  const postVol = postLogs.reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

  // 6. Arms / Biceps (Curls)
  const armLogs = workouts.filter(
    (w) => w.category === 'barbell' && (w.name.includes('Curls') || w.name.includes('Bicep'))
  );
  const armSets = armLogs.length;
  const armReps = armLogs.reduce((acc, w) => acc + (w.reps || 0), 0);
  const armVol = armLogs.reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

  const totalSets = backSets + chestSets + shoulderSets + quadSets + postSets + armSets;

  const groups: MuscleGroupStat[] = [
    {
      name: 'Back & Lats',
      category: 'Pull-ups & Rows',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-500/30',
      sets: backSets,
      reps: backReps,
      volumeKg: backVol,
      pct: totalSets > 0 ? Math.round((backSets / totalSets) * 100) : 0,
    },
    {
      name: 'Chest & Core',
      category: 'Push-ups',
      color: 'text-sky-400',
      bgColor: 'bg-sky-500',
      borderColor: 'border-sky-500/30',
      sets: chestSets,
      reps: chestReps,
      volumeKg: chestVol,
      pct: totalSets > 0 ? Math.round((chestSets / totalSets) * 100) : 0,
    },
    {
      name: 'Shoulders / Delts',
      category: 'Overhead Press',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-500/30',
      sets: shoulderSets,
      reps: shoulderReps,
      volumeKg: shoulderVol,
      pct: totalSets > 0 ? Math.round((shoulderSets / totalSets) * 100) : 0,
    },
    {
      name: 'Quads & Legs',
      category: 'Barbell Squats',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-500/30',
      sets: quadSets,
      reps: quadReps,
      volumeKg: quadVol,
      pct: totalSets > 0 ? Math.round((quadSets / totalSets) * 100) : 0,
    },
    {
      name: 'Posterior Chain',
      category: 'RDLs & Deadlifts',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500',
      borderColor: 'border-rose-500/30',
      sets: postSets,
      reps: postReps,
      volumeKg: postVol,
      pct: totalSets > 0 ? Math.round((postSets / totalSets) * 100) : 0,
    },
    {
      name: 'Arms / Biceps',
      category: 'Bicep Curls',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500',
      borderColor: 'border-indigo-500/30',
      sets: armSets,
      reps: armReps,
      volumeKg: armVol,
      pct: totalSets > 0 ? Math.round((armSets / totalSets) * 100) : 0,
    },
  ];

  return (
    <div className="matte-card p-4 space-y-3.5 border-white/10 bg-[#090d16] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Muscle Group Distribution
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Hevy / Strong Set Volume Allocation ({timeframe}D)
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-300">
          {totalSets} Total Sets
        </span>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="space-y-1">
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-white/10">
          {totalSets === 0 ? (
            <div className="h-full w-full bg-slate-700/50 rounded-full" />
          ) : (
            groups
              .filter((g) => g.pct > 0)
              .map((g) => (
                <div
                  key={g.name}
                  style={{ width: `${g.pct}%` }}
                  title={`${g.name}: ${g.pct}% (${g.sets} sets)`}
                  className={`h-full ${g.bgColor} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                />
              ))
          )}
        </div>
      </div>

      {/* Grid of Muscle Groups */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pt-1">
        {groups.map((group) => (
          <div
            key={group.name}
            className="p-2 rounded-xl bg-[#0e131d] border border-white/5 space-y-1 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold font-mono ${group.color}`}>
                {group.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                {group.pct}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{group.sets} sets</span>
              <span className="text-slate-300 font-bold tabular-nums">{group.reps} reps</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
