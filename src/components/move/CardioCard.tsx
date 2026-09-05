import React, { useState } from 'react';
import { Footprints, Plus, Minus, Activity, Bike, Info, Clock, Check, X } from 'lucide-react';
import { WorkoutLog, StickyDefaults } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface CardioCardProps {
  logs: WorkoutLog[];
  stickyDefaults: StickyDefaults;
  onUpdateDefaults: (defaults: StickyDefaults) => void;
  onLogWorkout: (log: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'>) => void;
  onDeleteLog?: (id: string) => void;
}

type WalkSlot = 'Morning' | 'Evening';

const getInitialWalkSlot = (): WalkSlot => {
  const hour = new Date().getHours();
  return hour < 14 ? 'Morning' : 'Evening';
};

export const CardioCard: React.FC<CardioCardProps> = ({
  logs,
  stickyDefaults,
  onUpdateDefaults,
  onLogWorkout,
}) => {
  // Walk State
  const [walkSlot, setWalkSlot] = useState<WalkSlot>(getInitialWalkSlot);
  const [stepsInput, setStepsInput] = useState<string>('5000');
  const [kmInput, setKmInput] = useState<string>('4.00');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Machine State
  const [showMachineInfo, setShowMachineInfo] = useState<boolean>(false);
  const machineType = stickyDefaults.machineType || 'elliptical';
  const machineMins = Math.max(1, Math.min(180, stickyDefaults.machineMins || 10));
  const machineSteps = machineMins * 110;

  // Check if a walk has already been logged for each slot today
  const isSlotLogged = (slot: WalkSlot) => {
    return logs.some(
      (l) => l.category === 'walk' && l.name.toLowerCase().includes(slot.toLowerCase())
    );
  };

  // Two-way synchronous step ↔ km calculations
  const handleStepsChange = (val: string) => {
    setStepsInput(val);
    if (!val.trim()) {
      setKmInput('');
      return;
    }
    const steps = parseInt(val, 10);
    if (!isNaN(steps) && steps >= 0) {
      setKmInput((steps * 0.0008).toFixed(2));
    } else {
      setKmInput('');
    }
  };

  const handleKmChange = (val: string) => {
    setKmInput(val);
    if (!val.trim()) {
      setStepsInput('');
      return;
    }
    const km = parseFloat(val);
    if (!isNaN(km) && km >= 0) {
      setStepsInput(String(Math.round(km / 0.0008)));
    } else {
      setStepsInput('');
    }
  };

  const handleLogWalk = () => {
    const stepsNum = parseInt(stepsInput, 10);
    const kmNum = parseFloat(kmInput);

    if (!stepsNum && !kmNum) return;

    triggerHaptic(20);
    const finalSteps = stepsNum || Math.round((kmNum || 0) / 0.0008);
    const finalKm = kmNum || parseFloat((finalSteps * 0.0008).toFixed(2));

    onLogWorkout({
      category: 'walk',
      name: `${walkSlot} Walk`,
      steps: finalSteps,
      distanceKm: finalKm,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
  };

  // Machine controls
  const handleMachineTypeChange = (type: 'elliptical' | 'cycle') => {
    triggerHaptic(10);
    onUpdateDefaults({
      ...stickyDefaults,
      machineType: type,
    });
  };

  const handleMinsChange = (delta: number) => {
    triggerHaptic(10);
    const newMins = Math.max(1, Math.min(180, machineMins + delta));
    onUpdateDefaults({
      ...stickyDefaults,
      machineMins: newMins,
    });
  };

  const handleLogMachine = () => {
    triggerHaptic(20);
    const label = machineType === 'elliptical' ? 'Elliptical' : 'Cycle';
    onLogWorkout({
      category: 'machine_cardio',
      name: `${label} (${machineMins}m)`,
      minutes: machineMins,
      steps: machineSteps,
      tensionLevel: 5,
      machineType: machineType,
    });
  };

  const slots: WalkSlot[] = ['Morning', 'Evening'];

  return (
    <div className="matte-card p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Cardio & Aerobics</h3>
        </div>
        <span className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
          Target: 8k Steps
        </span>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DAILY WALK */}
      {/* ========================================================================= */}
      <div className="space-y-3 p-3 rounded-2xl bg-[#090d15] border border-emerald-500/15">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-[9px] text-emerald-400/90 font-mono">Daily Walk</span>
        </div>

        {/* Slot Selector: Morning & Evening Checkbox/Toggle Buttons */}
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Walk Time of Day"
        >
          {slots.map((slot) => {
            const isSelected = walkSlot === slot;
            const isDone = isSlotLogged(slot);
            return (
              <button
                key={slot}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${slot} Walk${isDone ? ' (already completed today)' : ''}`}
                onClick={() => {
                  triggerHaptic(10);
                  setWalkSlot(slot);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all min-h-[44px] tap-target ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'border-slate-600 bg-black/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                  <span>{slot} Walk</span>
                </div>
                {isDone && (
                  <span className="text-[10px] font-mono text-emerald-400/90 font-medium">
                    ✓ Logged
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Steps & Distance Inputs */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="walk-steps-input" className="text-[10px] font-mono text-slate-400 block mb-1">
              Steps
            </label>
            <input
              id="walk-steps-input"
              type="number"
              inputMode="numeric"
              placeholder="5000"
              value={stepsInput}
              onChange={(e) => handleStepsChange(e.target.value)}
              className="w-full h-10 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="walk-km-input" className="text-[10px] font-mono text-slate-400 block mb-1">
              Distance (km)
            </label>
            <input
              id="walk-km-input"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="4.00"
              value={kmInput}
              onChange={(e) => handleKmChange(e.target.value)}
              className="w-full h-10 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Start Time & Stop Time (Life Tracking) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="walk-start-time" className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400/80" />
              <span>Start Time</span>
            </label>
            <input
              id="walk-start-time"
              type="time"
              value={startTime}
              style={{ colorScheme: 'dark' }}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-10 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="walk-end-time" className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400/80" />
              <span>Stop Time</span>
            </label>
            <input
              id="walk-end-time"
              type="time"
              value={endTime}
              style={{ colorScheme: 'dark' }}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-10 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Sleek Compact Log Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleLogWalk}
            disabled={!stepsInput && !kmInput}
            aria-label={`Log ${walkSlot} Walk`}
            className="spring-btn px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all tap-target active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log {walkSlot} Walk</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/5" />

      {/* ========================================================================= */}
      {/* SECTION 2: MACHINE (Elliptical / Cycle) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="eyebrow text-[9px] text-slate-400 font-mono">Machine</span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setShowMachineInfo((prev) => !prev);
              }}
              className="p-1 rounded-md text-slate-500 hover:text-sky-300 hover:bg-white/5 transition-colors tap-target"
              aria-label="Machine calibration information"
              title="Calibration details"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Machine Calibration Info Modal / Popover */}
        {showMachineInfo && (
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/20 text-xs font-mono text-sky-200 flex items-start justify-between gap-2 animate-fadeIn">
            <div>
              <span className="font-bold text-sky-300 block mb-0.5">Machine Calibration</span>
              <span className="text-[11px] text-sky-200/80">
                Standardized at Level 5 Tension • ~110 steps/min. Both Elliptical and Cycle convert 1 min = 110 cardio steps.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowMachineInfo(false)}
              className="text-sky-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
              aria-label="Close info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Segmented Machine Type Selector */}
        <div
          className="grid grid-cols-2 p-1 bg-[#0a0d14] rounded-xl border border-white/10 gap-1"
          role="radiogroup"
          aria-label="Machine Type"
        >
          <button
            type="button"
            role="radio"
            aria-checked={machineType === 'elliptical'}
            aria-label="Elliptical machine"
            onClick={() => handleMachineTypeChange('elliptical')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] tap-target active:scale-[0.98] ${
              machineType === 'elliptical'
                ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Elliptical</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={machineType === 'cycle'}
            aria-label="Stationary Cycle"
            onClick={() => handleMachineTypeChange('cycle')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] tap-target active:scale-[0.98] ${
              machineType === 'cycle'
                ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4 text-sky-400" />
            <span>Cycle</span>
          </button>
        </div>

        {/* Stepper + Log Button Control Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Minutes Stepper (- / + 1m with range 1 to 180 mins) */}
          <div className="flex items-center gap-1 bg-[#0b0f17] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => handleMinsChange(-1)}
              disabled={machineMins <= 1}
              className="stepper-btn tap-target disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease by 1 minute"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="w-14 text-center" aria-live="polite">
              <span className="text-xl font-bold font-mono text-white tabular-nums block">
                {machineMins}
              </span>
              <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                mins
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleMinsChange(1)}
              disabled={machineMins >= 180}
              className="stepper-btn tap-target disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase by 1 minute"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Sleek Compact LOG Button */}
          <button
            type="button"
            onClick={handleLogMachine}
            aria-label={`Log ${machineMins} minutes of ${machineType === 'elliptical' ? 'Elliptical' : 'Cycle'} (+${machineSteps.toLocaleString()} steps)`}
            className="flex-1 spring-btn h-11 rounded-xl bg-sky-500/90 hover:bg-sky-400 active:bg-sky-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/15 transition-all tap-target active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log (+{machineMins}m)</span>
            <span className="text-[10px] font-mono font-medium opacity-75">
              • +{machineSteps.toLocaleString()} steps
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
