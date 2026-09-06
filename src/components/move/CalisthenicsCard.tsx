import React, { useState } from 'react';
import { Minus, Plus, Activity } from 'lucide-react';
import { triggerHaptic } from '../../hooks/useHaptics';
import { DEFAULT_BODYWEIGHT_EXERCISES } from '../../types';

interface CalisthenicsCardProps {
  selectedExercise?: string;
  reps?: number;
  title?: string;
  enabledExercises?: string[];
  onSelectExercise?: (exercise: string) => void;
  onRepsChange?: (reps: number) => void;
  onLog: (exercise: string, reps: number) => void;
}

export const CalisthenicsCard: React.FC<CalisthenicsCardProps> = ({
  selectedExercise: propExercise,
  reps: propReps,
  title,
  enabledExercises,
  onSelectExercise,
  onRepsChange,
  onLog,
}) => {
  const exercisesToRender = (enabledExercises && enabledExercises.length > 0)
    ? enabledExercises
    : DEFAULT_BODYWEIGHT_EXERCISES;

  const [localExercise, setLocalExercise] = useState(exercisesToRender[0] || 'Push-ups');
  const [localReps, setLocalReps] = useState(15);

  const activeExercise = propExercise || localExercise;
  const activeReps = propReps ?? localReps;
  const isTimeBased = activeExercise.toLowerCase().includes('plank') || activeExercise.toLowerCase().includes('hold');

  const handleExerciseClick = (ex: string) => {
    triggerHaptic(10);
    if (onSelectExercise) {
      onSelectExercise(ex);
    } else {
      setLocalExercise(ex);
      if (ex.toLowerCase().includes('plank')) {
        setLocalReps(45); // default 45s for plank
      } else if (ex.toLowerCase().includes('pull-up')) {
        setLocalReps(5);
      } else {
        setLocalReps(15);
      }
    }
  };

  const handleDecrement = (step: number = 1) => {
    if (activeReps > step) {
      triggerHaptic(10);
      const next = activeReps - step;
      if (onRepsChange) onRepsChange(next);
      else setLocalReps(next);
    }
  };

  const handleIncrement = (step: number = 1) => {
    triggerHaptic(10);
    const next = activeReps + step;
    if (onRepsChange) onRepsChange(next);
    else setLocalReps(next);
  };

  const handleLogClick = () => {
    triggerHaptic(25);
    onLog(activeExercise, activeReps);
  };

  return (
    <div className="matte-card p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">
            {title || 'Bodyweight & Calisthenics Movement'}
          </h3>
        </div>
        <span className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
          Bodyweight
        </span>
      </div>

      {/* Movement Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5" role="radiogroup" aria-label="Select Bodyweight Movement">
        {exercisesToRender.map((ex) => {
          const isSelected = activeExercise === ex;
          return (
            <button
              type="button"
              key={ex}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${ex}${isSelected ? ' (selected)' : ''}`}
              onClick={() => handleExerciseClick(ex)}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all tap-target text-center active:scale-[0.97] truncate ${
                isSelected
                  ? 'bg-emerald-500 text-black shadow-md font-bold'
                  : 'bg-[#0e131d] text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              {ex}
            </button>
          );
        })}
      </div>

      {/* Reps/Time Stepper & Log */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-[#0b0e14] p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => handleDecrement(isTimeBased ? 5 : 1)}
            disabled={activeReps <= 1}
            className="stepper-btn tap-target disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Decrease ${activeExercise} count`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-14 text-center">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {activeReps}
            </span>
            <span className="block text-[9px] font-mono text-slate-400 uppercase">
              {isTimeBased ? 'sec' : 'reps'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleIncrement(isTimeBased ? 5 : 1)}
            className="stepper-btn tap-target"
            aria-label={`Increase ${activeExercise} count`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogClick}
          aria-label={`Log ${activeReps} ${isTimeBased ? 'seconds' : 'reps'} of ${activeExercise}`}
          className="flex-1 spring-btn py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 tap-target flex items-center justify-center gap-1.5 transition-all"
        >
          <span>LOG MOVEMENT</span>
          <span className="font-mono tabular-nums">({activeReps} {isTimeBased ? 's' : 'reps'})</span>
        </button>
      </div>
    </div>
  );
};
