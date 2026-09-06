import React, { useState } from 'react';
import { Flame, Dumbbell, Activity, MapPin } from 'lucide-react';
import { WorkoutLog, StickyDefaults, BarbellExercise, UserMoveConfig } from '../../types';
import { ScorecardsGrid } from './ScorecardsGrid';
import { ExerciseStepper } from './ExerciseStepper';
import { BarbellCard } from './BarbellCard';
import { DumbbellCard } from './DumbbellCard';
import { CalisthenicsCard } from './CalisthenicsCard';
import { CardioCard } from './CardioCard';
import { WorkoutTimeline } from './WorkoutTimeline';
import { EditWorkoutModal } from './EditWorkoutModal';
import { triggerHaptic } from '../../hooks/useHaptics';

interface MoveEngineProps {
  logs: WorkoutLog[];
  stickyDefaults: StickyDefaults;
  moveConfig?: UserMoveConfig;
  onUpdateDefaults: (defaults: StickyDefaults) => void;
  onLogWorkout: (log: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'>) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (updated: WorkoutLog) => void;
  onUpdateMoveConfig?: (config: Partial<UserMoveConfig>) => void;
}

export const MoveEngine: React.FC<MoveEngineProps> = ({
  logs,
  stickyDefaults,
  moveConfig,
  onUpdateDefaults,
  onLogWorkout,
  onDeleteLog,
  onUpdateLog,
  onUpdateMoveConfig,
}) => {
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);

  // Active equipment mode (controlled or local fallback)
  const [localMode, setLocalMode] = useState<'barbell_home' | 'dumbbells' | 'bodyweight_only'>(
    moveConfig?.equipmentMode || 'barbell_home'
  );

  const activeMode = moveConfig?.equipmentMode || localMode;

  const handleModeSwitch = (mode: 'barbell_home' | 'dumbbells' | 'bodyweight_only') => {
    triggerHaptic(15);
    setLocalMode(mode);
    if (onUpdateMoveConfig) {
      onUpdateMoveConfig({ equipmentMode: mode });
    }
  };

  const handleLocationSwitch = (locId: string) => {
    triggerHaptic(15);
    const loc = moveConfig?.locations?.find((l) => l.id === locId);
    if (loc && onUpdateMoveConfig) {
      onUpdateMoveConfig({
        activeLocationId: loc.id,
        equipmentMode: loc.equipmentMode,
        barbellWeightKg: loc.barbellWeightKg ?? moveConfig?.barbellWeightKg,
        dumbbellWeightKg: loc.dumbbellWeightKg ?? moveConfig?.dumbbellWeightKg,
      });
    } else if (loc) {
      setLocalMode(loc.equipmentMode);
    }
  };

  const stepper1Title = moveConfig?.stepper1?.title || 'Half Pull-ups';
  const stepper1Category = moveConfig?.stepper1?.category || 'pullup';
  const stepper2Title = moveConfig?.stepper2?.title || 'Push-ups';
  const stepper2Category = moveConfig?.stepper2?.category || 'pushup';
  const barbellWeightKg = moveConfig?.barbellWeightKg ?? 30;
  const dumbbellWeightKg = moveConfig?.dumbbellWeightKg ?? 15;
  const enabledExercises = moveConfig?.enabledExercises;
  const enabledDumbbellExercises = moveConfig?.enabledDumbbellExercises;
  const enabledBodyweightExercises = moveConfig?.enabledBodyweightExercises;
  const targets = moveConfig?.targets;
  const locations = moveConfig?.locations || [];

  return (
    <div className="space-y-4">
      {/* 4 Dynamic Scorecards (Pull-ups, Push-ups, Tonnage, Cardio) */}
      <ScorecardsGrid 
        logs={logs} 
        targets={targets}
        barbellWeightKg={barbellWeightKg}
        enabledExercises={enabledExercises}
      />

      {/* Quick Action Stepper 1 */}
      <ExerciseStepper
        title={stepper1Title}
        reps={stickyDefaults.pullupReps}
        onRepsChange={(newReps) =>
          onUpdateDefaults({ ...stickyDefaults, pullupReps: newReps })
        }
        onLog={(reps) =>
          onLogWorkout({
            category: stepper1Category,
            name: stepper1Title,
            reps,
          })
        }
      />

      {/* Quick Action Stepper 2 */}
      <ExerciseStepper
        title={stepper2Title}
        reps={stickyDefaults.pushupReps}
        onRepsChange={(newReps) =>
          onUpdateDefaults({ ...stickyDefaults, pushupReps: newReps })
        }
        onLog={(reps) =>
          onLogWorkout({
            category: stepper2Category,
            name: stepper2Title,
            reps,
          })
        }
      />

      {/* Equipment Mode & Location Switcher Bar */}
      <div className="matte-card p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {locations.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
              <MapPin className="w-3 h-3 text-amber-400" />
              Location:
            </span>
            {locations.map((loc) => {
              const isSelected = loc.id === (moveConfig?.activeLocationId || 'loc_home');
              const shortName = loc.name.includes("Mother") 
                ? "Mother's House" 
                : loc.name.includes("Gym") 
                ? "Commercial Gym" 
                : "Home Setup";
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleLocationSwitch(loc.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all tap-target ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-[#090d16] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        )}

        {/* Equipment Setup Selector */}
        <div className="flex items-center gap-1 self-start sm:self-auto" role="radiogroup" aria-label="Equipment Setup">
          {[
            { id: 'barbell_home', label: 'Barbell', icon: Flame },
            { id: 'dumbbells', label: 'Dumbbells', icon: Dumbbell },
            { id: 'bodyweight_only', label: 'Bodyweight', icon: Activity },
          ].map((mode) => {
            const isSelected = activeMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleModeSwitch(mode.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all tap-target ${
                  isSelected
                    ? mode.id === 'barbell_home'
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : mode.id === 'dumbbells'
                      ? 'bg-sky-500 text-black font-bold shadow-md shadow-sky-500/20'
                      : 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#0e131d] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Equipment Exercise Card */}
      {activeMode === 'barbell_home' && (
        <BarbellCard
          selectedLift={stickyDefaults.selectedLift}
          reps={stickyDefaults.barbellReps}
          weightKg={barbellWeightKg}
          enabledExercises={enabledExercises}
          onSelectLift={(lift: BarbellExercise) =>
            onUpdateDefaults({ ...stickyDefaults, selectedLift: lift })
          }
          onRepsChange={(newReps) =>
            onUpdateDefaults({ ...stickyDefaults, barbellReps: newReps })
          }
          onLog={(lift, reps, weightKg) =>
            onLogWorkout({
              category: 'barbell',
              name: `Barbell ${lift}`,
              reps,
              weightKg,
            })
          }
        />
      )}

      {activeMode === 'dumbbells' && (
        <DumbbellCard
          weightKg={dumbbellWeightKg}
          enabledExercises={enabledDumbbellExercises}
          onLog={(exercise, reps, weightKg) =>
            onLogWorkout({
              category: 'barbell',
              name: exercise,
              reps,
              weightKg: weightKg * 2, // 2 dumbbells volume
            })
          }
        />
      )}

      {activeMode === 'bodyweight_only' && (
        <CalisthenicsCard
          enabledExercises={enabledBodyweightExercises}
          onLog={(exercise, reps) => {
            const isPullup = exercise.toLowerCase().includes('pull');
            const isPushup = exercise.toLowerCase().includes('push');
            onLogWorkout({
              category: isPullup ? 'pullup' : isPushup ? 'pushup' : 'bodyweight',
              name: exercise,
              reps,
            });
          }}
        />
      )}

      {/* Cardio & Aerobics Card (Walks + Home Machine) */}
      <CardioCard
        logs={logs}
        stickyDefaults={stickyDefaults}
        onUpdateDefaults={onUpdateDefaults}
        onLogWorkout={onLogWorkout}
        onDeleteLog={onDeleteLog}
      />

      {/* Activity Timeline */}
      <WorkoutTimeline
        logs={logs}
        onDeleteLog={onDeleteLog}
        onEditLog={(log) => setEditingLog(log)}
      />

      {/* Edit Workout Modal */}
      <EditWorkoutModal
        isOpen={Boolean(editingLog)}
        log={editingLog}
        onClose={() => setEditingLog(null)}
        onSave={(updated) => {
          onUpdateLog(updated);
          setEditingLog(null);
        }}
      />
    </div>
  );
};
