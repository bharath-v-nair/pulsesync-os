import React, { useState } from 'react';
import { WorkoutLog, StickyDefaults, BarbellExercise, UserMoveConfig } from '../../types';
import { ScorecardsGrid } from './ScorecardsGrid';
import { ExerciseStepper } from './ExerciseStepper';
import { BarbellCard } from './BarbellCard';
import { DumbbellCard } from './DumbbellCard';
import { CalisthenicsCard } from './CalisthenicsCard';
import { CardioCard } from './CardioCard';
import { WorkoutTimeline } from './WorkoutTimeline';
import { EditWorkoutModal } from './EditWorkoutModal';

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
}) => {
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);

  const activeMode = moveConfig?.equipmentMode || 'barbell_home';

  const stepper1Title = moveConfig?.stepper1?.title || 'Half Pull-ups';
  const stepper1Category = moveConfig?.stepper1?.category || 'pullup';

  const stepper2Title = (moveConfig?.stepper2?.category === 'dips' || moveConfig?.stepper2?.title?.toLowerCase().includes('dip'))
    ? moveConfig.stepper2.title
    : 'Parallel Dips';
  const stepper2Category = 'dips';

  const stepper3Title = moveConfig?.stepper3?.title || 'Push-ups';
  const stepper3Category = moveConfig?.stepper3?.category || 'pushup';

  const barbellWeightKg = moveConfig?.barbellWeightKg ?? 30;
  const dumbbellWeightKg = moveConfig?.dumbbellWeightKg ?? 15;
  const enabledExercises = moveConfig?.enabledExercises;
  const enabledDumbbellExercises = moveConfig?.enabledDumbbellExercises;
  const enabledBodyweightExercises = moveConfig?.enabledBodyweightExercises;
  const targets = moveConfig?.targets;

  return (
    <div className="space-y-4">
      {/* 5 Dynamic Scorecards (Pull-ups, Dips, Push-ups, Tonnage, Cardio) */}
      <ScorecardsGrid 
        logs={logs} 
        targets={targets}
        barbellWeightKg={barbellWeightKg}
        enabledExercises={enabledExercises}
      />

      {/* Quick Action Stepper 1: Pull-ups (Pull-up Bar) */}
      <ExerciseStepper
        title={stepper1Title}
        reps={stickyDefaults.pullupReps}
        badgeLabel="Pull-up Bar"
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

      {/* Quick Action Stepper 2: Parallel Dips (Dips Bar) */}
      <ExerciseStepper
        title={stepper2Title}
        reps={stickyDefaults.dipsReps ?? 8}
        badgeLabel="Dips Bar"
        onRepsChange={(newReps) =>
          onUpdateDefaults({ ...stickyDefaults, dipsReps: newReps })
        }
        onLog={(reps) =>
          onLogWorkout({
            category: stepper2Category,
            name: stepper2Title,
            reps,
          })
        }
      />

      {/* Quick Action Stepper 3: Push-ups (Floor Mat) */}
      <ExerciseStepper
        title={stepper3Title}
        reps={stickyDefaults.pushupReps}
        badgeLabel="Floor Mat"
        onRepsChange={(newReps) =>
          onUpdateDefaults({ ...stickyDefaults, pushupReps: newReps })
        }
        onLog={(reps) =>
          onLogWorkout({
            category: stepper3Category,
            name: stepper3Title,
            reps,
          })
        }
      />

      {/* Primary Workout Engine Card (Configured from Settings) */}
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
              weightKg: weightKg * 2,
            })
          }
        />
      )}

      {activeMode === 'bodyweight_only' && (
        <CalisthenicsCard
          enabledExercises={enabledBodyweightExercises}
          onLog={(exercise, reps) => {
            const isPullup = exercise.toLowerCase().includes('pull');
            const isDips = exercise.toLowerCase().includes('dip');
            const isPushup = exercise.toLowerCase().includes('push');
            onLogWorkout({
              category: isPullup ? 'pullup' : isDips ? 'dips' : isPushup ? 'pushup' : 'bodyweight',
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
