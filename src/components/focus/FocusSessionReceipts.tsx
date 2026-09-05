import React from 'react';
import { Plus, X, Pause, Clock } from 'lucide-react';
import { FocusSession } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface FocusSessionReceiptsProps {
  sessions: FocusSession[];
  activeSession?: FocusSession | null;
  selectedDate: string;
  onDeleteSession: (id: string) => void;
  onOpenManualModal: () => void;
  onPauseActiveTimer?: () => void;
}

export const FocusSessionReceipts: React.FC<FocusSessionReceiptsProps> = ({
  sessions,
  activeSession,
  selectedDate,
  onDeleteSession,
  onOpenManualModal,
  onPauseActiveTimer,
}) => {
  // Filter sessions for selectedDate
  const daySessions = sessions.filter((s) => s.dateStr === selectedDate);
  const totalCount = daySessions.length + (activeSession ? 1 : 0);

  let totalDurationSec = daySessions.reduce(
    (acc, s) => acc + (s.durationSeconds || (s.durationMinutes || 0) * 60),
    0
  );
  if (activeSession) {
    totalDurationSec += Math.floor((Date.now() - activeSession.startTimestamp) / 1000);
  }

  const totHrs = Math.floor(totalDurationSec / 3600);
  const totMins = Math.floor((totalDurationSec % 3600) / 60);
  const durationText = `${totHrs}h ${String(totMins).padStart(2, '0')}m`;

  const getBucketPill = (bucket: string) => {
    switch (bucket) {
      case 'spaced':
        return { label: 'Spaced Retrieval', color: 'bg-purple-950/60 text-purple-400 border-purple-800/40' };
      case 'live':
        return { label: 'Live Coding', color: 'bg-amber-950/60 text-amber-400 border-amber-800/40' };
      case 'dsa':
        return { label: 'C# DSA', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' };
      default:
        return { label: 'Deep Anchor', color: 'bg-sky-950/60 text-sky-400 border-sky-800/40' };
    }
  };

  const sortedSessions = [...daySessions].sort(
    (a, b) => b.startTimestamp - a.startTimestamp
  );

  return (
    <section className="matte-card p-4 space-y-3 border-white/10 bg-[#0d131f] rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow text-slate-300 font-mono text-[11px] block">
            Today's Study Session Receipts
          </span>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Start → Stop Timestamps & Active Focus Log
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {totalCount} {totalCount === 1 ? 'Session' : 'Sessions'} ({durationText})
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onOpenManualModal();
            }}
            className="spring-btn px-2.5 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 border border-sky-800/40 text-xs font-semibold flex items-center gap-1 shadow-sm tap-target min-h-[36px] active:scale-95 transition"
            title="Manually Log a Study Session Receipt"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Session</span>
          </button>
        </div>
      </div>

      {/* Live Session Banner */}
      {activeSession && (
        <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-400/50 flex items-center justify-between gap-3 shadow-md shadow-sky-500/10 animate-fadeIn">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white truncate">
                {activeSession.taskTitle}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-bold uppercase">
                LIVE
              </span>
            </div>
            <div className="text-[11px] font-mono text-sky-300">
              Started at {activeSession.startTimeFormatted} · Active Focus Bout
            </div>
          </div>
          {onPauseActiveTimer && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onPauseActiveTimer();
              }}
              className="spring-btn px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold shrink-0 flex items-center gap-1 tap-target min-h-[36px] active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}
        </div>
      )}

      {/* Session Receipts List */}
      {totalCount === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs font-mono matte-card p-4 border-white/5 bg-[#090d15] rounded-xl space-y-1">
          <p>No study sessions recorded for this day yet.</p>
          <p className="text-[11px] text-slate-400">
            Focus on a question with the timer above, or tap{' '}
            <span className="text-sky-400 font-bold">+ Log Session</span> to record
            your focus receipt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSessions.map((sess) => {
            const pill = getBucketPill(sess.bucket);
            const durSecs = sess.durationSeconds || (sess.durationMinutes || 0) * 60;
            const durMins = Math.floor(durSecs / 60);
            const remainingSecs = durSecs % 60;
            const durStr =
              durMins > 0
                ? `${durMins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ''}`
                : `${remainingSecs}s`;

            return (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-[#090d15] border border-white/10 flex items-center justify-between gap-3 text-xs font-mono hover:border-white/20 transition"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white truncate max-w-xs sm:max-w-md">
                      {sess.taskTitle}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${pill.color}`}
                    >
                      {pill.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {sess.startTimeFormatted} → {sess.endTimeFormatted || 'Now'} ·{' '}
                      <strong className="text-slate-200">{durStr}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    onDeleteSession(sess.id);
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition tap-target min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                  aria-label={`Delete session ${sess.taskTitle}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
