import React, { useState, useEffect } from 'react';
import { X, Clock, Plus } from 'lucide-react';
import { FocusTask, FocusBucket } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface AddFocusSessionModalProps {
  isOpen: boolean;
  tasks: FocusTask[];
  selectedDate: string;
  onClose: () => void;
  onSaveSession: (session: {
    taskId?: string | null;
    taskTitle: string;
    category: string;
    bucket: FocusBucket;
    dateStr: string;
    startTimestamp: number;
    startTimeFormatted: string;
    endTimestamp: number;
    endTimeFormatted: string;
    durationSeconds: number;
  }) => void;
}

export const AddFocusSessionModal: React.FC<AddFocusSessionModalProps> = ({
  isOpen,
  tasks,
  selectedDate,
  onClose,
  onSaveSession,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('custom');
  const [customTitle, setCustomTitle] = useState('');
  const [category, setCategory] = useState('Angular');
  const [bucket, setBucket] = useState<FocusBucket>('deep');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('14:50');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const endHH = String(now.getHours()).padStart(2, '0');
      const endMM = String(now.getMinutes()).padStart(2, '0');
      setEndTime(`${endHH}:${endMM}`);

      const past = new Date(now.getTime() - 50 * 60 * 1000);
      const startHH = String(past.getHours()).padStart(2, '0');
      const startMM = String(past.getMinutes()).padStart(2, '0');
      setStartTime(`${startHH}:${startMM}`);

      if (tasks.length > 0) {
        setSelectedTaskId(tasks[0].id);
        setCategory(tasks[0].category);
        setBucket(tasks[0].bucket);
      } else {
        setSelectedTaskId('custom');
      }
    }
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId !== 'custom') {
      const t = tasks.find((item) => item.id === taskId);
      if (t) {
        setCategory(t.category);
        setBucket(t.bucket);
      }
    }
  };

  const getDurationMins = () => {
    if (!startTime || !endTime) return 0;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    let diff = eH * 60 + eM - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60; // Crosses midnight
    return diff;
  };

  const durationMinutes = getDurationMins();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let title = customTitle.trim();
    if (selectedTaskId !== 'custom') {
      const t = tasks.find((item) => item.id === selectedTaskId);
      if (t) title = t.title;
    }

    if (!title) {
      alert('Please enter a session title or select a task');
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);

    const startTimestamp = new Date(year, month - 1, day, sH, sM, 0, 0).getTime();
    let endTimestamp = new Date(year, month - 1, day, eH, eM, 0, 0).getTime();
    if (endTimestamp <= startTimestamp) {
      endTimestamp += 24 * 60 * 60 * 1000;
    }

    const durationSeconds = Math.max(60, Math.round((endTimestamp - startTimestamp) / 1000));

    const format12h = (dateObj: Date) =>
      dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    triggerHaptic(15);
    onSaveSession({
      taskId: selectedTaskId !== 'custom' ? selectedTaskId : null,
      taskTitle: title,
      category,
      bucket,
      dateStr: selectedDate,
      startTimestamp,
      startTimeFormatted: format12h(new Date(startTimestamp)),
      endTimestamp,
      endTimeFormatted: format12h(new Date(endTimestamp)),
      durationSeconds,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-md bg-[#0e131e] border border-white/15 p-5 space-y-4 shadow-2xl animate-modalSpring max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-session-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 id="manual-session-title" className="text-sm font-bold text-white">
                Log Study Session Receipt
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Date: {selectedDate}
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
          {/* Task Selection */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Select Task / Question
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => handleSelectTask(e.target.value)}
              className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0e131e] text-white">
                  [{t.code || t.category}] {t.title}
                </option>
              ))}
              <option value="custom" className="bg-[#0e131e] text-sky-300">
                + Custom Topic / Off-Roster Study...
              </option>
            </select>
          </div>

          {/* Custom Title if selected */}
          {selectedTaskId === 'custom' && (
            <div className="space-y-2 animate-fadeIn">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Custom Topic Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. RxJS mergeMap vs switchMap deep dive"
                  className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
                  >
                    <option value="Angular">Angular</option>
                    <option value=".NET">.NET</option>
                    <option value="LeetCode">LeetCode</option>
                    <option value="SystemDesign">SystemDesign</option>
                    <option value="Azure">Azure</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Bucket
                  </label>
                  <select
                    value={bucket}
                    onChange={(e) => setBucket(e.target.value as FocusBucket)}
                    className="w-full h-10 px-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
                  >
                    <option value="deep">Deep Anchor</option>
                    <option value="spaced">Spaced Retrieval</option>
                    <option value="live">Live Coding</option>
                    <option value="dsa">C# DSA</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-sky-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Duration Readout */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Computed Session Duration:</span>
            <span className="text-sky-300 font-bold">
              {Math.floor(durationMinutes / 60) > 0
                ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                : `${durationMinutes}m`}
            </span>
          </div>

          {/* Action Buttons */}
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
              <span>Log Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
