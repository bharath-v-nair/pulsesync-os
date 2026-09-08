import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Dumbbell,
  Brain,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Flame,
  Footprints,
  Activity,
  Sparkles,
  Moon,
  Sun,
  Droplets,
  BookOpen,
} from 'lucide-react';
import { WorkoutLog, FocusData, HabitsData } from '../../types';
import { getTodayDateStr } from '../../services/storage';
import { triggerHaptic } from '../../hooks/useHaptics';
import { DayBalanceRibbon } from './DayBalanceRibbon';

interface DayLedgerFeedProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  workouts: WorkoutLog[];
  focus: FocusData;
  habits: HabitsData;
  onEditWorkout: (log: WorkoutLog) => void;
  onDeleteWorkout: (id: string) => void;
  onDeleteFocusSession?: (id: string) => void;
  onOpenAddMovement: () => void;
  onOpenAddFocus: () => void;
  onOpenEditHabits: () => void;
}

export const DayLedgerFeed: React.FC<DayLedgerFeedProps> = ({
  selectedDate,
  onSelectDate,
  workouts,
  focus,
  habits,
  onEditWorkout,
  onDeleteWorkout,
  onDeleteFocusSession,
  onOpenAddMovement,
  onOpenAddFocus,
  onOpenEditHabits,
}) => {
  const todayStr = getTodayDateStr();
  const isToday = selectedDate === todayStr;

  // Format date display: e.g. "Wednesday, Sep 2, 2026"
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrevDay = () => {
    triggerHaptic(10);
    const prev = new Date(dateObj);
    prev.setDate(prev.getDate() - 1);
    const newY = prev.getFullYear();
    const newM = String(prev.getMonth() + 1).padStart(2, '0');
    const newD = String(prev.getDate()).padStart(2, '0');
    onSelectDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextDay = () => {
    if (isToday) return;
    triggerHaptic(10);
    const next = new Date(dateObj);
    next.setDate(next.getDate() + 1);
    const newY = next.getFullYear();
    const newM = String(next.getMonth() + 1).padStart(2, '0');
    const newD = String(next.getDate()).padStart(2, '0');
    onSelectDate(`${newY}-${newM}-${newD}`);
  };

  // 1. Move Logs for this date
  const dayWorkouts = workouts.filter((w) =>
    isToday ? !w.dateStr || w.dateStr === selectedDate : w.dateStr === selectedDate
  );

  const totalSteps = dayWorkouts.reduce((acc, w) => acc + (w.steps || 0), 0);
  const totalTonnage = dayWorkouts
    .filter((w) => w.category === 'barbell')
    .reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

  // 2. Focus Sessions for this date
  const dayFocusSessions = focus.sessions.filter((s) => {
    if (s.dateStr === selectedDate) return true;
    const ts = s.timestamp || s.startTimestamp;
    if (ts && !isNaN(new Date(ts).getTime())) {
      return new Date(ts).toISOString().split('T')[0] === selectedDate;
    }
    return false;
  });
  const totalFocusMins = dayFocusSessions.reduce(
    (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
    0
  );

  // 3. Habits record for this date
  const habitRecord = habits.dailyRecords?.[selectedDate];
  const hasHabitRecord = Boolean(habitRecord || isToday);
  const sleepDisplay = habitRecord?.sleepDuration || (isToday ? habits.sleep.sleepDuration : null);
  const sleepHoursDisplay = habitRecord?.sleepDurationHours ?? (isToday ? habits.sleep.sleepDurationHours : 8.0);
  const bedtimeDisplay = habitRecord?.bedtimeRaw || (isToday ? habits.sleep.bedtimeRaw : null);
  const wakeupDisplay = habitRecord?.wakeupRaw || (isToday ? habits.sleep.wakeupRaw : null);
  const sleepSessions = habitRecord?.sleepSessions || (isToday ? habits.sleep?.sessions : undefined);
  const sunlightDisplay = habitRecord?.sunlightDone ?? (isToday ? habits.sleep.sunlightDone : false);
  const hydrationDisplay = habitRecord?.hydrationMl ?? (isToday ? habits.hydration?.currentMl : 3500);
  const cleanDayStatus = habitRecord?.cleanDay ?? (isToday ? (habits.keystones?.cleanDiet && habits.keystones?.zeroDoomscroll && habits.keystones?.dailySupplements && habits.keystones?.bedMade) : null);
  const pagesReadDisplay = habitRecord?.pagesRead ?? (isToday ? habits.reading.pagesReadToday : null);

  const isDayEmpty = dayWorkouts.length === 0 && dayFocusSessions.length === 0 && !habitRecord && !isToday;

  const getWorkoutIcon = (category: string) => {
    switch (category) {
      case 'pullup':
        return <Dumbbell className="w-4 h-4 text-sky-400" />;
      case 'pushup':
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
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
    <div className="space-y-4">
      {/* Date Navigation Strip */}
      <div className="flex items-center justify-between bg-[#0e131d] border border-white/10 rounded-2xl px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center tap-target"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center gap-2">
            <input
              type="date"
              id="ledger-date-picker"
              value={selectedDate}
              max={todayStr}
              aria-label="Select ledger date"
              style={{ colorScheme: 'dark' }}
              onChange={(e) => {
                if (e.target.value) {
                  triggerHaptic(10);
                  onSelectDate(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div className="flex items-center gap-2 min-h-[44px] px-2 rounded-xl hover:bg-white/5 transition-colors pointer-events-none">
              <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-mono font-bold text-slate-200 truncate">
                {formattedDate}
              </span>
            </div>
          </div>

          {isToday ? (
            <span className="badge-pill bg-sky-500/15 text-sky-400 font-mono text-[9px] py-1 px-2.5 shrink-0 border border-sky-400/30">
              Today
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onSelectDate(todayStr);
              }}
              className="badge-pill bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[9px] py-1 px-2.5 flex items-center gap-1 hover:bg-amber-500/25 active:scale-95 transition-all min-h-[36px] shrink-0"
              title="Return to today"
              aria-label="Return to today"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Today</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          disabled={isToday}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px] min-w-[44px] flex items-center justify-center tap-target"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 24-Hour Day Balance Ribbon for Selected Date */}
      <DayBalanceRibbon
        workouts={workouts}
        focus={focus}
        habits={habits}
        selectedDate={selectedDate}
      />


      {/* Empty State when no entries on past day */}
      {isDayEmpty ? (
        <div className="matte-card p-6 text-center space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Activities Recorded</h4>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Historical ledger is clear for this date. You can add retroactive entries below.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onOpenAddMovement();
              }}
              className="spring-btn min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 tap-target"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Add Missed Movement</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onOpenAddFocus();
              }}
              className="spring-btn min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 tap-target"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Add Missed Focus</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onOpenEditHabits();
              }}
              className="spring-btn min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 tap-target"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>+ Log Habits</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SECTION 1: PHYSICAL TRAINING (MOVE) */}
          <div className="matte-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Physical Training (Move)
                </h3>
                <span className="badge-pill bg-emerald-500/15 text-emerald-300 font-mono text-[9px] py-0.5 px-2">
                  {dayWorkouts.length} {dayWorkouts.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onOpenAddMovement();
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-all min-h-[44px] tap-target"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Movement</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            {dayWorkouts.length > 0 && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-300">
                <span>Sets: <strong className="text-white tabular-nums">{dayWorkouts.length}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Cardio Steps: <strong className="text-emerald-400 tabular-nums">{totalSteps.toLocaleString()}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Tonnage: <strong className="text-amber-400 tabular-nums">{totalTonnage.toLocaleString()} kg</strong></span>
              </div>
            )}

            {/* Workouts Feed */}
            {dayWorkouts.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 italic py-2">
                No physical training sets recorded for this date.
              </p>
            ) : (
              <div className="space-y-2">
                {dayWorkouts.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-[#0a0d15] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {getWorkoutIcon(log.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{log.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {log.category === 'pullup' || log.category === 'pushup' ? (
                            `${log.reps || 0} reps`
                          ) : log.category === 'barbell' ? (
                            `${log.weightKg || 30}kg × ${log.reps || 0} reps (${(log.weightKg || 30) * (log.reps || 0)}kg tonnage)`
                          ) : log.category === 'walk' ? (
                            `${(log.steps || 0).toLocaleString()} steps • ${log.distanceKm || 0} km`
                          ) : log.category === 'machine_cardio' ? (
                            `${log.minutes || 0}m • ${(log.steps || 0).toLocaleString()} steps (tension ${log.tensionLevel || 5})`
                          ) : (
                            'Completed'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500 mr-1">
                        {log.timeFormatted || 'Logged'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          onEditWorkout(log);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center tap-target active:scale-95"
                        aria-label={`Edit ${log.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          onDeleteWorkout(log.id);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center tap-target active:scale-95"
                        aria-label={`Delete ${log.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: DEEP WORK (FOCUS) */}
          <div className="matte-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Deep Work (Focus)
                </h3>
                <span className="badge-pill bg-purple-500/15 text-purple-300 font-mono text-[9px] py-0.5 px-2 border border-purple-400/30">
                  {totalFocusMins} mins
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onOpenAddFocus();
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg transition-all min-h-[44px] tap-target"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Focus</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            {dayFocusSessions.length > 0 && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-300">
                <span>Bouts: <strong className="text-white tabular-nums">{dayFocusSessions.length}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Total Study: <strong className="text-purple-300 tabular-nums">{totalFocusMins}m</strong> ({(totalFocusMins / 60).toFixed(1)} hrs)</span>
                <span className="text-slate-600">•</span>
                <span>Target: <strong className="text-emerald-400 tabular-nums">5.5h</strong></span>
              </div>
            )}

            {/* Focus Sessions Feed */}
            {dayFocusSessions.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 italic py-2">
                No focus blocks recorded on this date.
              </p>
            ) : (
              <div className="space-y-2">
                {dayFocusSessions.map((session) => {
                  const getBucketBadge = () => {
                    switch (session.bucket) {
                      case 'deep':
                        return <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-400/30">Deep Anchor</span>;
                      case 'spaced':
                        return <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-400/30">Spaced Recall</span>;
                      case 'live':
                        return <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">Live Sprint</span>;
                      case 'dsa':
                        return <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">C# DSA</span>;
                      case 'azure':
                        return <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-400/30">Azure AI</span>;
                      default:
                        return <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">Focus</span>;
                    }
                  };

                  const timeDisplay = session.startTimeFormatted && session.endTimeFormatted
                    ? `${session.startTimeFormatted} - ${session.endTimeFormatted}`
                    : session.timestamp
                    ? new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Logged';

                  return (
                    <div
                      key={session.id}
                      className="p-2.5 rounded-xl bg-[#0a0d15] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {getBucketBadge()}
                          <span className="text-[10px] font-mono text-slate-500">{timeDisplay}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{session.taskTitle || session.subject}</p>
                        {session.notes && (
                          <p className="text-[10px] text-slate-400 truncate">{session.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="badge-pill bg-purple-500/15 text-purple-300 font-mono text-[10px] py-0.5 px-2 border border-purple-400/30 tabular-nums">
                          +{session.durationMinutes || Math.round((session.durationSeconds || 0) / 60)}m
                        </span>
                        {onDeleteFocusSession && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(15);
                              onDeleteFocusSession(session.id);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center tap-target active:scale-95"
                            aria-label={`Delete focus session ${session.taskTitle || session.subject || 'session'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: DISCIPLINE (HABITS) */}
          <div className="matte-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Discipline (Habits)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onOpenEditHabits();
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg transition-all min-h-[44px] tap-target"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Habits</span>
              </button>
            </div>

            {hasHabitRecord ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                {/* Pillar 1: Circadian Sleep */}
                <div className="p-3 rounded-xl bg-[#0a0d15] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-indigo-400 uppercase tracking-wider block">Sleep</span>
                    <Moon className="w-3 h-3 text-indigo-400" />
                  </div>
                  <span className="font-bold text-white block truncate tabular-nums text-sm">
                    {sleepDisplay || `${sleepHoursDisplay.toFixed(1)}h`}
                  </span>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                    <span className="truncate max-w-[120px]">
                      {sleepSessions && sleepSessions.length > 1
                        ? sleepSessions.map((s) => `${s.bedtimeRaw}-${s.wakeupRaw}`).join(' + ')
                        : (bedtimeDisplay && wakeupDisplay ? `${bedtimeDisplay} - ${wakeupDisplay}` : '8h Base')}
                    </span>
                    {sunlightDisplay && <span className="text-amber-400 font-semibold flex items-center gap-0.5 shrink-0 ml-1"><Sun className="w-2.5 h-2.5" /> Sun</span>}
                  </div>
                </div>

                {/* Pillar 2: Fluid Dynamics (Hydration) */}
                <div className="p-3 rounded-xl bg-[#0a0d15] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-sky-400 uppercase tracking-wider block">Hydration</span>
                    <Droplets className="w-3 h-3 text-sky-400" />
                  </div>
                  <span className="font-bold text-white block truncate tabular-nums text-sm">
                    {hydrationDisplay ? `${(hydrationDisplay / 1000).toFixed(2)}L` : '3.50L'}
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-0.5">
                    {hydrationDisplay ? `${hydrationDisplay.toLocaleString()} / 3,500ml` : '3,500ml Target'}
                  </span>
                </div>

                {/* Pillar 3: Keystone Clean Day */}
                <div className="p-3 rounded-xl bg-[#0a0d15] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-emerald-400 uppercase tracking-wider block">Clean Day</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className={`font-bold block truncate text-sm ${cleanDayStatus ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {cleanDayStatus ? '✓ Clean Day Done' : 'Incomplete'}
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-0.5">
                    {cleanDayStatus ? '4/4 Markers Met' : 'Discipline Missed'}
                  </span>
                </div>

                {/* Pillar 4: Technical Deep Reading */}
                <div className="p-3 rounded-xl bg-[#0a0d15] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-amber-400 uppercase tracking-wider block">Reading</span>
                    <BookOpen className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="font-bold text-white block truncate tabular-nums text-sm">
                    {pagesReadDisplay ?? 20} pages
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-0.5">
                    {pagesReadDisplay != null && pagesReadDisplay >= 20 ? 'Target Reached' : '20p Baseline'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-500 italic py-2">
                No habits logged for this date.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
