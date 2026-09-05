import React, { useState } from 'react';
import { BarChart3, Calendar, Dumbbell, Clock, BookOpen, Moon, Activity, Shield, ArrowRight, Trash2 } from 'lucide-react';
import { WorkoutLog, FocusData, HabitsData, FocusSession } from '../../types';
import { ConsistencyHeatmap } from './ConsistencyHeatmap';
import { VolumeProgressionChart } from './VolumeProgressionChart';
import { WeeklyRebalanceCard } from './WeeklyRebalanceCard';
import { KineticBalanceCard } from './KineticBalanceCard';
import { MuscleDistributionCard } from './MuscleDistributionCard';
import { MoveAdherenceLedger } from './MoveAdherenceLedger';
import { FocusAdherenceLedger } from './FocusAdherenceLedger';
import { StudyHoursProgressionChart } from './StudyHoursProgressionChart';
import { TopicMasteryCard } from './TopicMasteryCard';
import { FocusConsistencyMatrix } from './FocusConsistencyMatrix';
import { JobApplicationFunnelCard } from './JobApplicationFunnelCard';
import { DayLedgerFeed } from './DayLedgerFeed';
import { HabitsOverviewTelemetry } from './HabitsOverviewTelemetry';
import {
  AddMissedMovementModal,
  AddMissedFocusModal,
  EditHabitsModal,
} from '../modals';
import { EditWorkoutModal } from '../move/EditWorkoutModal';
import { triggerHaptic } from '../../hooks/useHaptics';
import { applyDailyRecordUpdateWithSync } from '../../utils/habitsSync';
import { getTodayDateStr } from '../../services/storage';

export interface OverviewViewProps {
  workouts: WorkoutLog[];
  focus: FocusData;
  habits: HabitsData;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onUpdateWorkout: (updated: WorkoutLog) => void;
  onDeleteWorkout: (id: string) => void;
  onLogWorkout: (log: Omit<WorkoutLog, 'id' | 'timestamp' | 'dateStr' | 'timeFormatted'> & { dateStr?: string; timeFormatted?: string }) => void;
  onUpdateFocusData: (data: FocusData) => void;
  onUpdateHabitsData: (data: HabitsData) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  workouts,
  focus,
  habits,
  selectedDate,
  onSelectDate,
  onUpdateWorkout,
  onDeleteWorkout,
  onLogWorkout,
  onUpdateFocusData,
  onUpdateHabitsData,
}) => {
  // Sub-view toggle: 'telemetry' | 'ledger'
  const [subView, setSubView] = useState<'telemetry' | 'ledger'>('telemetry');

  // Telemetry domain filter: 'pulse' | 'move' | 'focus' | 'habits'
  const [telemetryDomain, setTelemetryDomain] = useState<'pulse' | 'move' | 'focus' | 'habits'>('pulse');

  // Timeframe state: 7 | 14 | 30 | 90 days
  const [timeframe, setTimeframe] = useState<7 | 14 | 30 | 90>(7);

  // Modals state
  const [editingWorkout, setEditingWorkout] = useState<WorkoutLog | null>(null);
  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false);
  const [isAddFocusOpen, setIsAddFocusOpen] = useState(false);
  const [isEditHabitsOpen, setIsEditHabitsOpen] = useState(false);

  // Filter workouts for active timeframe horizon
  const now = new Date();
  const horizonCutoff = new Date(now);
  horizonCutoff.setDate(now.getDate() - (timeframe - 1));
  horizonCutoff.setHours(0, 0, 0, 0);

  const horizonWorkouts = workouts.filter((w) => {
    if (!w.dateStr) return true;
    const [y, m, d] = w.dateStr.split('-').map(Number);
    const logDate = new Date(y, m - 1, d);
    return logDate >= horizonCutoff;
  });

  // Overall metric totals for selected timeframe
  const totalPullups = horizonWorkouts
    .filter((w) => w.category === 'pullup')
    .reduce((a, b) => a + (b.reps || 0), 0);

  const totalTonnage = horizonWorkouts
    .filter((w) => w.category === 'barbell')
    .reduce((a, b) => a + (b.reps || 0) * (b.weightKg || 30), 0);

  const totalCardioSteps = horizonWorkouts.reduce((acc, l) => {
    if (l.category === 'walk') {
      if (l.steps != null && l.steps > 0) return acc + l.steps;
      if (l.distanceKm != null && l.distanceKm > 0) return acc + Math.round(l.distanceKm * 1000);
      if (l.name.includes('5k')) return acc + 5000;
      return acc;
    }
    if (l.category === 'machine_cardio') {
      if (l.steps != null && l.steps > 0) return acc + l.steps;
      if (l.minutes != null && l.minutes > 0) return acc + l.minutes * 110;
      return acc;
    }
    return acc;
  }, 0);

  // Active training days in horizon
  const uniqueActiveDays = new Set(horizonWorkouts.map((w) => w.dateStr).filter(Boolean)).size;
  const activeDaysRate = Math.min(100, Math.round((uniqueActiveDays / timeframe) * 100));

  // Horizon targets (Recomp benchmarks scaled)
  const horizonMultiplier = timeframe / 7;
  const targetPullups = Math.round(100 * horizonMultiplier);
  const targetTonnage = Math.round(11100 * horizonMultiplier);
  const targetCardio = Math.round(70000 * horizonMultiplier);

  const pullupsPct = targetPullups > 0 ? Math.min(150, Math.round((totalPullups / targetPullups) * 100)) : 0;
  const tonnagePct = targetTonnage > 0 ? Math.min(150, Math.round((totalTonnage / targetTonnage) * 100)) : 0;
  const cardioPct = targetCardio > 0 ? Math.min(150, Math.round((totalCardioSteps / targetCardio) * 100)) : 0;

  const focusMins = Math.round(focus.stats.totalStudySeconds / 60);

  // Focus Horizon calculations
  const horizonFocusSessions = (focus.sessions || []).filter((s) => {
    if (!s.dateStr) return true;
    const [y, m, d] = s.dateStr.split('-').map(Number);
    const sDate = new Date(y, m - 1, d);
    return sDate >= horizonCutoff;
  });

  const horizonFocusMins = horizonFocusSessions.reduce(
    (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
    0
  );
  const horizonStudyHours = +(horizonFocusMins / 60).toFixed(1);
  const targetStudyHours = +(5.5 * timeframe).toFixed(1);
  const studyHoursPct = targetStudyHours > 0 ? Math.min(150, Math.round((horizonStudyHours / targetStudyHours) * 100)) : 0;

  // Active Focus Days & Consistency Rate
  const uniqueFocusDates = new Set(
    horizonFocusSessions
      .filter((s) => (s.durationMinutes || 0) > 0 || (s.durationSeconds || 0) > 0)
      .map((s) => s.dateStr)
      .filter(Boolean)
  );
  if ((focus.stats?.totalStudySeconds || 0) > 0) {
    uniqueFocusDates.add(selectedDate);
  }
  const activeFocusDays = uniqueFocusDates.size;
  const focusConsistencyPct = Math.min(100, Math.round((activeFocusDays / timeframe) * 100));

  const completedTasksCount = (focus.tasks || []).filter((t) => t.completed).length;
  const targetTasks = 2 * timeframe;
  const tasksPct = targetTasks > 0 ? Math.min(100, Math.round((completedTasksCount / targetTasks) * 100)) : 0;

  // Verified DSA problems solved strictly from completed tasks
  const dsaSolvedTotal = (focus.tasks || []).filter(
    (t) => t.completed && (t.bucket === 'dsa' || t.category === 'LeetCode' || t.category === 'dsa')
  ).length;
  const dsaTarget = Math.max(1, Math.round((7 / 7) * timeframe));
  const dsaPct = Math.min(100, Math.round((dsaSolvedTotal / dsaTarget) * 100));

  // Handlers for retroactive logging & deletion
  const handleDeleteFocusSession = (sessionId: string) => {
    const sessionToDelete = (focus.sessions || []).find((s) => s.id === sessionId);
    const subMins = sessionToDelete?.durationMinutes || 0;
    const updatedSessions = (focus.sessions || []).filter((s) => s.id !== sessionId);
    onUpdateFocusData({
      ...focus,
      sessions: updatedSessions,
      totalStudyMinutes: Math.max(0, (focus.totalStudyMinutes || 0) - subMins),
      todayStudyMinutes: Math.max(0, (focus.todayStudyMinutes || 0) - (sessionToDelete?.dateStr === selectedDate ? subMins : 0)),
      stats: {
        ...focus.stats,
        totalStudySeconds: Math.max(0, (focus.stats?.totalStudySeconds || 0) - subMins * 60),
      },
    });
  };

  const handleAddFocusSession = (session: {
    durationMinutes: number;
    subject: string;
    notes?: string;
    dateStr: string;
  }) => {
    const startMs = Date.parse(`${session.dateStr}T12:00:00`) || Date.now();
    const endMs = startMs + session.durationMinutes * 60 * 1000;
    const endD = new Date(endMs);
    const endTimeFormatted = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;

    const newSession: FocusSession = {
      id: `session_${Date.now()}`,
      taskId: null,
      taskTitle: session.subject,
      subject: session.subject,
      category: 'General',
      bucket: 'deep',
      dateStr: session.dateStr,
      startTimestamp: startMs,
      startTimeFormatted: '12:00',
      endTimestamp: endMs,
      endTimeFormatted,
      durationSeconds: session.durationMinutes * 60,
      durationMinutes: session.durationMinutes,
      timestamp: startMs,
      notes: session.notes,
    };

    onUpdateFocusData({
      ...focus,
      sessions: [...focus.sessions, newSession],
      stats: {
        ...focus.stats,
        totalStudySeconds: focus.stats.totalStudySeconds + session.durationMinutes * 60,
      },
    });
  };

  const handleSaveHabits = (
    dateStr: string,
    data: any
  ) => {
    const todayStr = getTodayDateStr();
    const updated = applyDailyRecordUpdateWithSync(habits, dateStr, data, todayStr);
    onUpdateHabitsData(updated);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sub-View Navigation Switcher */}
      <div
        role="tablist"
        aria-label="Overview navigation"
        className="flex items-center justify-between bg-[#0e131d] border border-white/10 p-1.5 rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          id="tab-telemetry"
          aria-selected={subView === 'telemetry'}
          aria-controls="panel-telemetry"
          onClick={() => {
            triggerHaptic(10);
            setSubView('telemetry');
          }}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all tap-target ${
            subView === 'telemetry'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <span>📊 Telemetry</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-ledger"
          aria-selected={subView === 'ledger'}
          aria-controls="panel-ledger"
          onClick={() => {
            triggerHaptic(10);
            setSubView('ledger');
          }}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all tap-target ${
            subView === 'ledger'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>📅 Day Ledger</span>
        </button>
      </div>

      {/* SUB-VIEW A: TELEMETRY HUB */}
      {subView === 'telemetry' && (
        <div
          id="panel-telemetry"
          role="tabpanel"
          aria-labelledby="tab-telemetry"
          className="space-y-4"
        >
          {/* Top Control Bar: Timeframe Horizon Selector & Domain Segmented Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-[#0e131d] border border-white/10 p-2 rounded-2xl">
              <span className="text-xs font-mono text-slate-400 pl-1 font-semibold">Timeframe Horizon</span>
              {/* Timeframe Chips */}
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Telemetry timeframe">
                {([7, 14, 30, 90] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    role="radio"
                    aria-checked={timeframe === days}
                    onClick={() => {
                      triggerHaptic(10);
                      setTimeframe(days);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all min-h-[38px] tap-target ${
                      timeframe === days
                        ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                        : 'bg-black/30 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Domain Segmented Filter */}
            <div
              role="tablist"
              aria-label="Telemetry domains"
              className="grid grid-cols-4 gap-1 bg-[#0a0d14] border border-white/10 p-1 rounded-xl"
            >
              {[
                { id: 'pulse', label: 'Pulse', icon: Activity, color: 'text-sky-400' },
                { id: 'move', label: 'Move', icon: Dumbbell, color: 'text-emerald-400' },
                { id: 'focus', label: 'Focus', icon: Clock, color: 'text-purple-400' },
                { id: 'habits', label: 'Habits', icon: Shield, color: 'text-amber-400' },
              ].map(({ id, label, icon: Icon, color }) => {
                const isSelected = telemetryDomain === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      triggerHaptic(10);
                      setTelemetryDomain(id as any);
                    }}
                    className={`min-h-[38px] py-1.5 px-1 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all tap-target ${
                      isSelected
                        ? 'bg-white/15 text-white shadow-sm border border-white/15'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DOMAIN 1: 🌐 PULSE (EXECUTIVE SYNTHESIS) */}
          {telemetryDomain === 'pulse' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Metric Highlights Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="matte-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span className="eyebrow text-[9px]">Total Sets</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-white tabular-nums">
                    {workouts.length}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {totalPullups} pull-ups • {totalTonnage.toLocaleString()}kg
                  </p>
                </div>

                <div className="matte-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="eyebrow text-[9px]">Deep Focus</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-white tabular-nums">
                    {focusMins}m
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {focus.stats.completedQuestions} concepts mastered
                  </p>
                </div>

                <div className="matte-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="eyebrow text-[9px]">Deep Reading</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-white tabular-nums">
                    {habits.reading.pagesReadToday}p
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {habits.reading.books.length} active books
                  </p>
                </div>

                <div className="matte-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Moon className="w-3.5 h-3.5" />
                    <span className="eyebrow text-[9px]">Sleep Duration</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-white tabular-nums">
                    {habits.sleep.sleepDuration}
                  </p>
                  <p className="text-[10px] text-slate-400">circadian calibrated</p>
                </div>
              </div>

              {/* Smart Weekly Rebalance Directive */}
              <WeeklyRebalanceCard workouts={workouts} />

              {/* Consistency Heatmap Matrix (Synthesizes All Engines) */}
              <ConsistencyHeatmap
                workouts={workouts}
                focus={focus}
                habits={habits}
                selectedDate={selectedDate}
                timeframe={timeframe}
                onSelectDate={(date) => {
                  onSelectDate(date);
                  setSubView('ledger');
                }}
              />

              {/* Domain Exploration Portal Cards */}
              <div className="space-y-2">
                <span className="eyebrow text-[10px] text-slate-400 pl-1 block">Dedicated Telemetry Portals</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Move Portal */}
                  <div className="p-3 rounded-xl bg-[#0c101a] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold font-mono text-white">Move Progression</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Volume tonnage, cardio steps, and Tier 1/2 overload benchmarks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setTelemetryDomain('move');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 pt-1"
                    >
                      <span>Explore Lifts & Volume</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Focus Portal */}
                  <div className="p-3 rounded-xl bg-[#0c101a] border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold font-mono text-white">Focus Stamina</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Deep work block history, DSA completion, and interview question stats.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setTelemetryDomain('focus');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 hover:text-purple-200 pt-1"
                    >
                      <span>Explore Focus Analytics</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Habits Portal */}
                  <div className="p-3 rounded-xl bg-[#0c101a] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Moon className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold font-mono text-white">Circadian & Habits</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Scrollable 24h sleep interval Gantt chart, reading pace, and clean days.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setTelemetryDomain('habits');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hover:text-amber-200 pt-1"
                    >
                      <span>Explore Sleep & Habits</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOMAIN 2: 🏋️ MOVE (PHYSICAL PROGRESSION) */}
          {telemetryDomain === 'move' && (
            <div className="space-y-4 animate-fadeIn">
              {/* High-Signal Target-Anchored Scorecards */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {/* 1. Active Training Days */}
                <div className="matte-card p-3 space-y-1.5 border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-slate-400 block">Active Days</span>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                      {activeDaysRate}% rate
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-white tabular-nums">
                    {uniqueActiveDays} <span className="text-xs text-slate-400 font-normal">/ {timeframe}d</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${activeDaysRate}%` }}
                      className="bg-slate-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 2. Half Pull-ups (Target vs Actual) */}
                <div className="matte-card p-3 space-y-1.5 border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-emerald-400 block">Half Pull-ups</span>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold tabular-nums">
                      {pullupsPct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
                    {totalPullups} <span className="text-xs text-slate-400 font-normal">/ {targetPullups}</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, pullupsPct)}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 3. Barbell Tonnage (Target vs Actual) */}
                <div className="matte-card p-3 space-y-1.5 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-amber-400 block">Barbell Tonnage</span>
                    <span className="text-[10px] font-mono text-amber-300 font-bold tabular-nums">
                      {tonnagePct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-amber-300 tabular-nums">
                    {totalTonnage.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {targetTonnage.toLocaleString()} kg</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, tonnagePct)}%` }}
                      className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 4. Cardio Steps (Target vs Actual) */}
                <div className="matte-card p-3 space-y-1.5 border-sky-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-sky-400 block">Cardio Steps</span>
                    <span className="text-[10px] font-mono text-sky-300 font-bold tabular-nums">
                      {cardioPct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-sky-300 tabular-nums">
                    {totalCardioSteps.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {targetCardio.toLocaleString()}</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, cardioPct)}%` }}
                      className="bg-gradient-to-r from-sky-500 to-blue-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Volume & Progression Chart with Touch/Mouse Scrubbing & Adaptive Bucketing */}
              <VolumeProgressionChart
                workouts={workouts}
                timeframe={timeframe}
              />

              {/* Structural Kinetic Balance Card (Eric Cressey / Dr. McGill Planar Spectrum) */}
              <KineticBalanceCard
                workouts={horizonWorkouts}
                timeframe={timeframe}
              />

              {/* Hevy / Strong Muscle Group Distribution */}
              <MuscleDistributionCard
                workouts={horizonWorkouts}
                timeframe={timeframe}
              />

              {/* Comprehensive Exercise Target Adherence & Volume Ledger */}
              <MoveAdherenceLedger
                workouts={horizonWorkouts}
                timeframe={timeframe}
              />

              {/* Embedded Weekly Rebalance Directive (Pacing Formula & Daily Prescriptions) */}
              <WeeklyRebalanceCard workouts={workouts} />
            </div>
          )}

          {/* DOMAIN 3: 🧠 FOCUS (COGNITIVE TELEMETRY) */}
          {telemetryDomain === 'focus' && (
            <div className="space-y-4 animate-fadeIn">
              {/* High-Signal Target-Anchored Scorecards Quad */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {/* 1. Focus Volume vs Target (Sky) */}
                <div className="matte-card p-3 space-y-1.5 border-sky-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-sky-400 block">Focus Volume</span>
                    <span className="text-[10px] font-mono text-sky-300 font-bold tabular-nums">
                      {studyHoursPct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-sky-300 tabular-nums">
                    {horizonStudyHours} <span className="text-xs text-slate-400 font-normal">/ {targetStudyHours} hrs</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, studyHoursPct)}%` }}
                      className="bg-gradient-to-r from-sky-500 to-blue-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 2. Active Days (Purple) */}
                <div className="matte-card p-3 space-y-1.5 border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-purple-400 block">Active Days</span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold tabular-nums">
                      {focusConsistencyPct}% rate
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-purple-300 tabular-nums">
                    {activeFocusDays} <span className="text-xs text-slate-400 font-normal">/ {timeframe}d</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, focusConsistencyPct)}%` }}
                      className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 3. Curriculum Tasks (Amber) */}
                <div className="matte-card p-3 space-y-1.5 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-amber-400 block">Curriculum Tasks</span>
                    <span className="text-[10px] font-mono text-amber-300 font-bold tabular-nums">
                      {tasksPct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-amber-300 tabular-nums">
                    {completedTasksCount} <span className="text-xs text-slate-400 font-normal">/ {targetTasks}</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${tasksPct}%` }}
                      className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 4. DSA Solved (Emerald) */}
                <div className="matte-card p-3 space-y-1.5 border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-emerald-400 block">DSA Solved</span>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold tabular-nums">
                      {dsaSolvedTotal >= dsaTarget ? 'Target Met' : 'Pacing'}
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
                    {dsaSolvedTotal} <span className="text-xs text-slate-400 font-normal">/ {dsaTarget} probs</span>
                  </p>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, dsaPct)}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Study Hours Progression Chart with Touch Scrubbing & Adaptive Bucketing */}
              <StudyHoursProgressionChart
                focus={focus}
                timeframe={timeframe}
              />

              {/* Curriculum Domain Mastery Breakdown Card (6 Pillars, Fluff-Free) */}
              <TopicMasteryCard focus={focus} timeframe={timeframe} />

              {/* Focus Adherence Ledger (Baseline vs Stretch Deliberate Practice) */}
              <FocusAdherenceLedger
                focus={focus}
                timeframe={timeframe}
              />

              {/* 7-Day Consistency Matrix */}
              <FocusConsistencyMatrix focus={focus} />

              {/* Job Application Funnel Card */}
              <JobApplicationFunnelCard jobAppsCount={focus.jobAppsCount || 0} />

              {/* Focus Activity Log / Recent Sessions Feed */}
              <div className="matte-card p-4 space-y-3 bg-[#0c101a] border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Recent Study Sessions</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {horizonFocusSessions.length} in {timeframe}D horizon
                  </span>
                </div>
                {horizonFocusSessions.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs">
                    No focus sessions recorded in this horizon. Complete a Pomodoro block in the Focus cockpit.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {horizonFocusSessions.slice(-10).reverse().map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono hover:border-white/15 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-400/20">
                              {s.bucket ? s.bucket.toUpperCase() : 'FOCUS'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {s.dateStr || new Date(s.timestamp || s.startTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {s.startTimeFormatted ? ` • ${s.startTimeFormatted}` : ''}
                            </span>
                          </div>
                          <span className="font-bold text-white block truncate">{s.subject}</span>
                          {s.notes && (
                            <span className="text-[10px] text-slate-400 block truncate">{s.notes}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-purple-300 font-bold tabular-nums">+{s.durationMinutes}m</span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(15);
                              handleDeleteFocusSession(s.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors tap-target min-h-[36px] min-w-[36px] flex items-center justify-center"
                            aria-label={`Delete session ${s.subject}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DOMAIN 4: 🛡️ HABITS (CIRCADIAN & RECOVERY) */}
          {telemetryDomain === 'habits' && (
            <HabitsOverviewTelemetry
              habits={habits}
              timeframe={timeframe}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              onSwitchToLedger={() => setSubView('ledger')}
            />
          )}
        </div>
      )}

      {/* SUB-VIEW B: DAY LEDGER (HISTORICAL AUDITOR) */}
      {subView === 'ledger' && (
        <div id="panel-ledger" role="tabpanel" aria-labelledby="tab-ledger">
          <DayLedgerFeed
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            workouts={workouts}
            focus={focus}
            habits={habits}
            onEditWorkout={(log) => setEditingWorkout(log)}
            onDeleteWorkout={onDeleteWorkout}
            onDeleteFocusSession={handleDeleteFocusSession}
            onOpenAddMovement={() => setIsAddMovementOpen(true)}
            onOpenAddFocus={() => setIsAddFocusOpen(true)}
            onOpenEditHabits={() => setIsEditHabitsOpen(true)}
          />
        </div>
      )}

      {/* Edit Workout Modal for Day Ledger */}
      <EditWorkoutModal
        isOpen={Boolean(editingWorkout)}
        log={editingWorkout}
        onClose={() => setEditingWorkout(null)}
        onSave={(updated) => {
          onUpdateWorkout(updated);
          setEditingWorkout(null);
        }}
      />

      {/* Add Missed Movement Modal */}
      <AddMissedMovementModal
        isOpen={isAddMovementOpen}
        selectedDate={selectedDate}
        onClose={() => setIsAddMovementOpen(false)}
        onLogWorkout={(log) => {
          onLogWorkout(log);
          setIsAddMovementOpen(false);
        }}
      />

      {/* Add Missed Focus Modal */}
      <AddMissedFocusModal
        isOpen={isAddFocusOpen}
        selectedDate={selectedDate}
        onClose={() => setIsAddFocusOpen(false)}
        onAddFocusSession={handleAddFocusSession}
      />

      {/* Edit Habits Modal */}
      {(() => {
        const record = habits.dailyRecords?.[selectedDate];
        return (
          <EditHabitsModal
            isOpen={isEditHabitsOpen}
            selectedDate={selectedDate}
            initialSleepDuration={record?.sleepDuration || habits.sleep.sleepDuration}
            initialSleepDurationHours={record?.sleepDurationHours ?? habits.sleep.sleepDurationHours}
            initialBedtime={record?.bedtimeRaw || habits.sleep.bedtimeRaw}
            initialWakeup={record?.wakeupRaw || habits.sleep.wakeupRaw}
            initialSunlightDone={record?.sunlightDone ?? habits.sleep.sunlightDone}
            initialHydrationMl={record?.hydrationMl ?? habits.hydration?.currentMl ?? 3500}
            initialPagesRead={record?.pagesRead ?? habits.reading.pagesReadToday}
            initialCleanDay={record?.cleanDay ?? (habits.detox.cleanDays > 0)}
            initialCleanDiet={record?.cleanDiet ?? habits.keystones?.cleanDiet ?? true}
            initialZeroDoomscroll={record?.zeroDoomscroll ?? habits.keystones?.zeroDoomscroll ?? true}
            initialDailySupplements={record?.dailySupplements ?? habits.keystones?.dailySupplements ?? true}
            initialBedMade={record?.bedMade ?? habits.keystones?.bedMade ?? true}
            onClose={() => setIsEditHabitsOpen(false)}
            onSaveHabits={handleSaveHabits}
          />
        );
      })()}
    </div>
  );
};
