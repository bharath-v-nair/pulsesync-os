import React, { useState } from 'react';
import { WorkoutLog, FocusSession, HabitsData } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface HourlyIntensityHeatmapProps {
  workouts: WorkoutLog[];
  focusSessions: FocusSession[];
  activeFocusSession?: FocusSession | null;
  habits: HabitsData;
  selectedDate: string;
  isToday: boolean;
}

interface HourlySlotData {
  hour: number;
  label: string;
  activeMinutes: number;
  dominantCategory: 'Sleep' | 'Focus' | 'Move' | 'Habits';
}

export const HourlyIntensityHeatmap: React.FC<HourlyIntensityHeatmapProps> = ({
  workouts,
  focusSessions,
  activeFocusSession,
  habits,
  selectedDate,
  isToday,
}) => {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const [year, month, day] = selectedDate.split('-').map(Number);

  // Calculate active minutes and dominant category per hour (00 to 23)
  const hourlyData: HourlySlotData[] = Array.from({ length: 24 }).map((_, h): HourlySlotData => {
    const hStart = new Date(year, month - 1, day, h, 0, 0, 0).getTime();
    const hEnd = new Date(year, month - 1, day, h, 59, 59, 999).getTime();

    const catMins: Record<'Sleep' | 'Focus' | 'Move' | 'Habits', number> = {
      Sleep: 0,
      Focus: 0,
      Move: 0,
      Habits: 0,
    };

    // 1. Sleep
    let wakeup = '07:15';
    if (habits.dailyRecords && habits.dailyRecords[selectedDate]?.sleepDuration) {
      wakeup = habits.dailyRecords[selectedDate].wakeupRaw || wakeup;
    } else if (isToday && habits.sleep) {
      wakeup = habits.sleep.wakeupRaw || wakeup;
    }
    const [wH, wM] = wakeup.split(':').map(Number);
    const wakeMs = new Date(year, month - 1, day, wH, wM, 0, 0).getTime();
    const sleepStartMs = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    const sleepEndMs = Math.min(hEnd, wakeMs);

    if (wakeMs > hStart && sleepStartMs < hEnd) {
      const oStart = Math.max(hStart, sleepStartMs);
      const oEnd = Math.min(hEnd, sleepEndMs);
      if (oEnd > oStart) {
        catMins.Sleep += Math.round((oEnd - oStart) / (1000 * 60));
      }
    }

    // 2. Focus
    focusSessions.forEach((s) => {
      const sStart = s.startTimestamp;
      const sEnd = s.endTimestamp || sStart + (s.durationSeconds || 0) * 1000;
      if (sEnd > hStart && sStart < hEnd) {
        const oStart = Math.max(hStart, sStart);
        const oEnd = Math.min(hEnd, sEnd);
        if (oEnd > oStart) {
          catMins.Focus += Math.round((oEnd - oStart) / (1000 * 60));
        }
      }
    });

    if (isToday && activeFocusSession) {
      const cStart = activeFocusSession.startTimestamp;
      const cEnd = Date.now();
      if (cEnd > hStart && cStart < hEnd) {
        const oStart = Math.max(hStart, cStart);
        const oEnd = Math.min(hEnd, cEnd);
        if (oEnd > oStart) {
          catMins.Focus += Math.round((oEnd - oStart) / (1000 * 60));
        }
      }
    }

    // 3. Move
    const dayWorkouts = workouts.filter((w) =>
      isToday ? !w.dateStr || w.dateStr === selectedDate : w.dateStr === selectedDate
    );
    dayWorkouts.forEach((w) => {
      const durMins = w.minutes || (w.category === 'walk' ? 45 : 10);
      const wStart = w.timestamp;
      const wEnd = wStart + durMins * 60 * 1000;
      if (wEnd > hStart && wStart < hEnd) {
        const oStart = Math.max(hStart, wStart);
        const oEnd = Math.min(hEnd, wEnd);
        if (oEnd > oStart) {
          catMins.Move += Math.round((oEnd - oStart) / (1000 * 60));
        }
      }
    });

    // 4. Habits
    if (habits.reading && isToday && habits.reading.pagesReadToday > 0 && h === 21) {
      catMins.Habits += 20;
    }

    let dominantCat: 'Sleep' | 'Focus' | 'Move' | 'Habits' = 'Focus';
    let maxMins = 0;
    let totalMins = 0;

    (Object.keys(catMins) as Array<'Sleep' | 'Focus' | 'Move' | 'Habits'>).forEach((cat) => {
      totalMins += catMins[cat];
      if (catMins[cat] > maxMins) {
        maxMins = catMins[cat];
        dominantCat = cat;
      }
    });

    totalMins = Math.min(60, totalMins);

    return {
      hour: h,
      label: String(h).padStart(2, '0'),
      activeMinutes: totalMins,
      dominantCategory: dominantCat,
    };
  });

  const getCellClass = (item: HourlySlotData) => {
    if (item.activeMinutes === 0) {
      return 'bg-[#101520]/80 border-white/5 text-slate-500';
    }

    if (item.dominantCategory === 'Sleep') {
      return item.activeMinutes >= 45
        ? 'bg-indigo-900/80 border-indigo-700/60 text-indigo-200 font-bold'
        : 'bg-indigo-950/60 border-indigo-800/40 text-indigo-300';
    }

    if (item.dominantCategory === 'Move') {
      return 'bg-emerald-900/80 border-emerald-700/60 text-emerald-200 font-bold';
    }

    if (item.dominantCategory === 'Habits') {
      return 'bg-amber-900/80 border-amber-700/60 text-amber-200 font-bold';
    }

    // Focus (Sky)
    if (item.activeMinutes >= 40) {
      return 'bg-sky-500 border-sky-400 text-slate-950 font-bold shadow-sm shadow-sky-500/20';
    }
    if (item.activeMinutes >= 20) {
      return 'bg-sky-800/80 border-sky-600/60 text-sky-100 font-semibold';
    }
    return 'bg-sky-950/70 border-sky-800/50 text-sky-300';
  };

  return (
    <section className="matte-card p-4 space-y-3 border-white/10 bg-[#0d131f] rounded-2xl relative">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-slate-300 font-mono text-[11px]">
          Hourly Intensity Heatmap
        </span>
        <span className="text-[11px] font-mono text-slate-400">Hours 00 → 23</span>
      </div>

      {tooltip && (
        <div className="text-center text-xs font-mono text-sky-300 py-0.5 animate-fadeIn">
          {tooltip}
        </div>
      )}

      {/* Dual Row Layout (12 cols per row) optimized for mobile viewports */}
      <div className="space-y-1.5 pt-1">
        {/* Row 1: 00h to 11h (Morning AM) */}
        <div className="grid grid-cols-12 gap-1 text-center font-mono">
          {hourlyData.slice(0, 12).map((item) => (
            <div
              key={item.hour}
              onClick={() => {
                triggerHaptic(5);
                setTooltip(
                  item.activeMinutes > 0
                    ? `Hour ${item.label}:00 - ${item.label}:59 · ${item.activeMinutes}m active (${item.dominantCategory})`
                    : `Hour ${item.label}:00 - ${item.label}:59 · Inactive`
                );
              }}
              onTouchStart={() => {
                triggerHaptic(5);
                setTooltip(
                  item.activeMinutes > 0
                    ? `Hour ${item.label}:00 - ${item.label}:59 · ${item.activeMinutes}m active (${item.dominantCategory})`
                    : `Hour ${item.label}:00 - ${item.label}:59 · Inactive`
                );
              }}
              onMouseEnter={() =>
                setTooltip(
                  item.activeMinutes > 0
                    ? `Hour ${item.label}:00 - ${item.label}:59 · ${item.activeMinutes}m active (${item.dominantCategory})`
                    : `Hour ${item.label}:00 - ${item.label}:59 · Inactive`
                )
              }
              onMouseLeave={() => setTooltip(null)}
              className={`h-10 rounded-lg border flex flex-col items-center justify-center text-[10px] transition cursor-pointer active:scale-95 select-none ${getCellClass(
                item
              )}`}
            >
              <span className="text-[9px] font-bold">{item.label}</span>
              {item.activeMinutes > 0 && (
                <span className="text-[7.5px] opacity-90 leading-none tabular-nums font-semibold">
                  {item.activeMinutes}m
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Row 2: 12h to 23h (Afternoon/Night PM) */}
        <div className="grid grid-cols-12 gap-1 text-center font-mono">
          {hourlyData.slice(12, 24).map((item) => (
            <div
              key={item.hour}
              onClick={() => {
                triggerHaptic(5);
                setTooltip(
                  item.activeMinutes > 0
                    ? `Hour ${item.label}:00 - ${item.label}:59 · ${item.activeMinutes}m active (${item.dominantCategory})`
                    : `Hour ${item.label}:00 - ${item.label}:59 · Inactive`
                );
              }}
              onTouchStart={() => {
                triggerHaptic(5);
                setTooltip(
                  item.activeMinutes > 0
                    ? `Hour ${item.label}:00 - ${item.label}:59 · ${item.activeMinutes}m active (${item.dominantCategory})`
                    : `Hour ${item.label}:00 - ${item.label}:59 · Inactive`
                );
              }}
              onMouseEnter={() =>
                setTooltip(
                  item.activeMinutes > 0
                    ? `Hour ${item.label}:00 - ${item.label}:59 · ${item.activeMinutes}m active (${item.dominantCategory})`
                    : `Hour ${item.label}:00 - ${item.label}:59 · Inactive`
                )
              }
              onMouseLeave={() => setTooltip(null)}
              className={`h-10 rounded-lg border flex flex-col items-center justify-center text-[10px] transition cursor-pointer active:scale-95 select-none ${getCellClass(
                item
              )}`}
            >
              <span className="text-[9px] font-bold">{item.label}</span>
              {item.activeMinutes > 0 && (
                <span className="text-[7.5px] opacity-90 leading-none tabular-nums font-semibold">
                  {item.activeMinutes}m
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
