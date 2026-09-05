import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { triggerHaptic } from '../../hooks/useHaptics';

interface ExerciseStepperProps {
  title: string;
  reps: number;
  onRepsChange: (newReps: number) => void;
  onLog: (reps: number) => void;
  badgeLabel?: string;
  minReps?: number;
}

export const ExerciseStepper: React.FC<ExerciseStepperProps> = ({
  title,
  reps,
  onRepsChange,
  onLog,
  badgeLabel,
  minReps = 1,
}) => {
  const handleDecrement = () => {
    if (reps > minReps) {
      triggerHaptic(10);
      onRepsChange(reps - 1);
    }
  };

  const handleIncrement = () => {
    triggerHaptic(10);
    onRepsChange(reps + 1);
  };

  const handleLogClick = () => {
    triggerHaptic(20);
    onLog(reps);
  };

  return (
    <div className="matte-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
        {badgeLabel && (
          <span className="badge-pill bg-slate-800 text-slate-300 font-mono text-[10px]">
            {badgeLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Stepper Controls */}
        <div className="flex items-center gap-2 bg-[#0b0e14] p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={reps <= minReps}
            className="stepper-btn tap-target disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Decrease ${title} reps`}
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
            aria-label={`Increase ${title} reps`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Tap Log Button */}
        <button
          type="button"
          onClick={handleLogClick}
          aria-label={`Log ${reps} reps of ${title}`}
          className="flex-1 spring-btn py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 tap-target flex items-center justify-center transition-all"
        >
          LOG ({reps})
        </button>
      </div>
    </div>
  );
};
