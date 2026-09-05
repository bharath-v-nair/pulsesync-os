import React from 'react';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { CURRICULUM_DAYS } from '../../data/focusData';
import { triggerHaptic } from '../../hooks/useHaptics';

interface CurriculumDayBannerProps {
  currentDay: number;
  onSelectDay: (day: number) => void;
  onOpenPicker: () => void;
}

export const CurriculumDayBanner: React.FC<CurriculumDayBannerProps> = ({
  currentDay,
  onSelectDay,
  onOpenPicker,
}) => {
  const currentConfig =
    CURRICULUM_DAYS.find((d) => d.day === currentDay) || CURRICULUM_DAYS[0];

  const handlePrev = () => {
    if (currentDay > 1) {
      triggerHaptic(10);
      onSelectDay(currentDay - 1);
    }
  };

  const handleNext = () => {
    if (currentDay < CURRICULUM_DAYS.length) {
      triggerHaptic(10);
      onSelectDay(currentDay + 1);
    }
  };

  return (
    <section className="matte-card p-3 flex items-center justify-between border-white/10 bg-[#0d131f]">
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentDay <= 1}
        className={`spring-btn p-2.5 rounded-xl tap-target min-h-[44px] min-w-[44px] flex items-center justify-center transition ${
          currentDay <= 1
            ? 'text-slate-600 opacity-40 cursor-not-allowed'
            : 'text-slate-400 hover:text-white active:scale-95'
        }`}
        aria-label="Previous Curriculum Day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="text-center px-2 min-w-0 flex-1">
        <div className="text-sm font-bold text-white tracking-wide truncate">
          {currentConfig.title}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs">
          <span className="text-slate-400 truncate">
            Tomorrow: {currentConfig.tomorrow}
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onOpenPicker();
            }}
            className="text-sky-400 hover:text-sky-300 font-semibold font-mono flex items-center gap-1 tap-target min-h-[30px]"
          >
            <Shuffle className="w-3 h-3" />
            <span>Switch</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentDay >= CURRICULUM_DAYS.length}
        className={`spring-btn p-2.5 rounded-xl tap-target min-h-[44px] min-w-[44px] flex items-center justify-center transition ${
          currentDay >= CURRICULUM_DAYS.length
            ? 'text-slate-600 opacity-40 cursor-not-allowed'
            : 'text-slate-400 hover:text-white active:scale-95'
        }`}
        aria-label="Next Curriculum Day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </section>
  );
};
