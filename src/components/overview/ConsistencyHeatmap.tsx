import React from 'react';
import { WorkoutLog, FocusData, HabitsData } from '../../types';
import { getTodayDateStr } from '../../services/storage';
import { triggerHaptic } from '../../hooks/useHaptics';
import { Dumbbell, Brain, ShieldCheck } from 'lucide-react';

interface ConsistencyHeatmapProps {
  workouts: WorkoutLog[];
  focus: FocusData;
  habits: HabitsData;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  timeframe?: 7 | 14 | 30 | 90;
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({
  workouts,
  focus,
  habits,
  selectedDate,
  onSelectDate,
  timeframe = 7,
}) => {
  const todayStr = getTodayDateStr();

  // Generate days based on timeframe ending today
  const days = Array.from({ length: timeframe }).map((_, idx) => {
    const daysAgo = timeframe - 1 - idx;
    const [y, m, d] = todayStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - daysAgo);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;

    // Move Activity on this date
    const dayWorkouts = workouts.filter((w) =>
      dateStr === todayStr ? !w.dateStr || w.dateStr === dateStr : w.dateStr === dateStr
    );
    const moveCount = dayWorkouts.length;
    // Level: 0 = none, 1 = 1-2, 2 = 3-5, 3 = 6+
    const moveLevel = moveCount === 0 ? 0 : moveCount <= 2 ? 1 : moveCount <= 5 ? 2 : 3;

    // Focus Activity on this date
    const daySessions = focus.sessions.filter(
      (s) =>
        s.dateStr === dateStr ||
        new Date(s.timestamp || s.startTimestamp).toISOString().split('T')[0] === dateStr
    );
    const focusMins = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const focusLevel =
      focusMins === 0
        ? isToday && focus.stats.totalStudySeconds > 0
          ? 2
          : 0
        : focusMins <= 30
        ? 1
        : focusMins <= 60
        ? 2
        : 3;

    // Habits Activity on this date
    const dayHabit = habits.dailyRecords?.[dateStr];
    let habitLevel = 0;
    if (dayHabit) {
      if (dayHabit.cleanDay && (dayHabit.pagesRead ?? 0) > 0) habitLevel = 3;
      else if (dayHabit.cleanDay || (dayHabit.pagesRead ?? 0) > 0 || dayHabit.sleepDurationHours)
        habitLevel = 2;
      else habitLevel = 1;
    } else if (isToday) {
      if (habits.detox.cleanDays > 0 && habits.reading.pagesReadToday > 0) habitLevel = 3;
      else if (habits.detox.cleanDays > 0 || habits.reading.pagesReadToday > 0) habitLevel = 2;
      else habitLevel = 1;
    }

    return {
      dateStr,
      dayName,
      dayNumber: day,
      isToday,
      isSelected,
      moveCount,
      moveLevel,
      focusMins,
      focusLevel,
      habitLevel,
    };
  });

  const getDotStyle = (engine: 'move' | 'focus' | 'habit', level: number) => {
    if (level === 0) return 'bg-white/5 border border-white/10 hover:border-white/20';
    if (engine === 'move') {
      if (level === 1) return 'bg-emerald-500/35 border border-emerald-500/50';
      if (level === 2) return 'bg-emerald-500/70 border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]';
      return 'bg-emerald-400 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.7)]';
    }
    if (engine === 'focus') {
      if (level === 1) return 'bg-purple-500/35 border border-purple-500/50';
      if (level === 2) return 'bg-purple-500/70 border border-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.35)]';
      return 'bg-purple-400 border border-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.7)]';
    }
    // habit
    if (level === 1) return 'bg-amber-500/35 border border-amber-500/50';
    if (level === 2) return 'bg-amber-500/70 border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.35)]';
    return 'bg-amber-400 border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.7)]';
  };

  const isScrollable = timeframe > 7;

  return (
    <div className="matte-card p-4 space-y-3.5 border-white/10 bg-[#0e131d] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {timeframe}-Day Consistency Matrix
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {isScrollable ? 'Swipe ↔ & tap to inspect' : 'Tap day to inspect'}
        </span>
      </div>

      {/* Heatmap Layout: Fixed Left Labels + Horizontally Scrollable Days */}
      <div className="flex gap-2 items-start">
        {/* Fixed Left Engine Labels */}
        <div className="w-14 shrink-0 flex flex-col gap-1.5 sm:gap-2">
          {/* Day Label Header matching Day buttons height */}
          <div className="py-1.5 flex flex-col items-center justify-center text-[10px] font-mono font-bold text-slate-500">
            <span className="leading-none">DAY</span>
            <span className="text-[9px] opacity-0 mt-0.5 leading-none">00</span>
          </div>

          {/* Move Label */}
          <div className="h-7 sm:h-8 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400">
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span>Move</span>
          </div>

          {/* Focus Label */}
          <div className="h-7 sm:h-8 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-purple-400">
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span>Focus</span>
          </div>

          {/* Habit Label */}
          <div className="h-7 sm:h-8 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Habit</span>
          </div>
        </div>

        {/* Days Grid Container (Scrollable for 14D & 30D, full width for 7D) */}
        <div className={`flex-1 min-w-0 ${isScrollable ? 'overflow-x-auto pb-1.5 scrollbar-none' : ''}`}>
          <div
            className="grid gap-1.5 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${timeframe}, minmax(${isScrollable ? '38px' : '0'}, 1fr))`,
              minWidth: isScrollable ? `${timeframe * 42}px` : '100%',
            }}
          >
            {/* Row 1: Day Names & Numbers */}
            {days.map((d) => (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onSelectDate(d.dateStr);
                }}
                aria-label={`Select ${d.dayName} ${d.dayNumber}`}
                className={`flex flex-col items-center py-1.5 rounded-lg transition-all active:scale-95 ${
                  d.isSelected
                    ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-400/40'
                    : d.isToday
                    ? 'text-sky-400 font-semibold bg-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono leading-none">{d.dayName}</span>
                <span className="text-[9px] font-mono opacity-80 mt-0.5 leading-none">{d.dayNumber}</span>
              </button>
            ))}

            {/* Row 2: Move */}
            {days.map((d) => (
              <button
                key={`move-${d.dateStr}`}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onSelectDate(d.dateStr);
                }}
                title={`${d.dateStr}: ${d.moveCount} workouts`}
                aria-label={`${d.dateStr} Move: ${d.moveCount} workouts`}
                className={`h-7 sm:h-8 w-full rounded-lg transition-all flex items-center justify-center active:scale-95 ${getDotStyle(
                  'move',
                  d.moveLevel
                )} ${d.isSelected ? 'ring-2 ring-sky-400/90 shadow-md' : ''}`}
              />
            ))}

            {/* Row 3: Focus */}
            {days.map((d) => (
              <button
                key={`focus-${d.dateStr}`}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onSelectDate(d.dateStr);
                }}
                title={`${d.dateStr}: ${d.focusMins} mins deep focus`}
                aria-label={`${d.dateStr} Focus: ${d.focusMins} mins deep focus`}
                className={`h-7 sm:h-8 w-full rounded-lg transition-all flex items-center justify-center active:scale-95 ${getDotStyle(
                  'focus',
                  d.focusLevel
                )} ${d.isSelected ? 'ring-2 ring-sky-400/90 shadow-md' : ''}`}
              />
            ))}

            {/* Row 4: Habit */}
            {days.map((d) => (
              <button
                key={`habit-${d.dateStr}`}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onSelectDate(d.dateStr);
                }}
                title={`${d.dateStr}: Discipline Calibration`}
                aria-label={`${d.dateStr} Habit: Discipline Calibration`}
                className={`h-7 sm:h-8 w-full rounded-lg transition-all flex items-center justify-center active:scale-95 ${getDotStyle(
                  'habit',
                  d.habitLevel
                )} ${d.isSelected ? 'ring-2 ring-sky-400/90 shadow-md' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5 pt-2">
        <div className="flex items-center gap-2.5">
          <span>Engines:</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Move</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Focus</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Habit</span>
          </div>
        </div>

        <span className="text-slate-500 font-medium">Active Glow = Complete</span>
      </div>
    </div>
  );
};
