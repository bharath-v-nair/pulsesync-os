import React, { useState } from 'react';
import { WorkoutLog, StickyDefaults, BarbellExercise, UserMoveConfig } from '../../types';
import { ScorecardsGrid } from './ScorecardsGrid';
import { ExerciseStepper } from './ExerciseStepper';
import { BarbellCard } from './BarbellCard';
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

  const stepper1Title = moveConfig?.stepper1?.title || 'Half Pull-ups';
  const stepper1Category = moveConfig?.stepper1?.category || 'pullup';
  const stepper2Title = moveConfig?.stepper2?.title || 'Push-ups';
  const stepper2Category = moveConfig?.stepper2?.category || 'pushup';
  const barbellWeightKg = moveConfig?.barbellWeightKg ?? 30;
  const enabledExercises = moveConfig?.enabledExercises;
  const targets = moveConfig?.targets;

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

      {/* Barbell Card */}
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
