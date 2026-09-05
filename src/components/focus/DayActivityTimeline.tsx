import React, { useState } from 'react';
import { WorkoutLog, FocusSession, HabitsData } from '../../types';

interface DayActivityTimelineProps {
  workouts: WorkoutLog[];
  focusSessions: FocusSession[];
  activeFocusSession?: FocusSession | null;
  habits: HabitsData;
  selectedDate: string;
  isToday: boolean;
}

interface TimelineInterval {
  track: 'Sleep' | 'Focus' | 'Move' | 'Habits';
  label: string;
  startMinutes: number; // 0 to 1440
  endMinutes: number;   // 0 to 1440
  color: string;
}

export const DayActivityTimeline: React.FC<DayActivityTimelineProps> = ({
  workouts,
  focusSessions,
  activeFocusSession,
  habits,
  selectedDate,
  isToday,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    text: string;
    subtext: string;
    color: string;
  } | null>(null);

  // Parse [year, month, day]
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

  const intervals: TimelineInterval[] = [];

  // 1. SLEEP TRACK
  let bedtime = '23:15';
  let wakeup = '07:15';
  if (habits.dailyRecords && habits.dailyRecords[selectedDate]?.sleepDuration) {
    bedtime = habits.dailyRecords[selectedDate].bedtimeRaw || bedtime;
    wakeup = habits.dailyRecords[selectedDate].wakeupRaw || wakeup;
  } else if (isToday && habits.sleep) {
    bedtime = habits.sleep.bedtimeRaw || bedtime;
    wakeup = habits.sleep.wakeupRaw || wakeup;
  }

  // Calculate morning sleep (from 00:00 to wakeup)
  const [wH, wM] = wakeup.split(':').map(Number);
  const wakeMinutes = wH * 60 + wM;
  if (wakeMinutes > 0) {
    intervals.push({
      track: 'Sleep',
      label: `Sleep & Recovery (${(wakeMinutes / 60).toFixed(1)}h)`,
      startMinutes: 0,
      endMinutes: Math.min(1440, wakeMinutes),
      color: '#818cf8',
    });
  }

  // 2. FOCUS TRACK
  focusSessions.forEach((sess) => {
    const sStart = Math.max(dayStart, sess.startTimestamp);
    const sEnd = Math.min(
      dayEnd,
      sess.endTimestamp || sess.startTimestamp + (sess.durationSeconds || 0) * 1000
    );
    if (sEnd > sStart) {
      const startMin = Math.round((sStart - dayStart) / (1000 * 60));
      const endMin = Math.round((sEnd - dayStart) / (1000 * 60));
      intervals.push({
        track: 'Focus',
        label: `${sess.taskTitle} (${Math.round((sess.durationSeconds || 0) / 60)}m)`,
        startMinutes: Math.min(1440, Math.max(0, startMin)),
        endMinutes: Math.min(1440, Math.max(startMin + 5, endMin)),
        color: '#38bdf8',
      });
    }
  });

  // Active Focus Session right now
  if (isToday && activeFocusSession) {
    const cStart = Math.max(dayStart, activeFocusSession.startTimestamp);
    const cEnd = Math.min(dayEnd, Date.now());
    if (cEnd > cStart) {
      const startMin = Math.round((cStart - dayStart) / (1000 * 60));
      const endMin = Math.round((cEnd - dayStart) / (1000 * 60));
      intervals.push({
        track: 'Focus',
        label: `${activeFocusSession.taskTitle} (In Progress)`,
        startMinutes: Math.min(1440, Math.max(0, startMin)),
        endMinutes: Math.min(1440, Math.max(startMin + 5, endMin)),
        color: '#0284c7',
      });
    }
  }

  // 3. MOVE TRACK
  const dayWorkouts = workouts.filter((w) =>
    isToday ? !w.dateStr || w.dateStr === selectedDate : w.dateStr === selectedDate
  );

  dayWorkouts.forEach((w) => {
    const mStart = Math.max(dayStart, w.timestamp);
    const durMins = w.minutes || (w.category === 'walk' ? 45 : 10);
    const mEnd = Math.min(dayEnd, mStart + durMins * 60 * 1000);
    const startMin = Math.round((mStart - dayStart) / (1000 * 60));
    const endMin = Math.round((mEnd - dayStart) / (1000 * 60));
    intervals.push({
      track: 'Move',
      label: `${w.name} (${durMins}m)`,
      startMinutes: Math.min(1440, Math.max(0, startMin)),
      endMinutes: Math.min(1440, Math.max(startMin + 8, endMin)),
      color: '#34d399',
    });
  });

  // 4. HABITS TRACK (e.g. Reading, Sunlight)
  if (habits.reading && isToday && habits.reading.pagesReadToday > 0) {
    // Standard reading anchor in evening (21:30 - 21:50)
    intervals.push({
      track: 'Habits',
      label: `Deep Reading (${habits.reading.pagesReadToday} pages)`,
      startMinutes: 21 * 60 + 30,
      endMinutes: 21 * 60 + 50,
      color: '#fbbf24',
    });
  }

  const tracks: Array<{ id: 'Sleep' | 'Focus' | 'Move' | 'Habits'; label: string; color: string }> = [
    { id: 'Sleep', label: 'Sleep', color: '#818cf8' },
    { id: 'Focus', label: 'Focus', color: '#38bdf8' },
    { id: 'Move', label: 'Move', color: '#34d399' },
    { id: 'Habits', label: 'Habits', color: '#fbbf24' },
  ];

  const timeTicks = [
    { label: '00:00', min: 0 },
    { label: '06:00', min: 360 },
    { label: '12:00', min: 720 },
    { label: '18:00', min: 1080 },
    { label: '24:00', min: 1440 },
  ];

  return (
    <section className="matte-card p-4 space-y-3 border-white/10 bg-[#0d131f] rounded-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow text-slate-300 font-mono text-[11px] block">
            24-Hour Day Activity Timeline
          </span>
          <p className="text-xs text-slate-400 font-mono">
            Sleep · Focus · Move · Habits Multi-Track Chronology
          </p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {selectedDate}
        </span>
      </div>

      {/* Floating Active Tooltip Badge */}
      {activeTooltip && (
        <div
          className="px-2.5 py-1 rounded-lg bg-black/90 border border-white/20 text-xs font-mono text-white shadow-xl pointer-events-none transition-all duration-150 animate-fadeIn"
          style={{
            borderColor: activeTooltip.color,
          }}
        >
          <span className="font-bold">{activeTooltip.text}</span>
          <span className="text-slate-400 ml-2 text-[10px]">{activeTooltip.subtext}</span>
        </div>
      )}

      {/* 4-Track Visualization */}
      <div className="space-y-2 pt-1">
        {tracks.map((trk) => {
          const trackIntervals = intervals.filter((iv) => iv.track === trk.id);

          return (
            <div key={trk.id} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-12 text-right text-[11px] font-semibold text-slate-400 shrink-0">
                {trk.label}
              </span>
              <div className="flex-1 h-6 rounded-lg bg-black/40 border border-white/5 relative overflow-hidden">
                {trackIntervals.map((iv, idx) => {
                  const leftPct = (iv.startMinutes / 1440) * 100;
                  const widthPct = Math.max(1.2, ((iv.endMinutes - iv.startMinutes) / 1440) * 100);

                  const showTooltip = () => {
                    setActiveTooltip({
                      x: leftPct + widthPct / 2,
                      text: iv.label,
                      subtext: `${Math.floor(iv.startMinutes / 60)}:${String(iv.startMinutes % 60).padStart(2, '0')} → ${Math.floor(iv.endMinutes / 60)}:${String(iv.endMinutes % 60).padStart(2, '0')}`,
                      color: iv.color,
                    });
                  };

                  return (
                    <div
                      key={idx}
                      onClick={showTooltip}
                      onTouchStart={showTooltip}
                      onMouseEnter={showTooltip}
                      onMouseLeave={() => setActiveTooltip(null)}
                      className="absolute top-1 bottom-1 rounded-md transition-all cursor-pointer hover:brightness-125 shadow-sm active:scale-95"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: iv.color,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* X-Axis Time Ticks */}
        <div className="flex justify-between pl-14 pr-1 text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
          {timeTicks.map((tick) => (
            <span key={tick.label}>{tick.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
