import React, { useState, useEffect } from 'react';
import { X, Check, Dumbbell, Shield, Flame, Footprints, Activity, Clock, Zap } from 'lucide-react';
import { WorkoutLog } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface EditWorkoutModalProps {
  isOpen: boolean;
  log: WorkoutLog | null;
  onClose: () => void;
  onSave: (updated: WorkoutLog) => void;
}

export const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({
  isOpen,
  log,
  onClose,
  onSave,
}) => {
  const [reps, setReps] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [minutes, setMinutes] = useState<number | ''>('');
  const [tensionLevel, setTensionLevel] = useState<number | ''>('');
  const [steps, setSteps] = useState<number | ''>('');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [timeFormatted, setTimeFormatted] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (log) {
      setReps(log.reps ?? '');
      setWeightKg(log.weightKg ?? '');
      setMinutes(log.minutes ?? '');
      setTensionLevel(log.tensionLevel ?? 5);
      setSteps(log.steps ?? '');
      setDistanceKm(log.distanceKm ?? '');
      setTimeFormatted(log.timeFormatted || '');
      setStartTime(log.startTime || '');
      setEndTime(log.endTime || '');
    }
  }, [log]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(20);

    const updated: WorkoutLog = {
      ...log,
      timeFormatted: timeFormatted || log.timeFormatted,
    };

    if (log.category === 'barbell') {
      updated.reps = typeof reps === 'number' ? reps : (log.reps || 0);
      updated.weightKg = typeof weightKg === 'number' ? weightKg : (log.weightKg || 30);
    } else if (log.category === 'pullup' || log.category === 'pushup' || log.category === 'dips') {
      updated.reps = typeof reps === 'number' ? reps : (log.reps || 0);
    } else if (log.category === 'machine_cardio') {
      const finalMins = typeof minutes === 'number' ? minutes : (log.minutes || 10);
      updated.minutes = finalMins;
      updated.tensionLevel = typeof tensionLevel === 'number' ? tensionLevel : 5;
      updated.steps = typeof steps === 'number' ? steps : finalMins * 110;
      if (typeof distanceKm === 'number') updated.distanceKm = distanceKm;
    } else if (log.category === 'walk') {
      if (typeof steps === 'number') updated.steps = steps;
      if (typeof distanceKm === 'number') updated.distanceKm = distanceKm;
      if (startTime) updated.startTime = startTime;
      if (endTime) updated.endTime = endTime;
    }

    onSave(updated);
    onClose();
  };

  const getCategoryIcon = () => {
    switch (log.category) {
      case 'pullup':
        return <Dumbbell className="w-4 h-4 text-sky-400" />;
      case 'dips':
        return <Zap className="w-4 h-4 text-teal-400" />;
      case 'pushup':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'barbell':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'walk':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'machine_cardio':
        return <Activity className="w-4 h-4 text-sky-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-sm bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-workout-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <div>
              <h3 id="edit-workout-modal-title" className="text-sm font-bold text-white">Edit Entry</h3>
              <p className="text-[11px] text-slate-400 font-mono">{log.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 tap-target transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Barbell Form Fields */}
          {log.category === 'barbell' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="edit-barbell-reps" className="text-[10px] font-mono text-slate-400 block mb-1">
                  Reps
                </label>
                <input
                  id="edit-barbell-reps"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="500"
                  value={reps}
                  onChange={(e) => setReps(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-barbell-weight" className="text-[10px] font-mono text-slate-400 block mb-1">
                  Weight (kg)
                </label>
                <input
                  id="edit-barbell-weight"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="1000"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              {typeof reps === 'number' && typeof weightKg === 'number' && (
                <div className="col-span-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[11px] font-mono text-amber-300">
                    Volume: {reps * weightKg} kg tonnage
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bodyweight (Pull-up / Push-up) Form Fields */}
          {(log.category === 'pullup' || log.category === 'pushup') && (
            <div>
              <label htmlFor="edit-bodyweight-reps" className="text-[10px] font-mono text-slate-400 block mb-1">
                Completed Reps
              </label>
              <input
                id="edit-bodyweight-reps"
                type="number"
                inputMode="numeric"
                min="1"
                max="1000"
                value={reps}
                onChange={(e) => setReps(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                required
              />
            </div>
          )}

          {/* Machine Cardio Fields */}
          {log.category === 'machine_cardio' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-machine-minutes" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Minutes
                  </label>
                  <input
                    id="edit-machine-minutes"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="300"
                    value={minutes}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setMinutes(val);
                      if (typeof val === 'number' && !isNaN(val)) {
                        const computedSteps = val * 110;
                        setSteps(computedSteps);
                        setDistanceKm(parseFloat((computedSteps * 0.0008).toFixed(2)));
                      }
                    }}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-machine-tension" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Tension Level (1-10)
                  </label>
                  <input
                    id="edit-machine-tension"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="10"
                    value={tensionLevel}
                    onChange={(e) => setTensionLevel(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-machine-steps" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Cardio Steps
                  </label>
                  <input
                    id="edit-machine-steps"
                    type="number"
                    inputMode="numeric"
                    value={steps}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setSteps(val);
                      if (typeof val === 'number' && !isNaN(val)) {
                        setDistanceKm(parseFloat((val * 0.0008).toFixed(2)));
                      } else {
                        setDistanceKm('');
                      }
                    }}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="edit-machine-distance" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Distance (km)
                  </label>
                  <input
                    id="edit-machine-distance"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={distanceKm}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setDistanceKm(val);
                      if (typeof val === 'number' && !isNaN(val)) {
                        setSteps(Math.round(val / 0.0008));
                      } else {
                        setSteps('');
                      }
                    }}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Walk Fields */}
          {log.category === 'walk' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-walk-steps" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Steps
                  </label>
                  <input
                    id="edit-walk-steps"
                    type="number"
                    inputMode="numeric"
                    value={steps}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setSteps(val);
                      if (typeof val === 'number' && !isNaN(val)) {
                        setDistanceKm(parseFloat((val * 0.0008).toFixed(2)));
                      } else {
                        setDistanceKm('');
                      }
                    }}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="edit-walk-distance" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Distance (km)
                  </label>
                  <input
                    id="edit-walk-distance"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={distanceKm}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setDistanceKm(val);
                      if (typeof val === 'number' && !isNaN(val)) {
                        setSteps(Math.round(val / 0.0008));
                      } else {
                        setSteps('');
                      }
                    }}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-walk-start" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Start Time
                  </label>
                  <input
                    id="edit-walk-start"
                    type="time"
                    style={{ colorScheme: 'dark' }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-11 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="edit-walk-end" className="text-[10px] font-mono text-slate-400 block mb-1">
                    End Time
                  </label>
                  <input
                    id="edit-walk-end"
                    type="time"
                    style={{ colorScheme: 'dark' }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-11 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Time Formatted Field (Common) */}
          <div>
            <label htmlFor="edit-time-formatted" className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Time of Log (e.g. 10:14 AM or 21:01)</span>
            </label>
            <input
              id="edit-time-formatted"
              type="text"
              value={timeFormatted}
              onChange={(e) => setTimeFormatted(e.target.value)}
              placeholder="10:14 AM"
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 text-xs font-semibold tap-target transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] spring-btn py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
