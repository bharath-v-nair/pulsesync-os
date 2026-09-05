import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Plus } from 'lucide-react';
import { WorkoutCategory, BarbellExercise, WorkoutLog } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

export interface AddMissedMovementModalProps {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
  onLogWorkout: (log: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'> & { dateStr: string; timeFormatted: string }) => void;
}

export const AddMissedMovementModal: React.FC<AddMissedMovementModalProps> = ({
  isOpen,
  selectedDate,
  onClose,
  onLogWorkout,
}) => {
  const [category, setCategory] = useState<WorkoutCategory>('pullup');
  const [reps, setReps] = useState<number | ''>(5);
  const [weightKg, setWeightKg] = useState<number | ''>(30);
  const [selectedLift, setSelectedLift] = useState<BarbellExercise>('Squats');
  const [minutes, setMinutes] = useState<number | ''>(10);
  const [steps, setSteps] = useState<number | ''>(5000);
  const [distanceKm, setDistanceKm] = useState<number | ''>(4.0);
  const [machineType, setMachineType] = useState<'elliptical' | 'cycle'>('elliptical');
  const [timeFormatted, setTimeFormatted] = useState('12:00 PM');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(20);

    let name = '';
    const payload: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'> & {
      dateStr: string;
      timeFormatted: string;
    } = {
      category,
      name: '',
      dateStr: selectedDate,
      timeFormatted: timeFormatted || '12:00 PM',
    };

    if (category === 'pullup') {
      name = 'Half Pull-ups';
      payload.reps = typeof reps === 'number' ? reps : 5;
    } else if (category === 'pushup') {
      name = 'Push-ups';
      payload.reps = typeof reps === 'number' ? reps : 10;
    } else if (category === 'barbell') {
      name = `Barbell ${selectedLift}`;
      payload.reps = typeof reps === 'number' ? reps : 10;
      payload.weightKg = typeof weightKg === 'number' ? weightKg : 30;
    } else if (category === 'walk') {
      name = 'Walk';
      payload.steps = typeof steps === 'number' ? steps : 5000;
      payload.distanceKm = typeof distanceKm === 'number' ? distanceKm : 4.0;
    } else if (category === 'machine_cardio') {
      const mins = typeof minutes === 'number' ? minutes : 10;
      name = `${machineType === 'elliptical' ? 'Elliptical' : 'Cycle'} (${mins}m)`;
      payload.minutes = mins;
      payload.steps = mins * 110;
      payload.machineType = machineType;
      payload.tensionLevel = 5;
    }

    payload.name = name;
    onLogWorkout(payload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-sm bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-missed-movement"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 id="title-missed-movement" className="text-sm font-bold text-white">Add Missed Movement</h3>
              <p className="text-[11px] text-slate-400 font-mono">Date: {selectedDate}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center tap-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Category Tabs */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Exercise Type</label>
            <div
              className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-xl border border-white/10"
              role="radiogroup"
              aria-label="Exercise Type"
            >
              <button
                type="button"
                role="radio"
                aria-checked={category === 'pullup'}
                onClick={() => setCategory('pullup')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                  category === 'pullup' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pull-up
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={category === 'pushup'}
                onClick={() => setCategory('pushup')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                  category === 'pushup' ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Push-up
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={category === 'barbell'}
                onClick={() => setCategory('barbell')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                  category === 'barbell' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Barbell
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={category === 'walk'}
                onClick={() => setCategory('walk')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                  category === 'walk' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Walk
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={category === 'machine_cardio'}
                onClick={() => setCategory('machine_cardio')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                  category === 'machine_cardio' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Machine
              </button>
            </div>
          </div>

          {/* Pullup or Pushup */}
          {(category === 'pullup' || category === 'pushup') && (
            <div>
              <label htmlFor="missed-reps" className="text-[10px] font-mono text-slate-400 block mb-1">
                Completed Reps
              </label>
              <input
                id="missed-reps"
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                required
              />
            </div>
          )}

          {/* Barbell */}
          {category === 'barbell' && (
            <div className="space-y-2.5">
              <div>
                <label htmlFor="missed-lift" className="text-[10px] font-mono text-slate-400 block mb-1">
                  Lift
                </label>
                <select
                  id="missed-lift"
                  value={selectedLift}
                  onChange={(e) => setSelectedLift(e.target.value as BarbellExercise)}
                  className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                >
                  <option value="Squats">Squats</option>
                  <option value="Overhead Press">Overhead Press</option>
                  <option value="Bicep Curls">Bicep Curls</option>
                  <option value="Bent Rows">Bent Rows</option>
                  <option value="RDLs">RDLs</option>
                  <option value="Deadlifts">Deadlifts</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="missed-barbell-reps" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Reps
                  </label>
                  <input
                    id="missed-barbell-reps"
                    type="number"
                    min="1"
                    value={reps}
                    onChange={(e) => setReps(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="missed-barbell-weight" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    id="missed-barbell-weight"
                    type="number"
                    min="0"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Walk */}
          {category === 'walk' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="missed-walk-steps" className="text-[10px] font-mono text-slate-400 block mb-1">
                  Steps
                </label>
                <input
                  id="missed-walk-steps"
                  type="number"
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
                <label htmlFor="missed-walk-km" className="text-[10px] font-mono text-slate-400 block mb-1">
                  Distance (km)
                </label>
                <input
                  id="missed-walk-km"
                  type="number"
                  step="0.01"
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
          )}

          {/* Machine Cardio */}
          {category === 'machine_cardio' && (
            <div className="space-y-2.5">
              <div
                className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10"
                role="radiogroup"
                aria-label="Machine Cardio Type"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={machineType === 'elliptical'}
                  onClick={() => setMachineType('elliptical')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                    machineType === 'elliptical' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                  }`}
                >
                  Elliptical
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={machineType === 'cycle'}
                  onClick={() => setMachineType('cycle')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center tap-target ${
                    machineType === 'cycle' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                  }`}
                >
                  Stationary Cycle
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="missed-machine-mins" className="text-[10px] font-mono text-slate-400 block mb-1">
                    Duration (mins)
                  </label>
                  <input
                    id="missed-machine-mins"
                    type="number"
                    min="1"
                    max="180"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Cardio Steps
                  </label>
                  <div className="h-11 px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-slate-300 font-mono text-sm flex items-center">
                    {typeof minutes === 'number' ? (minutes * 110).toLocaleString() : 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Formatted */}
          <div>
            <label htmlFor="missed-time" className="text-[10px] font-mono text-slate-400 block mb-1">
              Time of Log (e.g. 10:14 AM)
            </label>
            <input
              id="missed-time"
              type="text"
              value={timeFormatted}
              onChange={(e) => setTimeFormatted(e.target.value)}
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold tap-target transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] spring-btn py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 tap-target transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Log Movement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
