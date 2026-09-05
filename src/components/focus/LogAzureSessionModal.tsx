import React, { useState } from 'react';
import { X, Cloud, Clock, Minus, Plus, BookOpen, AlignLeft, Sparkles } from 'lucide-react';
import { FocusSession } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface LogAzureSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAzureMinutes: number;
  sessions?: FocusSession[];
  onAddSession: (
    mins: number,
    title: string,
    description?: string,
    startTime?: string,
    endTime?: string
  ) => void;
}

export const LogAzureSessionModal: React.FC<LogAzureSessionModalProps> = ({
  isOpen,
  onClose,
  currentAzureMinutes,
  sessions,
  onAddSession,
}) => {
  const [minsToAdd, setMinsToAdd] = useState<number>(45);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const azureSessions = (sessions || []).filter(
    (s) => s.bucket === 'azure' || s.category === 'Azure'
  );

  if (!isOpen) return null;

  // Helper to parse time string like "10:00 AM", "10:45 AM", "14:30" to minutes from midnight
  const parseTimeToMinutes = (t: string): number | null => {
    const clean = t.trim();
    const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!match12) return null;
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const handleTimeChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    const startMins = parseTimeToMinutes(newStart);
    const endMins = parseTimeToMinutes(newEnd);
    if (startMins !== null && endMins !== null && endMins > startMins) {
      setMinsToAdd(endMins - startMins);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim() || 'Azure AI Deliberate Practice';
    if (minsToAdd <= 0) return;

    triggerHaptic(15);
    onAddSession(
      minsToAdd,
      cleanTitle,
      description.trim() || undefined,
      startTime.trim() || undefined,
      endTime.trim() || undefined
    );
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setMinsToAdd(45);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0d131f] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Log Azure Practice Session</h2>
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
          {/* Title / Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Title</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MS Learn AI-102, Azure OpenAI, Semantic Kernel"
              className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Description / Where from */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Description / Context (What & Where From)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lab 03 Vector Search on Microsoft Learn, YouTube tutorial"
              className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-sans resize-none"
            />
          </div>

          {/* Minutes with Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Minutes to Log</span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                +{minsToAdd} mins ({(minsToAdd / 60).toFixed(1)}h)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setMinsToAdd((prev) => Math.max(1, prev - 5));
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs font-bold tap-target min-h-[44px] min-w-[44px] flex items-center justify-center transition"
                title="Subtract 5 minutes"
              >
                -5m
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setMinsToAdd((prev) => Math.max(1, prev - 1));
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 tap-target min-h-[44px] min-w-[44px] flex items-center justify-center transition"
                aria-label="Subtract 1 minute"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min={1}
                max={360}
                value={minsToAdd}
                onChange={(e) => setMinsToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setMinsToAdd((prev) => prev + 1);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 tap-target min-h-[44px] min-w-[44px] flex items-center justify-center transition"
                aria-label="Add 1 minute"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setMinsToAdd((prev) => prev + 5);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs font-bold tap-target min-h-[44px] min-w-[44px] flex items-center justify-center transition"
                title="Add 5 minutes"
              >
                +5m
              </button>
            </div>
          </div>

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Start Time (Opt)</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => handleTimeChange(e.target.value, endTime)}
                placeholder="e.g. 10:00 AM"
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">End Time (Opt)</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => handleTimeChange(startTime, e.target.value)}
                placeholder="e.g. 10:45 AM"
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
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
              className="spring-btn px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold font-mono shadow-md tap-target min-h-[44px] active:scale-95 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Log Session (+{minsToAdd}m)</span>
            </button>
          </div>
        </form>

        {/* Today's Logged Activity Count */}
        {azureSessions.length > 0 && (
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Logged Today: {azureSessions.length} session{azureSessions.length !== 1 ? 's' : ''}</span>
            <span className="text-emerald-400 font-bold">{currentAzureMinutes}m total</span>
          </div>
        )}
      </div>
    </div>
  );
};
