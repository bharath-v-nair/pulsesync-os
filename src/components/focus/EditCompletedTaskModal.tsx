import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, CheckCircle, Tag, BookOpen, Calendar } from 'lucide-react';
import { FocusBucket, FocusTask } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface EditCompletedTaskModalProps {
  task: FocusTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: FocusTask) => void;
  onDelete: (taskId: string) => void;
}

export const EditCompletedTaskModal: React.FC<EditCompletedTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Angular');
  const [bucket, setBucket] = useState<FocusBucket>('deep');
  const [durationMinutes, setDurationMinutes] = useState<number>(50);
  const [completedAt, setCompletedAt] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [notes, setNotes] = useState('');

  const formatNowTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setCategory(task.category || 'Angular');
      setBucket(task.bucket || 'deep');
      setDurationMinutes(
        task.durationMinutes ||
          (task.activeSeconds
            ? Math.max(1, Math.round(task.activeSeconds / 60))
            : task.bucket === 'spaced'
            ? 10
            : 50)
      );
      setCompletedAt(task.completedAt || formatNowTime());
      setStartedAt(task.startedAt || '');
      setNotes(task.notes || task.userHypothesis || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic(15);
    onSave({
      ...task,
      title: title.trim(),
      category: category.trim(),
      bucket,
      durationMinutes: Math.max(1, Number(durationMinutes) || 1),
      completedAt: completedAt.trim() || formatNowTime(),
      startedAt: startedAt.trim() || null,
      notes: notes.trim() || undefined,
      userHypothesis: notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    triggerHaptic(20);
    if (window.confirm('Delete this completed task from today’s record?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const durationPresets = [10, 15, 30, 45, 50, 60, 90];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0d131f] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Edit Completed Task</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Update duration, timestamp, notes, or mental model
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 tap-target min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Task / Question Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 font-medium"
              placeholder="e.g., [NG-09] Reactive Forms vs Template-Driven Forms"
              required
            />
          </div>

          {/* Category & Bucket */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Domain Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="Angular">Angular</option>
                <option value=".NET">.NET</option>
                <option value="LeetCode">LeetCode / C# DSA</option>
                <option value="SystemDesign">System Design</option>
                <option value="Azure">Azure AI & Cloud</option>
                <option value="Behavioral">Behavioral / STAR</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Focus Protocol</span>
              </label>
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value as FocusBucket)}
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="deep">Deep Anchor (50m)</option>
                <option value="spaced">Spaced Retrieval (10m)</option>
                <option value="live">Live Coding Sprint (60m)</option>
                <option value="dsa">C# DSA Challenge (60m)</option>
                <option value="azure">Azure AI Deliberate (45m)</option>
              </select>
            </div>
          </div>

          {/* Duration Spent (Minutes) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Time Spent on Task (Minutes)</span>
              </label>
              <span className="text-xs font-mono font-bold text-white tabular-nums">
                {durationMinutes} mins
              </span>
            </div>

            <input
              type="number"
              min={1}
              max={360}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 font-mono font-bold"
            />

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {durationPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setDurationMinutes(preset);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition tap-target min-h-[32px] ${
                    durationMinutes === preset
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Logged Completion & Start Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Completed Time</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setCompletedAt(formatNowTime());
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-mono"
                >
                  Set to Now
                </button>
              </div>
              <input
                type="text"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                placeholder="e.g. 10:45 AM"
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Started Time (Opt)</span>
              </label>
              <input
                type="text"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                placeholder="e.g. 09:55 AM"
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Feynman Takeaway / Mental Model Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span>💡 Feynman Takeaway / Key Mental Model</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What core concept, architecture pattern, or gotcha did you cement during this sprint?"
              className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 font-sans resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleDelete}
              className="spring-btn px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono flex items-center gap-1.5 tap-target min-h-[44px] active:scale-95 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onClose();
                }}
                className="spring-btn px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold font-mono tap-target min-h-[44px] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="spring-btn px-5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-extrabold font-mono shadow-md tap-target min-h-[44px] active:scale-95 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
