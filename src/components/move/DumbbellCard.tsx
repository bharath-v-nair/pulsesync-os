import React, { useState } from 'react';
import { Minus, Plus, Dumbbell } from 'lucide-react';
import { triggerHaptic } from '../../hooks/useHaptics';
import { DEFAULT_DUMBBELL_EXERCISES } from '../../types';

interface DumbbellCardProps {
  selectedExercise?: string;
  reps?: number;
  weightKg?: number;
  title?: string;
  enabledExercises?: string[];
  onSelectExercise?: (exercise: string) => void;
  onRepsChange?: (reps: number) => void;
  onWeightChange?: (weightKg: number) => void;
  onLog: (exercise: string, reps: number, weightKg: number) => void;
}

export const DumbbellCard: React.FC<DumbbellCardProps> = ({
  selectedExercise: propExercise,
  reps: propReps,
  weightKg = 15,
  title,
  enabledExercises,
  onSelectExercise,
  onRepsChange,
  onWeightChange,
  onLog,
}) => {
  const exercisesToRender = (enabledExercises && enabledExercises.length > 0)
    ? enabledExercises
    : DEFAULT_DUMBBELL_EXERCISES;

  const [localExercise, setLocalExercise] = useState(exercisesToRender[0] || 'DB Overhead Press');
  const [localReps, setLocalReps] = useState(10);

  const activeExercise = propExercise || localExercise;
  const activeReps = propReps ?? localReps;

  // Tonnage: 2 dumbbells x weightKg x reps
  const totalTonnage = activeReps * weightKg * 2;

  const handleExerciseClick = (ex: string) => {
    triggerHaptic(10);
    if (onSelectExercise) {
      onSelectExercise(ex);
    } else {
      setLocalExercise(ex);
    }
  };

  const handleDecrement = () => {
    if (activeReps > 1) {
      triggerHaptic(10);
      const next = activeReps - 1;
      if (onRepsChange) onRepsChange(next);
      else setLocalReps(next);
    }
  };

  const handleIncrement = () => {
    triggerHaptic(10);
    const next = activeReps + 1;
    if (onRepsChange) onRepsChange(next);
    else setLocalReps(next);
  };

  const handleLogClick = () => {
    triggerHaptic(25);
    // Log as dumbbell exercise with weightKg per dumbbell (and total volume stored)
    onLog(activeExercise, activeReps, weightKg);
  };

  return (
    <div className="matte-card p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">
            {title || `${weightKg}kg Dumbbells (Pair)`}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {onWeightChange && (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onWeightChange(Math.max(2.5, weightKg - 2.5));
                }}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono font-bold text-slate-300 border border-white/10"
              >
                -2.5
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onWeightChange(weightKg + 2.5);
                }}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono font-bold text-slate-300 border border-white/10"
              >
                +2.5
              </button>
            </div>
          )}
          <span className="badge-pill bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[10px] tabular-nums">
            {weightKg} kg / hand
          </span>
        </div>
      </div>

      {/* Exercise Pill Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5" role="radiogroup" aria-label="Select Dumbbell Exercise">
        {exercisesToRender.map((lift) => {
          const isSelected = activeExercise === lift;
          return (
            <button
              type="button"
              key={lift}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${lift}${isSelected ? ' (selected)' : ''}`}
              onClick={() => handleExerciseClick(lift)}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all tap-target text-center active:scale-[0.97] truncate ${
                isSelected
                  ? 'bg-sky-500 text-black shadow-md font-bold'
                  : 'bg-[#0e131d] text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              {lift}
            </button>
          );
        })}
      </div>

      {/* Reps Stepper & Tonnage Log */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 bg-[#0b0e14] p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={activeReps <= 1}
            className="stepper-btn tap-target disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Decrease ${activeExercise} reps`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-xl font-bold font-mono text-white tabular-nums">
            {activeReps}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="stepper-btn tap-target"
            aria-label={`Increase ${activeExercise} reps`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogClick}
          aria-label={`Log ${activeReps} reps of ${activeExercise} at ${weightKg}kg per hand (${totalTonnage}kg volume)`}
          className="flex-1 spring-btn py-3 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 tap-target flex items-center justify-center gap-1.5 transition-all"
        >
          <span>LOG</span>
          <span className="font-mono tabular-nums">({totalTonnage} kg)</span>
        </button>
      </div>
    </div>
  );
};
