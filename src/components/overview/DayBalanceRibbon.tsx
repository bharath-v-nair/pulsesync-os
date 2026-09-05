import React from 'react';
import { WorkoutLog, FocusData, HabitsData } from '../../types';
import { Moon, Brain, Dumbbell, Coffee } from 'lucide-react';
import { getTodayDateStr } from '../../services/storage';

interface DayBalanceRibbonProps {
  workouts: WorkoutLog[];
  focus: FocusData;
  habits: HabitsData;
  selectedDate: string;
}

export const DayBalanceRibbon: React.FC<DayBalanceRibbonProps> = ({
  workouts,
  focus,
  habits,
  selectedDate,
}) => {
  const todayStr = getTodayDateStr();
  const isToday = selectedDate === todayStr;

  // 1. Calculate Sleep Hours
  let sleepHours = 8.0;
  const habitRecord = habits.dailyRecords?.[selectedDate];
  if (habitRecord?.sleepDurationHours != null) {
    sleepHours = habitRecord.sleepDurationHours;
  } else if (habitRecord?.sleepDuration) {
    const match = habitRecord.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
    if (match) {
      const h = parseInt(match[1], 10) || 0;
      const m = parseInt(match[2], 10) || 0;
      sleepHours = Math.round((h + m / 60) * 100) / 100;
    }
  } else if (isToday) {
    if (habits.sleep?.sleepDurationHours != null) {
      sleepHours = habits.sleep.sleepDurationHours;
    } else if (habits.sleep?.sleepDuration) {
      const match = habits.sleep.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
      if (match) {
        const h = parseInt(match[1], 10) || 0;
        const m = parseInt(match[2], 10) || 0;
        sleepHours = Math.round((h + m / 60) * 100) / 100;
      }
    }
  }

  // 2. Calculate Focus Hours
  const daySessions = focus.sessions.filter((s) => {
    if (s.dateStr === selectedDate) return true;
    const ts = s.timestamp || s.startTimestamp;
    if (ts && !isNaN(new Date(ts).getTime())) {
      return new Date(ts).toISOString().split('T')[0] === selectedDate;
    }
    return false;
  });
  let focusMins = daySessions.reduce(
    (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
    0
  );
  if (focusMins === 0 && focus.stats.totalStudySeconds > 0) {
    focusMins = Math.round(focus.stats.totalStudySeconds / 60);
  }
  const focusHours = Math.min(12, focusMins / 60);

  // 3. Calculate Movement Hours
  const dayWorkouts = workouts.filter((w) =>
    !w.dateStr ? true : w.dateStr === selectedDate
  );
  let movementMins = 0;
  dayWorkouts.forEach((w) => {
    if (w.category === 'walk') {
      movementMins += (w.distanceKm || 4.0) * 11; // ~11 min per km
    } else if (w.category === 'machine_cardio') {
      movementMins += w.minutes || 10;
    } else {
      movementMins += 3; // ~3 mins per strength set
    }
  });
  const movementHours = Math.min(6, Math.max(0.2, movementMins / 60));

  // 4. Remaining: Rest & Calibration
  const accountedHours = sleepHours + focusHours + movementHours;
  const restHours = Math.max(1.0, 24 - accountedHours);
  const total = sleepHours + focusHours + movementHours + restHours;

  const sleepPct = Math.round((sleepHours / total) * 100);
  const focusPct = Math.round((focusHours / total) * 100);
  const movePct = Math.round((movementHours / total) * 100);
  const restPct = Math.max(0, 100 - (sleepPct + focusPct + movePct));

  return (
    <div className="matte-card p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            24-Hour Circadian Day Balance
          </h3>
        </div>
        <span className="badge-pill bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-[10px]">
          24h Calibration
        </span>
      </div>

      {/* Segmented Ribbon Bar */}
      <div className="space-y-1.5">
        <div
          role="img"
          aria-label={`24-Hour Day Balance: Sleep ${sleepHours.toFixed(1)}h (${sleepPct}%), Focus ${focusHours.toFixed(1)}h (${focusPct}%), Movement ${movementHours.toFixed(1)}h (${movePct}%), Rest ${restHours.toFixed(1)}h (${restPct}%)`}
          className="h-5 w-full rounded-xl bg-black/60 p-0.5 border border-white/10 flex overflow-hidden gap-1"
        >
          {/* Sleep Segment */}
          {sleepPct > 0 && (
            <div
              style={{ width: `${sleepPct}%` }}
              className="h-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 shadow-[0_0_10px_rgba(99,102,241,0.35)] transition-all duration-300"
              title={`Sleep: ${sleepHours.toFixed(1)}h (${sleepPct}%)`}
            />
          )}
          {/* Focus Segment */}
          {focusPct > 0 && (
            <div
              style={{ width: `${focusPct}%` }}
              className="h-full rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.35)] transition-all duration-300"
              title={`Focus: ${focusHours.toFixed(1)}h (${focusPct}%)`}
            />
          )}
          {/* Move Segment */}
          {movePct > 0 && (
            <div
              style={{ width: `${movePct}%` }}
              className="h-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.35)] transition-all duration-300"
              title={`Movement: ${movementHours.toFixed(1)}h (${movePct}%)`}
            />
          )}
          {/* Rest Segment */}
          {restPct > 0 && (
            <div
              style={{ width: `${restPct}%` }}
              className="h-full rounded-lg bg-slate-800/90 border border-white/10 transition-all duration-300"
              title={`Rest / Calibration: ${restHours.toFixed(1)}h (${restPct}%)`}
            />
          )}
        </div>
      </div>

      {/* Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <Moon className="w-3.5 h-3.5" />
            <span>Sleep</span>
          </div>
          <span className="font-bold text-white tabular-nums">
            {sleepHours.toFixed(1)}h <span className="text-[10px] text-indigo-400">({sleepPct}%)</span>
          </span>
        </div>

        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-purple-300">
            <Brain className="w-3.5 h-3.5" />
            <span>Focus</span>
          </div>
          <span className="font-bold text-white tabular-nums">
            {focusHours.toFixed(1)}h <span className="text-[10px] text-purple-400">({focusPct}%)</span>
          </span>
        </div>

        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Move</span>
          </div>
          <span className="font-bold text-white tabular-nums">
            {movementHours.toFixed(1)}h <span className="text-[10px] text-emerald-400">({movePct}%)</span>
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-800/60 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Coffee className="w-3.5 h-3.5" />
            <span>Rest</span>
          </div>
          <span className="font-bold text-white tabular-nums">
            {restHours.toFixed(1)}h <span className="text-[10px] text-slate-400">({restPct}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
