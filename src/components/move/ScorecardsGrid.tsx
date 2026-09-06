import React, { useState } from 'react';
import { Dumbbell, Shield, Flame, Footprints, Check, ChevronDown, Award, Zap } from 'lucide-react';
import { WorkoutLog, DailyTargets, DEFAULT_TARGETS, BarbellExercise } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface ScorecardsGridProps {
  logs: WorkoutLog[];
  targets?: DailyTargets;
  barbellWeightKg?: number;
  enabledExercises?: string[];
}

const DEFAULT_BARBELL_EXERCISES: BarbellExercise[] = [
  'Squats',
  'Overhead Press',
  'Bicep Curls',
  'Bent Rows',
  'RDLs',
  'Deadlifts',
];

export const ScorecardsGrid: React.FC<ScorecardsGridProps> = ({
  logs,
  targets = DEFAULT_TARGETS,
  barbellWeightKg = 30,
  enabledExercises,
}) => {
  const [isTonnageDrawerOpen, setIsTonnageDrawerOpen] = useState(false);
  const activeLifts = (enabledExercises && enabledExercises.length > 0)
    ? (enabledExercises as BarbellExercise[])
    : DEFAULT_BARBELL_EXERCISES;

  // 1. Pull-ups
  const currentPullups = logs
    .filter((l) => l.category === 'pullup')
    .reduce((acc, l) => acc + (l.reps || 0), 0);
  const pullupsMet = currentPullups >= targets.pullups;
  const pullupsPct = Math.min(100, Math.round((currentPullups / targets.pullups) * 100));

  // 2. Dips (Parallel Dips Bar)
  const dipsTarget = targets.dips ?? 30;
  const currentDips = logs
    .filter((l) => l.category === 'dips' || l.name.toLowerCase().includes('dip'))
    .reduce((acc, l) => acc + (l.reps || 0), 0);
  const dipsMet = currentDips >= dipsTarget;
  const dipsPct = Math.min(100, Math.round((currentDips / dipsTarget) * 100));

  // 2. Push-ups
  const currentPushups = logs
    .filter((l) => l.category === 'pushup')
    .reduce((acc, l) => acc + (l.reps || 0), 0);
  const pushupsMet = currentPushups >= targets.pushups;
  const pushupsPct = Math.min(100, Math.round((currentPushups / targets.pushups) * 100));

  // 3. Tonnage
  const currentTonnage = logs
    .filter((l) => l.category === 'barbell')
    .reduce((acc, l) => acc + (l.reps || 0) * (l.weightKg || barbellWeightKg), 0);
  const tonnageMet = currentTonnage >= targets.tonnage;
  const tonnagePct = Math.min(100, Math.round((currentTonnage / targets.tonnage) * 100));

  // 4. Cardio Steps (Walks + Machine Cardio)
  const currentCardio = logs.reduce((acc, l) => {
    if (l.category === 'walk') {
      if (l.steps != null && l.steps > 0) return acc + l.steps;
      if (l.distanceKm != null && l.distanceKm > 0) return acc + Math.round(l.distanceKm * 1000);
      if (l.name.includes('5k')) return acc + 5000;
      return acc;
    }
    if (l.category === 'machine_cardio') {
      if (l.steps != null && l.steps > 0) return acc + l.steps;
      if (l.minutes != null && l.minutes > 0) return acc + l.minutes * 110;
      return acc;
    }
    return acc;
  }, 0);
  const cardioMet = currentCardio >= targets.cardioSteps;
  const cardioPct = Math.min(100, Math.round((currentCardio / targets.cardioSteps) * 100));

  // Per-exercise breakdown for Tonnage drawer
  const barbellBreakdown = activeLifts.map((exercise) => {
    const matchingLogs = logs.filter(
      (l) => l.category === 'barbell' && (l.name === `Barbell ${exercise}` || l.name === exercise || l.name.includes(exercise))
    );
    const sets = matchingLogs.length;
    const reps = matchingLogs.reduce((acc, l) => acc + (l.reps || 0), 0);
    const volume = matchingLogs.reduce(
      (acc, l) => acc + (l.reps || 0) * (l.weightKg || barbellWeightKg),
      0
    );
    return { exercise, sets, reps, volume };
  });

  const handleToggleTonnageDrawer = () => {
    triggerHaptic(10);
    setIsTonnageDrawerOpen((prev) => !prev);
  };

  return (
    <div className="space-y-2.5">
      {/* 5 Scorecards Grid: Pull-ups, Dips, Push-ups, Tonnage, Cardio */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Pull-ups Card */}
        <div
          role="region"
          aria-label={`Pull-ups target: ${currentPullups} of ${targets.pullups} reps completed`}
          className={`matte-card p-3 relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            pullupsMet
              ? 'border-sky-400/50 bg-[#0c1524] shadow-[0_0_18px_rgba(56,189,248,0.25)]'
              : 'border-white/10 bg-[#0e131d] hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-sky-400">
                <Dumbbell className="w-3.5 h-3.5" />
                <span className="eyebrow text-[9px] text-sky-400 font-bold">Pull-ups</span>
              </div>
              {pullupsMet ? (
                <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded-full border border-sky-400/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> {targets.pullups}
                </span>
              ) : (
                <span className="font-mono text-[9px] text-slate-400">
                  {currentPullups} / {targets.pullups}
                </span>
              )}
            </div>

            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {currentPullups}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">reps today</p>
          </div>

          {/* 3px Bottom Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentPullups}
            aria-valuemin={0}
            aria-valuemax={targets.pullups}
            aria-label="Pull-ups progress"
            className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mt-3"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pullupsMet
                  ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]'
                  : 'bg-sky-500/60'
              }`}
              style={{ width: `${pullupsPct}%` }}
            />
          </div>
        </div>

        {/* 2. Dips Card (Parallel Dips Bar) */}
        <div
          role="region"
          aria-label={`Dips target: ${currentDips} of ${dipsTarget} reps completed`}
          className={`matte-card p-3 relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            dipsMet
              ? 'border-teal-400/50 bg-[#081a1a] shadow-[0_0_18px_rgba(45,212,191,0.25)]'
              : 'border-white/10 bg-[#0e131d] hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-teal-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="eyebrow text-[9px] text-teal-400 font-bold">Dips</span>
              </div>
              {dipsMet ? (
                <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded-full border border-teal-400/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> {dipsTarget}
                </span>
              ) : (
                <span className="font-mono text-[9px] text-slate-400">
                  {currentDips} / {dipsTarget}
                </span>
              )}
            </div>

            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {currentDips}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">reps today</p>
          </div>

          {/* 3px Bottom Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentDips}
            aria-valuemin={0}
            aria-valuemax={dipsTarget}
            aria-label="Dips progress"
            className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mt-3"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dipsMet
                  ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]'
                  : 'bg-teal-500/60'
              }`}
              style={{ width: `${dipsPct}%` }}
            />
          </div>
        </div>

        {/* 3. Push-ups Card */}
        <div
          role="region"
          aria-label={`Push-ups target: ${currentPushups} of ${targets.pushups} reps completed`}
          className={`matte-card p-3 relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            pushupsMet
              ? 'border-purple-400/50 bg-[#160f24] shadow-[0_0_18px_rgba(192,132,252,0.25)]'
              : 'border-white/10 bg-[#0e131d] hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-purple-400">
                <Shield className="w-3.5 h-3.5" />
                <span className="eyebrow text-[9px] text-purple-400 font-bold">Push-ups</span>
              </div>
              {pushupsMet ? (
                <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full border border-purple-400/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> {targets.pushups}
                </span>
              ) : (
                <span className="font-mono text-[9px] text-slate-400">
                  {currentPushups} / {targets.pushups}
                </span>
              )}
            </div>

            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {currentPushups}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">reps today</p>
          </div>

          {/* 3px Bottom Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentPushups}
            aria-valuemin={0}
            aria-valuemax={targets.pushups}
            aria-label="Push-ups progress"
            className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mt-3"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pushupsMet
                  ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]'
                  : 'bg-purple-500/60'
              }`}
              style={{ width: `${pushupsPct}%` }}
            />
          </div>
        </div>

        {/* 3. Barbell Tonnage Card (Clickable to open breakdown drawer) */}
        <button
          type="button"
          onClick={handleToggleTonnageDrawer}
          aria-expanded={isTonnageDrawerOpen}
          aria-controls="tonnage-breakdown-drawer"
          aria-label={`Barbell Tonnage: ${currentTonnage.toLocaleString()} kg moved. Tap to ${isTonnageDrawerOpen ? 'collapse' : 'expand'} breakdown`}
          className={`matte-card p-3 text-left relative flex flex-col justify-between overflow-hidden transition-all duration-300 cursor-pointer group active:scale-[0.98] ${
            tonnageMet
              ? 'border-amber-400/50 bg-[#211606] shadow-[0_0_18px_rgba(251,191,36,0.25)]'
              : 'border-white/10 bg-[#0e131d] hover:border-amber-500/40'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span className="eyebrow text-[9px] text-amber-400 font-bold">Tonnage</span>
              </div>
              <div className="flex items-center gap-1">
                {tonnageMet ? (
                  <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-400/30">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> {targets.tonnage}kg
                  </span>
                ) : (
                  <span className="font-mono text-[9px] text-slate-400">
                    {currentTonnage} / {targets.tonnage}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 text-amber-400/80 transition-transform duration-200 ${
                    isTonnageDrawerOpen ? 'rotate-180 text-amber-300' : ''
                  }`}
                />
              </div>
            </div>

            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {currentTonnage.toLocaleString()}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-medium">kg moved</p>
              <span className="text-[9px] text-amber-400/90 group-hover:text-amber-300 font-mono font-medium">
                {isTonnageDrawerOpen ? 'hide' : 'breakdown'}
              </span>
            </div>
          </div>

          {/* 3px Bottom Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentTonnage}
            aria-valuemin={0}
            aria-valuemax={targets.tonnage}
            aria-label="Barbell tonnage progress"
            className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mt-3"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                tonnageMet
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                  : 'bg-amber-500/60'
              }`}
              style={{ width: `${tonnagePct}%` }}
            />
          </div>
        </button>

        {/* 4. Cardio Steps Card */}
        <div
          role="region"
          aria-label={`Cardio steps target: ${currentCardio.toLocaleString()} of ${targets.cardioSteps.toLocaleString()} steps completed`}
          className={`matte-card p-3 relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            cardioMet
              ? 'border-emerald-400/50 bg-[#081b15] shadow-[0_0_18px_rgba(52,211,153,0.25)]'
              : 'border-white/10 bg-[#0e131d] hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Footprints className="w-3.5 h-3.5" />
                <span className="eyebrow text-[9px] text-emerald-400 font-bold">Cardio</span>
              </div>
              {cardioMet ? (
                <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> {(targets.cardioSteps / 1000).toFixed(0)}k
                </span>
              ) : (
                <span className="font-mono text-[9px] text-slate-400">
                  {(currentCardio / 1000).toFixed(1)}k / {(targets.cardioSteps / 1000).toFixed(0)}k
                </span>
              )}
            </div>

            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {currentCardio.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">steps today</p>
          </div>

          {/* 3px Bottom Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentCardio}
            aria-valuemin={0}
            aria-valuemax={targets.cardioSteps}
            aria-label="Cardio steps progress"
            className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mt-3"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cardioMet
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : 'bg-emerald-500/60'
              }`}
              style={{ width: `${cardioPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tonnage Breakdown Drawer (collapsible beneath grid) */}
      {isTonnageDrawerOpen && (
        <div
          id="tonnage-breakdown-drawer"
          className="matte-card p-3.5 border border-amber-500/25 bg-[#120f09] space-y-2.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Barbell Volume Breakdown
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Total: <span className="text-amber-300 font-bold">{currentTonnage.toLocaleString()} kg</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {barbellBreakdown.map((item) => {
              const hasActivity = item.sets > 0;
              return (
                <div
                  key={item.exercise}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    hasActivity
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-black/20 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1 min-w-0">
                    <span
                      className={`text-xs font-semibold truncate flex-1 min-w-0 ${
                        hasActivity ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {item.exercise}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                        hasActivity
                          ? 'bg-amber-400/20 text-amber-300 font-bold'
                          : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {item.sets} {item.sets === 1 ? 'set' : 'sets'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{item.reps} reps</span>
                    <span className={hasActivity ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                      {item.volume.toLocaleString()} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
