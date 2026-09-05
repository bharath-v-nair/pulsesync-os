import React, { useState } from 'react';
import { Minus, Plus, Timer, Briefcase, Cloud, SlidersHorizontal, BookOpen, AlignLeft, Check, Edit2, RotateCcw } from 'lucide-react';
import { FocusSession } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface AccountabilityTrackCardProps {
  jobAppsCount: number;
  azureMinutes: number;
  sessions?: FocusSession[];
  onUpdateJobApps: (newCount: number) => void;
  onOpenAzureModal: () => void;
  onStartAzureTimer: (title?: string, description?: string) => void;
  onEditAzureSession: (session: FocusSession) => void;
  onRevertAzureSession: (sessionId: string) => void;
}

export const AccountabilityTrackCard: React.FC<AccountabilityTrackCardProps> = ({
  jobAppsCount,
  azureMinutes,
  sessions,
  onUpdateJobApps,
  onOpenAzureModal,
  onStartAzureTimer,
  onEditAzureSession,
  onRevertAzureSession,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleDecApps = () => {
    if (jobAppsCount > 0) {
      triggerHaptic(10);
      onUpdateJobApps(jobAppsCount - 1);
    }
  };

  const handleIncApps = () => {
    triggerHaptic(15);
    onUpdateJobApps(jobAppsCount + 1);
  };

  const handleStartPomodoro = () => {
    triggerHaptic(15);
    const cleanTitle = title.trim() || 'Azure AI Deliberate Practice';
    onStartAzureTimer(cleanTitle, description.trim() || undefined);
  };

  const todayAzureSessions = (sessions || []).filter(
    (s) => s.bucket === 'azure' || s.category === 'Azure'
  );

  return (
    <section className="space-y-3 pt-1">
      <div className="space-y-3">
        {/* Job Applications Stepper (Clean, Minimal, No +5) */}
        <div className="matte-card p-3.5 flex items-center justify-between border-white/10 bg-[#0d131f] rounded-2xl">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-white">
              <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <h3 className="text-xs font-bold truncate">Job Applications</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Daily Submissions
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDecApps}
              className="stepper-btn spring-btn tap-target min-h-[44px] min-w-[44px] rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition"
              aria-label="Decrease Job Applications"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="w-8 text-center text-sm font-extrabold text-white tabular-nums font-mono">
              {jobAppsCount}
            </span>

            <button
              type="button"
              onClick={handleIncApps}
              className="stepper-btn spring-btn tap-target min-h-[44px] min-w-[44px] rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition"
              aria-label="Increase Job Applications"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Azure AI Deliberate Practice Card */}
        <div className="matte-card p-4 space-y-3.5 border-white/10 bg-[#0d131f] rounded-2xl">
          {/* Header Row (No -15m button, strict task-referenced integrity) */}
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white truncate">Azure AI Deliberate Practice</h3>
                <div className="text-[11px] text-emerald-400 font-mono font-semibold">
                  {azureMinutes}m logged ({(azureMinutes / 60).toFixed(1)}h today)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAzureModal}
              className="spring-btn tap-target min-h-[38px] px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold font-mono border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition shrink-0"
              title="Open Custom Azure Session Logger"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span>Custom</span>
            </button>
          </div>

          {/* Practice Session Setup (Title & Description) */}
          <div className="space-y-2.5">
            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>Session Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MS Learn AI-102, Azure OpenAI, Semantic Kernel"
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-sans"
              />
            </div>

            {/* Description / Where from */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <AlignLeft className="w-3 h-3 text-sky-400" />
                <span>Description & Context (What & Where From)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lab 03 Vector Search on Microsoft Learn, YouTube tutorial"
                className="w-full px-3 py-2 rounded-xl bg-[#090d15] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-sans"
              />
            </div>
          </div>

          {/* Action Button: Start 45m Pomodoro */}
          <button
            type="button"
            onClick={handleStartPomodoro}
            className="w-full spring-btn tap-target min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 text-xs font-bold font-mono flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
          >
            <Timer className="w-4 h-4 text-emerald-400" />
            <span>⏱️ Start 45m Pomodoro</span>
          </button>

          {/* Today's Practice Log Feed with Edit & Revert */}
          {todayAzureSessions.length > 0 ? (
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  <span>Today's Logged Practice ({todayAzureSessions.length})</span>
                </span>
                <span className="text-emerald-400 font-bold">{azureMinutes}m total</span>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {todayAzureSessions.map((s) => {
                  const displayTitle = s.taskTitle || s.notes || 'Azure AI Deliberate Practice';
                  const displayDesc = s.description || (s.taskTitle !== s.notes ? s.notes : undefined);
                  const durationMins =
                    s.durationMinutes ||
                    (s.durationSeconds ? Math.max(1, Math.round(s.durationSeconds / 60)) : 1);

                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-[#090d15] border border-white/5 space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-white font-bold block truncate">
                            {displayTitle}
                          </span>
                          {displayDesc && (
                            <span className="text-[11px] text-slate-400 block truncate font-sans mt-0.5">
                              {displayDesc}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {s.startTimeFormatted} - {s.endTimeFormatted}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-bold text-[11px]">
                            +{durationMins}m
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(10);
                              onEditAzureSession(s);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white tap-target min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                            title="Edit session"
                            aria-label="Edit Azure practice session"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(15);
                              if (window.confirm(`Revert and remove "${displayTitle}" from today's log?`)) {
                                onRevertAzureSession(s.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 tap-target min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                            title="Revert / Remove session"
                            aria-label="Revert Azure practice session"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 font-mono pt-1 text-center">
              Fill in session title & description, then tap <span className="text-emerald-400 font-bold">⏱️ Start 45m Pomodoro</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
