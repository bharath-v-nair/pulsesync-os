import React, { useState } from 'react';
import { ChevronRight, Check, Zap, X } from 'lucide-react';
import { FocusTask } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface SpacedRetrievalAccordionProps {
  tasks: FocusTask[];
  boundTaskId: string | null;
  onCheckTask: (id: string) => void;
  onBindTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const SpacedRetrievalAccordion: React.FC<SpacedRetrievalAccordionProps> = ({
  tasks,
  boundTaskId,
  onCheckTask,
  onBindTask,
  onDeleteTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const spacedTasks = tasks.filter((t) => t.bucket === 'spaced');
  const spacedPending = spacedTasks.filter((t) => !t.completed);
  const completedCount = spacedTasks.filter((t) => t.completed).length;
  const totalCount = spacedTasks.length;

  return (
    <div className="matte-card overflow-hidden transition-all border-white/10 bg-[#0d131f]">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic(10);
          setIsOpen(!isOpen);
        }}
        className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition tap-target min-h-[48px]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <ChevronRight
            className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <span className="font-bold text-white tracking-wide">
            {totalCount} Spaced Retrieval Checks
          </span>
        </span>
        <span className="font-mono text-purple-300 text-xs font-bold">
          {completedCount}/{totalCount} Done
        </span>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-3 pt-0 space-y-2 border-t border-white/5 animate-fadeIn">
          {spacedPending.length === 0 ? (
            <div className="text-xs text-slate-400 font-mono py-3 text-center">
              All spaced checks completed! Great active recall retention.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {spacedPending.map((task) => {
                const isBound = boundTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                      isBound
                        ? 'bg-purple-950/40 border-purple-400/80 shadow-md shadow-purple-500/10'
                        : 'bg-[#090d15] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(20);
                          onCheckTask(task.id);
                        }}
                        className="w-6 h-6 rounded-lg border border-white/20 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-transparent hover:text-emerald-400 text-xs shrink-0 tap-target min-h-[44px] min-w-[44px]"
                        aria-label={`Mark ${task.title} as completed`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="text-slate-200 font-medium truncate">
                        {task.title}
                      </span>
                      {(task.activeSeconds ?? 0) > 0 && (
                        <span className="text-purple-400 text-[10px] font-mono font-semibold bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.5 rounded shrink-0">
                          ⏱️ {Math.max(1, Math.round((task.activeSeconds || 0) / 60))}m
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(12);
                          onBindTask(task.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs tap-target min-h-[44px] transition flex items-center justify-center ${
                          isBound
                            ? 'bg-purple-500 text-slate-950 shadow-sm'
                            : 'bg-[#1a2233] text-purple-300 hover:bg-slate-700 border border-white/10'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isBound ? 'Active' : 'Focus'}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          onDeleteTask(task.id);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 tap-target min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Delete ${task.title}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
