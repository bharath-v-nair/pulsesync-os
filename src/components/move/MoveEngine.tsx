import React, { useState } from 'react';
import { WorkoutLog, StickyDefaults, BarbellExercise } from '../../types';
import { ScorecardsGrid } from './ScorecardsGrid';
import { ExerciseStepper } from './ExerciseStepper';
import { BarbellCard } from './BarbellCard';
import { CardioCard } from './CardioCard';
import { WorkoutTimeline } from './WorkoutTimeline';
import { EditWorkoutModal } from './EditWorkoutModal';

interface MoveEngineProps {
  logs: WorkoutLog[];
  stickyDefaults: StickyDefaults;
  onUpdateDefaults: (defaults: StickyDefaults) => void;
  onLogWorkout: (log: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'>) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (updated: WorkoutLog) => void;
}

export const MoveEngine: React.FC<MoveEngineProps> = ({
  logs,
  stickyDefaults,
  onUpdateDefaults,
  onLogWorkout,
  onDeleteLog,
  onUpdateLog,
}) => {
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);

  return (
    <div className="space-y-4">
      {/* 4 Dynamic Scorecards (Pull-ups, Push-ups, Tonnage, Cardio) */}
      <ScorecardsGrid logs={logs} />

      {/* Quick Action Stepper 1: Pull-ups */}
      <ExerciseStepper
        title="Half Pull-ups"
        reps={stickyDefaults.pullupReps}
        onRepsChange={(newReps) =>
          onUpdateDefaults({ ...stickyDefaults, pullupReps: newReps })
        }
        onLog={(reps) =>
          onLogWorkout({
            category: 'pullup',
            name: 'Half Pull-ups',
            reps,
          })
        }
      />

      {/* Quick Action Stepper 2: Push-ups */}
      <ExerciseStepper
        title="Push-ups"
        reps={stickyDefaults.pushupReps}
        onRepsChange={(newReps) =>
          onUpdateDefaults({ ...stickyDefaults, pushupReps: newReps })
        }
        onLog={(reps) =>
          onLogWorkout({
            category: 'pushup',
            name: 'Push-ups',
            reps,
          })
        }
      />

      {/* Barbell Card */}
      <BarbellCard
        selectedLift={stickyDefaults.selectedLift}
        reps={stickyDefaults.barbellReps}
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
