import React, { useState, useEffect } from 'react';
import { X, Brain, Plus } from 'lucide-react';
import { triggerHaptic } from '../../hooks/useHaptics';

export interface AddMissedFocusModalProps {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
  onAddFocusSession: (session: {
    durationMinutes: number;
    subject: string;
    notes?: string;
    dateStr: string;
  }) => void;
}

export const AddMissedFocusModal: React.FC<AddMissedFocusModalProps> = ({
  isOpen,
  selectedDate,
  onClose,
  onAddFocusSession,
}) => {
  const [subject, setSubject] = useState('Angular Forms Deep Dive');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(50);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(20);
    onAddFocusSession({
      subject,
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : 50,
      notes: notes || undefined,
      dateStr: selectedDate,
    });
    onClose();
  };

  const presetTopics = [
    'Angular Reactive Forms',
    'Angular Route Guards & Resolvers',
    '.NET Garbage Collection & LOH',
    '.NET Value vs Ref Types',
    'System Design & Microservices',
    'LeetCode DSA (Sliding Window)',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-sm bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-missed-focus"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <div>
              <h3 id="title-missed-focus" className="text-sm font-bold text-white">Add Missed Focus Block</h3>
              <p className="text-[11px] text-slate-400 font-mono">Date: {selectedDate}</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="focus-subject" className="text-[10px] font-mono text-slate-400 block mb-1">
              Focus Topic / Domain
            </label>
            <input
              id="focus-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Angular Forms Deep Dive"
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-purple-400 focus:outline-none"
              required
            />
            {/* Quick Topic Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetTopics.slice(0, 4).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSubject(topic)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 text-[10px] font-mono text-slate-300 transition-colors min-h-[32px] flex items-center tap-target"
                >
                  {topic.split(' ')[0]} {topic.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="focus-duration" className="text-[10px] font-mono text-slate-400 block mb-1">
                Duration (mins)
              </label>
              <input
                id="focus-duration"
                type="number"
                min="5"
                max="300"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-purple-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDurationMinutes(25)}
                  className="h-11 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 text-xs font-mono font-bold text-slate-200 flex items-center justify-center tap-target transition-all"
                >
                  25m
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMinutes(50)}
                  className="h-11 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 text-xs font-mono font-bold text-slate-200 flex items-center justify-center tap-target transition-all"
                >
                  50m
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="focus-notes" className="text-[10px] font-mono text-slate-400 block mb-1">
              Notes / Takeaway (opt)
            </label>
            <input
              id="focus-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mastered ControlValueAccessor implementation"
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-purple-400 focus:outline-none"
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
              className="flex-1 min-h-[44px] spring-btn py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 tap-target transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Record Focus</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
