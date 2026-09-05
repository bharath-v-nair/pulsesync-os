import React, { useState } from 'react';
import { X, Plus, BookOpen } from 'lucide-react';
import { FocusBucket, FocusTask } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface AddTaskModalProps {
  isOpen: boolean;
  currentDay: number;
  onClose: () => void;
  onAddTask: (task: Omit<FocusTask, 'id' | 'completed' | 'completedAt' | 'startedAt'>) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  currentDay,
  onClose,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Angular');
  const [bucket, setBucket] = useState<FocusBucket>('deep');
  const [curriculumDay, setCurriculumDay] = useState(currentDay);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic(15);
    onAddTask({
      title: title.trim(),
      category,
      bucket,
      curriculumDay,
    });
    setTitle('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-md bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 id="add-task-title" className="text-sm font-bold text-white">
                Add Focus Curriculum Task
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Day {curriculumDay} Sprint Roster
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center tap-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Task / Question Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. [NG-12] Signals vs RxJS Observables in Angular 18"
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Category Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
              >
                <option value="Angular">Angular</option>
                <option value=".NET">.NET</option>
                <option value="LeetCode">LeetCode</option>
                <option value="SystemDesign">SystemDesign</option>
                <option value="Azure">Azure AI / Cloud</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Pillar Bucket
              </label>
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value as FocusBucket)}
                className="w-full h-11 px-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
              >
                <option value="deep">Deep Anchor (50m)</option>
                <option value="spaced">Spaced Retrieval (6m)</option>
                <option value="live">Live Coding (1h)</option>
                <option value="dsa">C# DSA (1h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              Curriculum Day (1–7)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={curriculumDay}
              onChange={(e) => setCurriculumDay(Number(e.target.value))}
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold tap-target transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] spring-btn py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 tap-target transition active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
