import React from 'react';
import { X, CheckCircle2, Calendar } from 'lucide-react';
import { CURRICULUM_DAYS } from '../../data/focusData';
import { triggerHaptic } from '../../hooks/useHaptics';

interface CurriculumPickerModalProps {
  isOpen: boolean;
  currentDay: number;
  onSelectDay: (day: number) => void;
  onClose: () => void;
}

export const CurriculumPickerModal: React.FC<CurriculumPickerModalProps> = ({
  isOpen,
  currentDay,
  onSelectDay,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-md bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="curriculum-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 id="curriculum-modal-title" className="text-sm font-bold text-white">
                Select Curriculum Sprint Day
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Week 1 Technical Foundation Bootcamp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center tap-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {CURRICULUM_DAYS.map((config) => {
            const isActive = config.day === currentDay;
            return (
              <button
                key={config.day}
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onSelectDay(config.day);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition min-h-[56px] tap-target ${
                  isActive
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10'
                    : 'bg-[#101522] border-white/5 text-slate-300 hover:border-white/15'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-mono text-white truncate">
                      {config.title}
                    </span>
                    <span className="badge-pill text-[9px] font-mono py-0.5 px-1.5 bg-white/5 text-slate-400">
                      {config.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    Next: {config.tomorrow}
                  </p>
                </div>
                {isActive && (
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
