import React from 'react';
import { Moon, Sun, Check, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { SleepRecord } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import {
  calculateSleepDuration,
  calculateDailySleepDebt,
  classifyCircadianPhase,
  isSleepOptimal,
  DEFAULT_SLEEP_BASELINE_HOURS,
} from '../../utils/habitsMath';

interface SleepCardProps {
  sleep: SleepRecord;
  onUpdateSleep: (sleep: SleepRecord) => void;
  onOpenProtocol?: (section: string) => void;
}

export const SleepCard: React.FC<SleepCardProps> = ({
  sleep,
  onUpdateSleep,
  onOpenProtocol,
}) => {
  const targetHours = sleep.targetHours > 0 ? sleep.targetHours : DEFAULT_SLEEP_BASELINE_HOURS;
  const durationHours = sleep.sleepDurationHours ?? 8.0;
  const isOptimal = isSleepOptimal(durationHours);
  const acuteDebt = calculateDailySleepDebt(durationHours, targetHours);
  const phase = classifyCircadianPhase(sleep.bedtimeRaw, durationHours);

  const handleBedtimeChange = (newBedtime: string) => {
    const { durationHours: newHours, durationFormatted } = calculateSleepDuration(newBedtime, sleep.wakeupRaw);
    const newOptimal = isSleepOptimal(newHours);
    const newDebt = calculateDailySleepDebt(newHours, targetHours);

    onUpdateSleep({
      ...sleep,
      bedtimeRaw: newBedtime,
      sleepDuration: durationFormatted,
      sleepDurationHours: newHours,
      isOptimal: newOptimal,
      sleepDebtHours: newDebt,
    });
  };

  const handleWakeupChange = (newWakeup: string) => {
    const { durationHours: newHours, durationFormatted } = calculateSleepDuration(sleep.bedtimeRaw, newWakeup);
    const newOptimal = isSleepOptimal(newHours);
    const newDebt = calculateDailySleepDebt(newHours, targetHours);

    onUpdateSleep({
      ...sleep,
      wakeupRaw: newWakeup,
      sleepDuration: durationFormatted,
      sleepDurationHours: newHours,
      isOptimal: newOptimal,
      sleepDebtHours: newDebt,
    });
  };

  const handleToggleSunlight = () => {
    triggerHaptic(15);
    onUpdateSleep({ ...sleep, sunlightDone: !sleep.sunlightDone });
  };

  // Simple, intuitive timing badge
  const getTimingBadge = () => {
    switch (phase) {
      case 'optimal':
        return <span className="badge-pill text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Optimal Window</span>;
      case 'delayed':
        return <span className="badge-pill text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20">Delayed Bedtime</span>;
      case 'short':
        return <span className="badge-pill text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20">Short Sleep</span>;
      case 'shifted':
        return <span className="badge-pill text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20">Late Night Shift</span>;
      default:
        return <span className="badge-pill text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">Calibrated</span>;
    }
  };

  return (
    <div className="matte-card p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Sleep</h3>
          {onOpenProtocol && (
            <button
              type="button"
              onClick={() => onOpenProtocol('sleep')}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Explain Sleep Science"
              aria-label="Sleep Science"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getTimingBadge()}
          <span className="badge-pill bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px] tabular-nums">
            {sleep.sleepDuration || `${durationHours.toFixed(1)}h`}
          </span>
        </div>
      </div>

      {/* Bedtime & Wakeup Inputs */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-[#090d16] border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Bedtime</span>
            <Clock className="w-3 h-3 text-slate-500" />
          </div>
          <input
            type="time"
            value={sleep.bedtimeRaw || '23:15'}
            onChange={(e) => handleBedtimeChange(e.target.value)}
            className="w-full h-9 bg-transparent text-slate-100 font-mono font-bold text-sm outline-none cursor-pointer"
          />
        </div>

        <div className="p-3 rounded-xl bg-[#090d16] border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Wake-up</span>
            <Clock className="w-3 h-3 text-slate-500" />
          </div>
          <input
            type="time"
            value={sleep.wakeupRaw || '07:15'}
            onChange={(e) => handleWakeupChange(e.target.value)}
            className="w-full h-9 bg-transparent text-slate-100 font-mono font-bold text-sm outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Sleep Duration & Debt Breakdown */}
      <div className="p-3 rounded-xl bg-[#0c1017] border border-white/5 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block mb-0.5">Sleep Duration</span>
          <span className="font-bold text-white tabular-nums">
            {durationHours.toFixed(1)}h / {targetHours.toFixed(1)}h goal
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">Sleep Balance</span>
          {acuteDebt > 0 ? (
            <span className="text-rose-400 font-bold flex items-center gap-1 justify-end tabular-nums">
              <AlertCircle className="w-3 h-3" />
              -{acuteDebt.toFixed(1)}h Debt
            </span>
          ) : durationHours > targetHours ? (
            <span className="text-emerald-400 font-bold tabular-nums">
              +{(durationHours - targetHours).toFixed(1)}h Surplus
            </span>
          ) : (
            <span className="text-sky-400 font-bold tabular-nums">
              {isOptimal ? 'Optimal (7.5-8.5h)' : 'On Target'}
            </span>
          )}
        </div>
      </div>

      {/* Morning Sunlight Toggle */}
      <button
        type="button"
        onClick={handleToggleSunlight}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all tap-target text-left active:scale-[0.99] ${
          sleep.sunlightDone
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-[#090d16] border-white/5 hover:border-white/10 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Sun className={`w-4 h-4 shrink-0 ${sleep.sunlightDone ? 'text-amber-400' : 'text-slate-500'}`} />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold block">
              Morning Sunlight
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (10 min within 30 min of waking)
            </span>
          </div>
        </div>
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            sleep.sunlightDone ? 'bg-amber-400 text-black shadow-md' : 'bg-white/5 border border-white/10'
          }`}
        >
          {sleep.sunlightDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </button>
    </div>
  );
};
