import React from 'react';
import { Minus, Plus, Flame } from 'lucide-react';
import { BarbellExercise } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface BarbellCardProps {
  selectedLift: BarbellExercise;
  reps: number;
  weightKg?: number;
  title?: string;
  enabledExercises?: string[];
  onSelectLift: (lift: BarbellExercise) => void;
  onRepsChange: (reps: number) => void;
  onLog: (lift: BarbellExercise, reps: number, weightKg: number) => void;
}

const DEFAULT_BARBELL_EXERCISES: BarbellExercise[] = [
  'Squats',
  'Overhead Press',
  'Bicep Curls',
  'Bent Rows',
  'RDLs',
  'Deadlifts',
];

export const BarbellCard: React.FC<BarbellCardProps> = ({
  selectedLift,
  reps,
  weightKg = 30,
  title,
  enabledExercises,
  onSelectLift,
  onRepsChange,
  onLog,
}) => {
  const liftsToRender = (enabledExercises && enabledExercises.length > 0)
    ? (enabledExercises as BarbellExercise[])
    : DEFAULT_BARBELL_EXERCISES;

  const totalTonnage = reps * weightKg;

  const handleLiftClick = (lift: BarbellExercise) => {
    triggerHaptic(10);
    onSelectLift(lift);
  };

  const handleDecrement = () => {
    if (reps > 1) {
      triggerHaptic(10);
      onRepsChange(reps - 1);
    }
  };

  const handleIncrement = () => {
    triggerHaptic(10);
    onRepsChange(reps + 1);
  };

  const handleLogClick = () => {
    triggerHaptic(25);
    onLog(selectedLift, reps, weightKg);
  };

  return (
    <div className="matte-card p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">
            {title || `${weightKg}kg Home Barbell`}
          </h3>
        </div>
        <span className="badge-pill bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] tabular-nums">
          {weightKg} kg
        </span>
      </div>

      {/* Exercise Pill Tabs */}
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Select Barbell Exercise">
        {liftsToRender.map((lift) => {
          const isSelected = selectedLift === lift;
          return (
            <button
              type="button"
              key={lift}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${lift}${isSelected ? ' (selected)' : ''}`}
              onClick={() => handleLiftClick(lift)}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all tap-target text-center active:scale-[0.97] ${
                isSelected
                  ? 'bg-amber-500 text-black shadow-md font-bold'
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
            disabled={reps <= 1}
            className="stepper-btn tap-target disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Decrease ${selectedLift} reps`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-xl font-bold font-mono text-white tabular-nums">
            {reps}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="stepper-btn tap-target"
            aria-label={`Increase ${selectedLift} reps`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogClick}
          aria-label={`Log ${reps} reps of ${selectedLift} at ${weightKg}kg (${totalTonnage}kg total volume)`}
          className="flex-1 spring-btn py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 tap-target flex items-center justify-center gap-1.5 transition-all"
        >
          <span>LOG</span>
          <span className="font-mono tabular-nums">({totalTonnage} kg)</span>
        </button>
      </div>
    </div>
  );
};
