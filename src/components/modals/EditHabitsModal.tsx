import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, Moon, Sun, Droplets, BookOpen } from 'lucide-react';
import { DailyHabitRecord } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

export interface EditHabitsModalProps {
  isOpen: boolean;
  selectedDate: string;
  initialSleepDuration?: string;
  initialSleepDurationHours?: number;
  initialBedtime?: string;
  initialWakeup?: string;
  initialSunlightDone?: boolean;
  initialHydrationMl?: number;
  initialPagesRead?: number;
  initialCleanDay?: boolean;
  initialCleanDiet?: boolean;
  initialZeroDoomscroll?: boolean;
  initialDailySupplements?: boolean;
  initialBedMade?: boolean;
  onClose: () => void;
  onSaveHabits: (dateStr: string, data: Partial<DailyHabitRecord>) => void;
}

export const EditHabitsModal: React.FC<EditHabitsModalProps> = ({
  isOpen,
  selectedDate,
  initialSleepDuration = '8h 00m',
  initialBedtime = '23:15',
  initialWakeup = '07:15',
  initialSunlightDone = false,
  initialHydrationMl = 3500,
  initialPagesRead = 20,
  initialCleanDiet = true,
  initialZeroDoomscroll = true,
  initialDailySupplements = true,
  initialBedMade = true,
  onClose,
  onSaveHabits,
}) => {
  const [bedtime, setBedtime] = useState(initialBedtime);
  const [wakeup, setWakeup] = useState(initialWakeup);
  const [sleepDuration, setSleepDuration] = useState(initialSleepDuration);
  const [sunlightDone, setSunlightDone] = useState(initialSunlightDone);
  const [hydrationMl, setHydrationMl] = useState<number | ''>(initialHydrationMl);
  const [pagesRead, setPagesRead] = useState<number | ''>(initialPagesRead);
  const [cleanDiet, setCleanDiet] = useState(initialCleanDiet);
  const [zeroDoomscroll, setZeroDoomscroll] = useState(initialZeroDoomscroll);
  const [dailySupplements, setDailySupplements] = useState(initialDailySupplements);
  const [bedMade, setBedMade] = useState(initialBedMade);

  useEffect(() => {
    if (isOpen) {
      setBedtime(initialBedtime);
      setWakeup(initialWakeup);
      setSleepDuration(initialSleepDuration);
      setSunlightDone(initialSunlightDone);
      setHydrationMl(initialHydrationMl);
      setPagesRead(initialPagesRead);
      setCleanDiet(initialCleanDiet);
      setZeroDoomscroll(initialZeroDoomscroll);
      setDailySupplements(initialDailySupplements);
      setBedMade(initialBedMade);
    }
  }, [
    isOpen,
    initialBedtime,
    initialWakeup,
    initialSleepDuration,
    initialSunlightDone,
    initialHydrationMl,
    initialPagesRead,
    initialCleanDiet,
    initialZeroDoomscroll,
    initialDailySupplements,
    initialBedMade,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCleanDayActive = cleanDiet && zeroDoomscroll && dailySupplements && bedMade;

  const handleBedtimeChange = (newBedtime: string) => {
    setBedtime(newBedtime);
    const [bH, bM] = newBedtime.split(':').map(Number);
    const [wH, wM] = wakeup.split(':').map(Number);
    const bMins = (bH || 0) * 60 + (bM || 0);
    const wMins = (wH || 0) * 60 + (wM || 0);
    const diff = wMins >= bMins ? wMins - bMins : (1440 - bMins) + wMins;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    setSleepDuration(`${h}h ${String(m).padStart(2, '0')}m`);
  };

  const handleWakeupChange = (newWakeup: string) => {
    setWakeup(newWakeup);
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = newWakeup.split(':').map(Number);
    const bMins = (bH || 0) * 60 + (bM || 0);
    const wMins = (wH || 0) * 60 + (wM || 0);
    const diff = wMins >= bMins ? wMins - bMins : (1440 - bMins) + wMins;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    setSleepDuration(`${h}h ${String(m).padStart(2, '0')}m`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(20);

    let sleepHours = 8.0;
    const match = sleepDuration.match(/(\d+)h\s*(\d*)m?/);
    if (match) {
      const h = parseInt(match[1], 10) || 0;
      const m = parseInt(match[2], 10) || 0;
      sleepHours = Math.round((h + m / 60) * 100) / 100;
    } else {
      const parsedFloat = parseFloat(sleepDuration);
      if (!isNaN(parsedFloat)) sleepHours = parsedFloat;
    }

    const currentHydration = typeof hydrationMl === 'number' ? Math.max(0, hydrationMl) : 3500;

    onSaveHabits(selectedDate, {
      sleepDuration: sleepDuration || '8h 00m',
      sleepDurationHours: sleepHours,
      bedtimeRaw: bedtime,
      wakeupRaw: wakeup,
      sunlightDone,
      hydrationMl: currentHydration,
      hydrationCurrentMl: currentHydration,
      hydrationTargetMl: 3500,
      cleanDay: isCleanDayActive,
      cleanDiet,
      zeroDoomscroll,
      dailySupplements,
      bedMade,
      pagesRead: typeof pagesRead === 'number' ? Math.max(0, pagesRead) : 0,
      readingMinutes: 20,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-md bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-edit-habits"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 sticky top-0 bg-[#0e131e] z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 id="title-edit-habits" className="text-sm font-bold text-white">Edit Habits & Discipline</h3>
              <p className="text-[11px] text-slate-400 font-mono">Date: {selectedDate}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close habits modal"
            className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 tap-target transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Circadian Sleep & Recovery */}
          <div className="space-y-2.5 p-3 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 font-mono">
                <Moon className="w-3.5 h-3.5" />
                <span>Sleep & Recovery</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {sleepDuration}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Bedtime</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => handleBedtimeChange(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Wakeup</label>
                <input
                  type="time"
                  value={wakeup}
                  onChange={(e) => handleWakeupChange(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSunlightDone(!sunlightDone)}
              className={`w-full min-h-[40px] px-3 py-2 rounded-lg border flex items-center justify-between text-xs font-mono transition-all tap-target ${
                sunlightDone
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5" />
                <span>10m Morning Sunlight Anchor</span>
              </div>
              <span>{sunlightDone ? '✓ Met' : 'Missed'}</span>
            </button>
          </div>

          {/* Section 2: Fluid Dynamics (Hydration) */}
          <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 font-mono">
                <Droplets className="w-3.5 h-3.5" />
                <span>Hydration (ml)</span>
              </div>
              <span className="text-[10px] font-mono text-sky-400">3,500ml Target</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="50"
                value={hydrationMl}
                onChange={(e) => setHydrationMl(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="flex-1 h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
                placeholder="e.g. 3500"
              />
              <button
                type="button"
                onClick={() => setHydrationMl((prev) => (typeof prev === 'number' ? prev + 700 : 700))}
                className="px-3 h-10 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-mono font-bold tap-target"
                title="Add 1 full 700ml bottle"
              >
                +700ml
              </button>
              <button
                type="button"
                onClick={() => setHydrationMl((prev) => (typeof prev === 'number' ? prev + 350 : 350))}
                className="px-3 h-10 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-mono font-bold tap-target"
                title="Add half bottle (350ml)"
              >
                +350ml
              </button>
            </div>
          </div>

          {/* Section 3: Keystone Discipline & Clean Day */}
          <div className="space-y-2.5 p-3 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Keystone Discipline</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isCleanDayActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {isCleanDayActive ? '✓ Clean Day' : 'Incomplete'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer tap-target">
                <input
                  type="checkbox"
                  checked={cleanDiet}
                  onChange={(e) => setCleanDiet(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-black/60 border-white/20"
                />
                <span className="text-slate-300 text-[11px]">Clean Diet</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer tap-target">
                <input
                  type="checkbox"
                  checked={zeroDoomscroll}
                  onChange={(e) => setZeroDoomscroll(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-black/60 border-white/20"
                />
                <span className="text-slate-300 text-[11px]">Zero Reels</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer tap-target">
                <input
                  type="checkbox"
                  checked={dailySupplements}
                  onChange={(e) => setDailySupplements(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-black/60 border-white/20"
                />
                <span className="text-slate-300 text-[11px]">Supplements</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer tap-target">
                <input
                  type="checkbox"
                  checked={bedMade}
                  onChange={(e) => setBedMade(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-black/60 border-white/20"
                />
                <span className="text-slate-300 text-[11px]">Bed Made</span>
              </label>
            </div>
          </div>

          {/* Section 4: Deep Reading */}
          <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Deep Reading (Pages)</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400">20p Target</span>
            </div>

            <input
              type="number"
              min="0"
              max="500"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
              placeholder="e.g. 20"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 text-xs font-semibold tap-target transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] spring-btn py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-400/20 tap-target transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Habits</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
