import React from 'react';
import { Play, Pause, RotateCcw, Check, Zap, X, Clock, AlertTriangle } from 'lucide-react';
import { FocusTask, FocusTimerState } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import { playClickAudio } from '../../utils/audio';

interface FeynmanTimerCardProps {
  timerState: FocusTimerState;
  boundTask: FocusTask | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelectPreset: (preset: '50m' | '30m' | '60m') => void;
  onUnbindTask: () => void;
  onCompleteActiveTask: () => void;
}

export const FeynmanTimerCard: React.FC<FeynmanTimerCardProps> = ({
  timerState,
  boundTask,
  onStart,
  onPause,
  onReset,
  onSelectPreset,
  onUnbindTask,
  onCompleteActiveTask,
}) => {
  const { isRunning, preset, remainingSeconds, totalSeconds, warningTriggered } = timerState;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;

  const getSubLabel = () => {
    if (boundTask?.id === 'AZURE_AI_PRACTICE') return '45m Pomodoro Deliberate Practice · Azure Track';
    if (preset === '50m') return '50m Hard Stop · 15m Early Answer Warning';
    if (preset === '30m') return '30m Rapid Verbal Checks · 6m each';
    return '60m Hands-on Build · 25m Lookup Rule';
  };

  return (
    <section id="feynman-timer-card" className="matte-card p-5 space-y-4 border-white/10 bg-[#0d131f] scroll-mt-6">
      {/* Top Header & Presets */}
      <div className="flex items-center justify-between">
        <span className="eyebrow text-slate-300 font-mono text-[11px]">
          Feynman Focus Timer
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {(['50m', '30m', '60m'] as const).map((p) => {
            const isSelected = preset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  playClickAudio(500);
                  onSelectPreset(p);
                }}
                className={`px-3 py-1.5 rounded-xl transition tap-target min-h-[44px] min-w-[44px] flex items-center justify-center font-bold ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Numeric Timer Display */}
      <div className="text-center py-2 relative">
        <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-white select-none tabular-nums drop-shadow-md">
          {formattedTime}
        </div>
        <div className="text-xs font-mono text-slate-400 mt-2 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{getSubLabel()}</span>
        </div>

        {/* Minimalist progress line */}
        <div className="w-full max-w-xs mx-auto mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-sky-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 15m Early Answer Warning Banner */}
        {warningTriggered && isRunning && (
          <div className="mt-3 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Feynman Warning: Out loud explanation ceiling reached! Wrap up.</span>
          </div>
        )}
      </div>

      {/* Bound Task Indicator */}
      <div className="p-3 rounded-xl bg-[#090d15] border border-white/5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-mono text-slate-400 shrink-0">Bound:</span>
          <span className="font-bold text-white truncate">
            {boundTask ? boundTask.title : '⚡ Select a question below to focus'}
          </span>
          {boundTask && boundTask.id !== 'AZURE_AI_PRACTICE' && (boundTask.activeSeconds ?? 0) > 0 && (
            <span className="text-[10px] font-mono font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/40 px-1.5 py-0.5 rounded shrink-0">
              ⏱️ {Math.max(1, Math.round((boundTask.activeSeconds || 0) / 60))}m logged
            </span>
          )}
        </div>
        {boundTask && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onUnbindTask();
            }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 font-mono px-2 py-1 rounded hover:bg-white/5 tap-target min-h-[44px] min-w-[44px] justify-center shrink-0"
            aria-label="Unbind active task"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Timer Controls: 2-Column Hero Layout */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(15);
            playClickAudio(isRunning ? 480 : 650);
            if (isRunning) onPause();
            else onStart();
          }}
          className={`col-span-2 spring-btn py-3 px-4 rounded-xl text-xs font-black tracking-wider uppercase min-h-[48px] flex items-center justify-center gap-2 tap-target transition-all ${
            isRunning
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
              : 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-lg shadow-sky-500/25 active:scale-95'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-slate-950 text-slate-950 stroke-none" />
              <span className="text-slate-950 font-black">PAUSE SESSION</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 text-slate-950 stroke-none" />
              <span className="text-slate-950 font-black">START FOCUS</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            playClickAudio(400);
            onReset();
          }}
          className="spring-btn py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold tracking-wider uppercase min-h-[48px] flex items-center justify-center gap-1.5 text-slate-300 hover:text-white border border-white/10 active:scale-95 tap-target"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET</span>
        </button>
      </div>

      {/* Quick Complete / Save Button when task is bound */}
      {boundTask && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            onCompleteActiveTask();
          }}
          className={`spring-btn w-full py-3 rounded-xl text-white text-xs font-bold tracking-wide shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] tap-target active:scale-95 animate-fadeIn ${
            boundTask.id === 'AZURE_AI_PRACTICE'
              ? 'bg-sky-600 hover:bg-sky-500'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>
            {boundTask.id === 'AZURE_AI_PRACTICE'
              ? 'Save & Finish Azure Practice'
              : 'Mark Active Question Completed'}
          </span>
        </button>
      )}
    </section>
  );
};
