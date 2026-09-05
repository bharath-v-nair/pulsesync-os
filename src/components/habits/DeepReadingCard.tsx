import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Pause, ChevronRight, RotateCcw, Plus, Minus, HelpCircle } from 'lucide-react';
import { ReadingState } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface DeepReadingCardProps {
  reading: ReadingState;
  onNavigateLibrary: () => void;
  onUpdateReading: (reading: ReadingState) => void;
  onOpenProtocol?: (section: string) => void;
}

export const DeepReadingCard: React.FC<DeepReadingCardProps> = ({
  reading,
  onNavigateLibrary,
  onUpdateReading,
  onOpenProtocol,
}) => {
  const activeBook = reading.books.find((b) => b.id === reading.activeBookId) || reading.books[0];
  
  // Custom timer duration in minutes (default 20m)
  const [selectedDurationMins, setSelectedDurationMins] = useState<number>(() => {
    if (reading.timerSeconds && reading.timerSeconds > 0) {
      return Math.max(5, Math.round(reading.timerSeconds / 60));
    }
    return 20;
  });

  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    return reading.timerSeconds || 20 * 60;
  });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            triggerHaptic(40);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds]);

  const handleSelectPreset = (mins: number) => {
    triggerHaptic(10);
    setSelectedDurationMins(mins);
    setIsRunning(false);
    const secs = mins * 60;
    setTimerSeconds(secs);
    onUpdateReading({ ...reading, timerSeconds: secs, isTimerRunning: false });
  };

  const handleAdjustDuration = (deltaMins: number) => {
    triggerHaptic(10);
    const newMins = Math.max(5, Math.min(120, selectedDurationMins + deltaMins));
    setSelectedDurationMins(newMins);
    setIsRunning(false);
    const secs = newMins * 60;
    setTimerSeconds(secs);
    onUpdateReading({ ...reading, timerSeconds: secs, isTimerRunning: false });
  };

  const handleResetTimer = () => {
    triggerHaptic(15);
    setIsRunning(false);
    const secs = selectedDurationMins * 60;
    setTimerSeconds(secs);
    onUpdateReading({ ...reading, timerSeconds: secs, isTimerRunning: false });
  };

  const handleToggleTimer = () => {
    triggerHaptic(15);
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    onUpdateReading({ ...reading, timerSeconds, isTimerRunning: nextRunning });
  };

  const handleAddPages = (delta: number) => {
    triggerHaptic(15);
    const newPagesToday = Math.max(0, (reading.pagesReadToday || 0) + delta);
    let updatedBooks = reading.books;
    if (activeBook) {
      const newCurrentPage = Math.min(
        activeBook.totalPages,
        Math.max(0, activeBook.currentPage + delta)
      );
      updatedBooks = reading.books.map((b) =>
        b.id === activeBook.id
          ? { ...b, currentPage: newCurrentPage, completed: newCurrentPage >= b.totalPages }
          : b
      );
    }
    onUpdateReading({
      ...reading,
      pagesReadToday: newPagesToday,
      books: updatedBooks,
    });
  };

  const progressPercent = activeBook
    ? Math.min(100, Math.round((activeBook.currentPage / activeBook.totalPages) * 100))
    : 0;

  const timerMin = Math.floor(timerSeconds / 60);
  const timerSec = timerSeconds % 60;
  const targetPages = reading.targetPagesPerDay || 20;

  const presets = [15, 20, 30, 45];

  return (
    <div className="matte-card p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Reading</h3>
          {onOpenProtocol && (
            <button
              type="button"
              onClick={() => onOpenProtocol('reading')}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Explain Reading Protocol"
              aria-label="Reading Protocol"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onNavigateLibrary}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 min-h-[44px] px-2 tap-target"
        >
          <span>Shelf ({reading.books.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeBook ? (
        <div className="space-y-3">
          {/* Active Book Card */}
          <div className="p-3 rounded-xl bg-[#090d16] border border-white/5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-100 truncate">{activeBook.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono truncate">{activeBook.author}</p>
              </div>
              <span className="badge-pill bg-amber-500/15 text-amber-400 font-mono text-[10px] tabular-nums shrink-0">
                p. {activeBook.currentPage} / {activeBook.totalPages}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Page Steppers */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1017] border border-white/5">
            <div>
              <span className="text-xs font-mono font-bold text-white tabular-nums block">
                {reading.pagesReadToday || 0} / {targetPages} pages
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {(reading.pagesReadToday || 0) >= targetPages ? '✓ Target reached' : 'Pages read today'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddPages(-5)}
                disabled={(reading.pagesReadToday || 0) <= 0}
                className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-slate-300 flex items-center justify-center tap-target active:scale-95 transition-all text-xs font-mono font-bold"
                aria-label="Subtract 5 pages"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleAddPages(5)}
                className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 flex items-center justify-center tap-target active:scale-95 transition-all text-xs font-mono font-bold"
                aria-label="Add 5 pages"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleAddPages(10)}
                className="w-11 h-11 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35 text-amber-300 border border-amber-500/30 flex items-center justify-center tap-target active:scale-95 transition-all text-xs font-mono font-bold"
                aria-label="Add 10 pages"
              >
                +10
              </button>
            </div>
          </div>

          {/* Customizable Sprint Timer */}
          <div className="p-3 rounded-xl bg-[#090d16] border border-white/5 space-y-2.5">
            {/* Presets & Steppers Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {presets.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectPreset(mins)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all tap-target ${
                      selectedDurationMins === mins
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Adjust +/- 5m */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(-5)}
                  disabled={isRunning || selectedDurationMins <= 5}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-slate-300 text-xs tap-target"
                  title="Subtract 5 mins"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(5)}
                  disabled={isRunning || selectedDurationMins >= 120}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-slate-300 text-xs tap-target"
                  title="Add 5 mins"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 tap-target"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Countdown & Start Button */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <p className="text-xl font-bold font-mono text-white tabular-nums">
                  {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {selectedDurationMins}m Sprint Timer
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleTimer}
                className={`spring-btn min-h-[44px] py-2.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md tap-target transition-all active:scale-95 ${
                  isRunning
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isRunning ? 'Pause' : `Start ${selectedDurationMins}m`}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-400 font-mono">
          No books in catalog. Open Shelf to add a technical book.
        </div>
      )}
    </div>
  );
};
