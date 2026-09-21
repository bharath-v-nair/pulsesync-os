import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, Check, Clock, AlertCircle, HelpCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { SleepRecord, SleepSession } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import {
  calculateSleepDuration,
  calculateMultiSessionSleep,
  calculateDailySleepDebt,
  classifyCircadianPhase,
  isSleepOptimal,
  DEFAULT_SLEEP_BASELINE_HOURS,
} from '../../utils/habitsMath';
import { getTodayDateStr } from '../../services/storage';

interface SleepCardProps {
  sleep: SleepRecord;
  sleepTargetHours?: number;
  onUpdateSleep: (sleep: SleepRecord) => void;
  onOpenProtocol?: (section: string) => void;
}

export const SleepCard: React.FC<SleepCardProps> = ({
  sleep,
  sleepTargetHours,
  onUpdateSleep,
  onOpenProtocol,
}) => {
  const targetHours = sleepTargetHours || (sleep.targetHours > 0 ? sleep.targetHours : DEFAULT_SLEEP_BASELINE_HOURS);
  const todayStr = getTodayDateStr();

  // 1. Primary Sleep Draft State
  const [bedtime, setBedtime] = useState<string>(sleep.bedtimeRaw || '23:00');
  const [wakeup, setWakeup] = useState<string>(sleep.wakeupRaw || '07:00');

  useEffect(() => {
    if (sleep.bedtimeRaw) setBedtime(sleep.bedtimeRaw);
    if (sleep.wakeupRaw) setWakeup(sleep.wakeupRaw);
  }, [sleep.bedtimeRaw, sleep.wakeupRaw]);

  // 2. Nap / Second Sleep State
  // Strictly only show if sleep.sessions has > 1 session OR user explicitly clicked "+ Add 2nd sleep / nap"
  const existingSecondSession = sleep.sessions && sleep.sessions.length > 1 ? sleep.sessions[1] : null;
  const [showNap, setShowNap] = useState<boolean>(Boolean(existingSecondSession));
  const [napBedtime, setNapBedtime] = useState<string>(existingSecondSession?.bedtimeRaw || '13:00');
  const [napWakeup, setNapWakeup] = useState<string>(existingSecondSession?.wakeupRaw || '14:00');

  useEffect(() => {
    const has2nd = Boolean(sleep.sessions && sleep.sessions.length > 1);
    setShowNap(has2nd);
    if (has2nd && sleep.sessions![1]) {
      setNapBedtime(sleep.sessions![1].bedtimeRaw);
      setNapWakeup(sleep.sessions![1].wakeupRaw);
    }
  }, [sleep.sessions]);

  // 3. Status tracking
  const isLogged = Boolean(sleep.isLoggedToday || sleep.lastLoggedDate === todayStr);
  const [justLogged, setJustLogged] = useState(false);

  // 4. Draft calculations in real time as the user tweaks times
  const primaryCalc = useMemo(() => calculateSleepDuration(bedtime, wakeup), [bedtime, wakeup]);

  const combinedCalc = useMemo(() => {
    if (!showNap) {
      return {
        durationHours: primaryCalc.durationHours,
        durationFormatted: primaryCalc.durationFormatted,
        isOptimal: isSleepOptimal(primaryCalc.durationHours),
        debtHours: calculateDailySleepDebt(primaryCalc.durationHours, targetHours),
        phase: classifyCircadianPhase(bedtime, primaryCalc.durationHours),
        sessions: undefined as SleepSession[] | undefined,
      };
    }
    const s1: SleepSession = {
      id: 'sess_1',
      bedtimeRaw: bedtime,
      wakeupRaw: wakeup,
      durationHours: primaryCalc.durationHours,
      durationFormatted: primaryCalc.durationFormatted,
      label: 'Primary Sleep',
    };
    const s2Draft = calculateSleepDuration(napBedtime, napWakeup);
    const s2: SleepSession = {
      id: 'sess_2',
      bedtimeRaw: napBedtime,
      wakeupRaw: napWakeup,
      durationHours: s2Draft.durationHours,
      durationFormatted: s2Draft.durationFormatted,
      label: 'Second Sleep / Nap',
    };
    const multi = calculateMultiSessionSleep([s1, s2]);
    return {
      durationHours: multi.totalHours,
      durationFormatted: multi.totalFormatted,
      isOptimal: multi.isOptimal,
      debtHours: calculateDailySleepDebt(multi.totalHours, targetHours),
      phase: classifyCircadianPhase(bedtime, multi.totalHours),
      sessions: multi.sessions,
    };
  }, [bedtime, wakeup, showNap, napBedtime, napWakeup, primaryCalc, targetHours]);

  // Check if draft inputs differ from what's currently recorded
  const isDirty = useMemo(() => {
    if (!isLogged) return true;
    if (bedtime !== sleep.bedtimeRaw || wakeup !== sleep.wakeupRaw) return true;
    const hasExistingNap = Boolean(sleep.sessions && sleep.sessions.length > 1);
    if (showNap !== hasExistingNap) return true;
    if (showNap && existingSecondSession) {
      if (napBedtime !== existingSecondSession.bedtimeRaw || napWakeup !== existingSecondSession.wakeupRaw) return true;
    }
    return false;
  }, [isLogged, bedtime, wakeup, sleep.bedtimeRaw, sleep.wakeupRaw, showNap, existingSecondSession, napBedtime, napWakeup]);

  // Action: LOG SLEEP
  const handleLogSleep = () => {
    triggerHaptic(25);
    const updated: SleepRecord = {
      ...sleep,
      bedtimeRaw: bedtime,
      wakeupRaw: wakeup,
      sleepDuration: combinedCalc.durationFormatted,
      sleepDurationHours: combinedCalc.durationHours,
      isOptimal: combinedCalc.isOptimal,
      sleepDebtHours: combinedCalc.debtHours,
      sessions: combinedCalc.sessions,
      isLoggedToday: true,
      lastLoggedDate: todayStr,
    };
    onUpdateSleep(updated);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2500);
  };

  // Action: REMOVE NAP
  const handleRemoveNap = () => {
    triggerHaptic(15);
    setShowNap(false);
    if (isLogged) {
      const updated: SleepRecord = {
        ...sleep,
        bedtimeRaw: bedtime,
        wakeupRaw: wakeup,
        sleepDuration: primaryCalc.durationFormatted,
        sleepDurationHours: primaryCalc.durationHours,
        isOptimal: isSleepOptimal(primaryCalc.durationHours),
        sleepDebtHours: calculateDailySleepDebt(primaryCalc.durationHours, targetHours),
        sessions: undefined,
        isLoggedToday: true,
        lastLoggedDate: todayStr,
      };
      onUpdateSleep(updated);
    }
  };

  // Action: ADD NAP
  const handleAddNap = () => {
    triggerHaptic(15);
    setShowNap(true);
  };

  // Action: SUNLIGHT toggle (instant 1-tap auto-save)
  const handleToggleSunlight = () => {
    triggerHaptic(15);
    onUpdateSleep({ ...sleep, sunlightDone: !sleep.sunlightDone });
  };

  const getTimingBadge = () => {
    switch (combinedCalc.phase) {
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
          {isLogged ? (
            <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[10px] tabular-nums">
              ✓ Logged ({sleep.sleepDuration || `${sleep.sleepDurationHours?.toFixed(1) || '8.0'}h`})
            </span>
          ) : (
            <span className="badge-pill bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[10px] tabular-nums">
              Pending Log ({combinedCalc.durationFormatted})
            </span>
          )}
        </div>
      </div>

      {/* Primary Bedtime & Wakeup Pickers */}
      <div className="space-y-1.5">
        {showNap && (
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Session 1 (Night Sleep)</span>
            <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {primaryCalc.durationFormatted}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-[#090d16] border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Bedtime</span>
              <Clock className="w-3 h-3 text-slate-500" />
            </div>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
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
              value={wakeup}
              onChange={(e) => setWakeup(e.target.value)}
              className="w-full h-9 bg-transparent text-slate-100 font-mono font-bold text-sm outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Optional Second Sleep / Nap Section */}
      {showNap ? (
        <div className="p-2.5 rounded-xl bg-[#070a12] border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider font-semibold">
                Session 2 (2nd Sleep / Nap)
              </span>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {calculateSleepDuration(napBedtime, napWakeup).durationFormatted}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveNap}
              className="text-slate-500 hover:text-rose-400 px-1.5 py-0.5 text-[10px] font-mono flex items-center gap-1 transition-colors rounded hover:bg-rose-500/10 cursor-pointer"
              title="Remove 2nd sleep session"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
              <span className="text-[9px] text-slate-400 font-mono block">Bedtime</span>
              <input
                type="time"
                value={napBedtime}
                onChange={(e) => setNapBedtime(e.target.value)}
                className="w-full bg-transparent text-slate-100 font-mono text-xs font-bold outline-none cursor-pointer"
              />
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
              <span className="text-[9px] text-slate-400 font-mono block">Wake-up</span>
              <input
                type="time"
                value={napWakeup}
                onChange={(e) => setNapWakeup(e.target.value)}
                className="w-full bg-transparent text-slate-100 font-mono text-xs font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleAddNap}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-indigo-300 active:text-indigo-200 transition-colors py-0.5 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>+ Add 2nd sleep / nap (biphasic)</span>
          </button>
        </div>
      )}

      {/* Sleep Duration & Debt Breakdown */}
      <div className="p-3 rounded-xl bg-[#0c1017] border border-white/5 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block mb-0.5">
            {showNap ? 'Total Sleep (Combined)' : 'Sleep Duration'}
          </span>
          <span className="font-bold text-white tabular-nums">
            {combinedCalc.durationHours.toFixed(1)}h / {targetHours.toFixed(1)}h goal
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">Sleep Balance</span>
          {combinedCalc.debtHours > 0 ? (
            <span className="text-rose-400 font-bold flex items-center gap-1 justify-end tabular-nums">
              <AlertCircle className="w-3 h-3" />
              -{combinedCalc.debtHours.toFixed(1)}h Debt
            </span>
          ) : combinedCalc.durationHours > targetHours ? (
            <span className="text-emerald-400 font-bold tabular-nums">
              +{(combinedCalc.durationHours - targetHours).toFixed(1)}h Surplus
            </span>
          ) : (
            <span className="text-sky-400 font-bold tabular-nums">
              {combinedCalc.isOptimal ? 'Optimal (7.5-8.5h)' : 'On Target'}
            </span>
          )}
        </div>
      </div>

      {/* Dedicated Log Sleep Action Button */}
      <div>
        {justLogged ? (
          <div className="w-full min-h-[46px] rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Sleep Logged for Today ({combinedCalc.durationFormatted})</span>
          </div>
        ) : !isLogged ? (
          <button
            type="button"
            onClick={handleLogSleep}
            className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all tap-target cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>LOG SLEEP ({combinedCalc.durationFormatted})</span>
          </button>
        ) : isDirty ? (
          <button
            type="button"
            onClick={handleLogSleep}
            className="w-full min-h-[46px] rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-mono font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all tap-target cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5] text-indigo-400" />
            <span>UPDATE SLEEP LOG ({combinedCalc.durationFormatted})</span>
          </button>
        ) : (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300">
                Sleep Confirmed: {combinedCalc.durationFormatted}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogSleep}
              className="text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title="Re-save or refresh sleep log"
            >
              Re-log
            </button>
          </div>
        )}
      </div>

      {/* Morning Sunlight Toggle (Instant 1-Tap Auto-Save) */}
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
