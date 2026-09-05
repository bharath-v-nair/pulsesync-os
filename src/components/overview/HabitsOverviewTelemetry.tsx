import React from 'react';
import { Moon, ShieldCheck, Droplets, BookOpen, AlertCircle } from 'lucide-react';
import { HabitsData } from '../../types';
import { SleepTelemetryChart } from './SleepTelemetryChart';
import { HabitConsistencyMatrix } from './HabitConsistencyMatrix';
import { HabitsAdherenceLedger } from './HabitsAdherenceLedger';
import { computeHabitsScorecards } from '../../utils/habitsMath';
import { getTodayDateStr } from '../../services/storage';

interface HabitsOverviewTelemetryProps {
  habits: HabitsData;
  timeframe: 7 | 14 | 30 | 90;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSwitchToLedger: () => void;
}

export const HabitsOverviewTelemetry: React.FC<HabitsOverviewTelemetryProps> = ({
  habits,
  timeframe,
  selectedDate,
  onSelectDate,
  onSwitchToLedger,
}) => {
  const referenceDate = selectedDate || getTodayDateStr();
  const quad = computeHabitsScorecards(
    habits.dailyRecords,
    timeframe,
    referenceDate
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Target-Anchored Scorecards Quad (Dynamic Horizon Scaling) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Card 1: Circadian Sleep Recovery */}
        <div className="matte-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[9px] text-indigo-400 block">Sleep Recovery</span>
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {quad.sleep.actual.toFixed(1)}
            <span className="text-xs text-slate-400 font-normal"> / {quad.sleep.target}h</span>
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            {quad.sleep.debt > 0 ? (
              <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" />
                {quad.sleep.debt.toFixed(1)}h debt
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">Calibrated</span>
            )}
            <span className="text-slate-500">{quad.sleep.pct}% pace</span>
          </div>
        </div>

        {/* Card 2: Keystone Clean Days */}
        <div className="matte-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[9px] text-emerald-400 block">Clean Days</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {quad.cleanDays.actual}
            <span className="text-xs text-slate-400 font-normal"> / {quad.cleanDays.target}d</span>
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-emerald-400 font-semibold">{quad.cleanDays.pct}% rate</span>
            <span className="text-slate-500">{habits.detox.cleanDays}d streak</span>
          </div>
        </div>

        {/* Card 3: Fluid Dynamics (Hydration) */}
        <div className="matte-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[9px] text-sky-400 block">Hydration</span>
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {quad.hydration.actual.toFixed(1)}
            <span className="text-xs text-slate-400 font-normal"> / {quad.hydration.target.toFixed(1)}L</span>
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-sky-400 font-semibold">{quad.hydration.pct}% target</span>
            <span className="text-slate-500">3.5L/d base</span>
          </div>
        </div>

        {/* Card 4: Technical Deep Reading */}
        <div className="matte-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[9px] text-amber-400 block">Deep Reading</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white tabular-nums">
            {quad.reading.actual}
            <span className="text-xs text-slate-400 font-normal"> / {quad.reading.target}p</span>
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-amber-400 font-semibold">{quad.reading.pct}% target</span>
            <span className="text-slate-500">20p/d base</span>
          </div>
        </div>
      </div>

      {/* Horizontally Scrollable Circadian Sleep Interval Chart */}
      <SleepTelemetryChart
        habits={habits}
        timeframe={timeframe}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          onSelectDate(date);
          onSwitchToLedger();
        }}
      />

      {/* 7-Day Habit Consistency Matrix */}
      <HabitConsistencyMatrix
        habits={habits}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          onSelectDate(date);
          onSwitchToLedger();
        }}
      />

      {/* Habits Adherence Ledger */}
      <HabitsAdherenceLedger
        habits={habits}
        timeframe={timeframe}
        selectedDate={selectedDate}
      />
    </div>
  );
};
