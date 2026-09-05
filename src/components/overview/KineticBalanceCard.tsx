import React, { useState } from 'react';
import { WorkoutLog } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';
import { Scale, ChevronDown, ChevronUp, ShieldCheck, AlertCircle } from 'lucide-react';

interface KineticBalanceCardProps {
  workouts: WorkoutLog[];
  timeframe?: number;
}

export const KineticBalanceCard: React.FC<KineticBalanceCardProps> = ({
  workouts,
  timeframe = 7,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 1. Horizontal Plane
  // Pull: Barbell Bent Rows
  const bentRowReps = workouts
    .filter((w) => w.category === 'barbell' && (w.name.includes('Bent Rows') || w.name.includes('Rows')))
    .reduce((acc, w) => acc + (w.reps || 0), 0);

  // Push: Push-ups
  const pushupReps = workouts
    .filter((w) => w.category === 'pushup')
    .reduce((acc, w) => acc + (w.reps || 0), 0);

  // 2. Vertical Plane
  // Pull: Half Pull-ups
  const pullupReps = workouts
    .filter((w) => w.category === 'pullup')
    .reduce((acc, w) => acc + (w.reps || 0), 0);

  // Push: Barbell Overhead Press
  const ohpReps = workouts
    .filter((w) => w.category === 'barbell' && (w.name.includes('Overhead Press') || w.name.includes('OHP')))
    .reduce((acc, w) => acc + (w.reps || 0), 0);

  // 3. Accessory Pull: Bicep Curls
  const curlReps = workouts
    .filter((w) => w.category === 'barbell' && (w.name.includes('Bicep Curls') || w.name.includes('Curls')))
    .reduce((acc, w) => acc + (w.reps || 0), 0);

  // Total Pull vs Push Volume
  const totalPullReps = bentRowReps + pullupReps + curlReps;
  const totalPushReps = pushupReps + ohpReps;
  const totalVolumeReps = totalPullReps + totalPushReps;

  const pullPct = totalVolumeReps > 0 ? Math.round((totalPullReps / totalVolumeReps) * 100) : 50;
  const pushPct = 100 - pullPct;

  // Overall Ratio (Pull / Push)
  const overallRatio = totalPushReps > 0 ? (totalPullReps / totalPushReps).toFixed(2) : totalPullReps > 0 ? '2.0+' : '1.00';

  // Biomechanical Evaluation:
  // Optimum: 1.0 to 1.5 Pull : 1 Push (50% - 60% pulling) protects rotator cuff & scapular mechanics
  // Restorative: > 1.5 Pull : 1 Push (>60% pulling)
  // Caution: Push dominant (< 0.85 Pull : 1 Push or <46% pulling)
  let balanceStatus: 'optimal' | 'restorative' | 'push_heavy' = 'optimal';
  let statusLabel = 'Balanced Kinetic Ratio';
  let statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let statusTip = '1:1 to 1.5:1 pulling-to-pushing protects the rotator cuff from desk-slump posture.';

  if (totalVolumeReps === 0) {
    statusLabel = 'Awaiting Workout Logs';
    statusBadgeColor = 'text-slate-400 bg-white/5 border-white/10';
    statusTip = 'Log push-ups, pull-ups, overhead press, or bent rows to calibrate balance.';
  } else if (pullPct < 46) {
    balanceStatus = 'push_heavy';
    statusLabel = 'Push Dominant (Anterior Bias)';
    statusBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    statusTip = 'Add Bent Rows or Half Pull-ups to avoid anterior shoulder impingement.';
  } else if (pullPct > 62) {
    balanceStatus = 'restorative';
    statusLabel = 'Posterior Restorative (Pull Heavy)';
    statusBadgeColor = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    statusTip = 'Excellent scapular retraction and posture counter-balance.';
  }

  // Horizontal Plane Ratio
  const horizontalRatio = pushupReps > 0 ? (bentRowReps / pushupReps).toFixed(2) : bentRowReps > 0 ? '2.0+' : '1.00';
  // Vertical Plane Ratio
  const verticalRatio = ohpReps > 0 ? (pullupReps / ohpReps).toFixed(2) : pullupReps > 0 ? '2.0+' : '1.00';

  return (
    <div className="matte-card p-4 space-y-3.5 border-sky-500/20 bg-[#090d16] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Structural Kinetic Balance
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Eric Cressey / Dr. McGill Planar Ratio ({timeframe}D)
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 ${statusBadgeColor}`}>
          {balanceStatus === 'push_heavy' ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <ShieldCheck className="w-3 h-3" />
          )}
          <span>{overallRatio} : 1</span>
        </div>
      </div>

      {/* Kinetic Bipolar Spectrum Visualizer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            ◀ PULL: {totalPullReps} reps ({pullPct}%)
          </span>
          <span className="text-sky-400 font-semibold flex items-center gap-1">
            PUSH: {totalPushReps} reps ({pushPct}%) ▶
          </span>
        </div>

        {/* Bi-Color Progress Spectrum */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-white/10">
          <div
            style={{ width: `${pullPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
          />
          <div
            style={{ width: `${pushPct}%` }}
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-r-full transition-all duration-500"
          />
        </div>

        {/* Optimal Zone Guideline Marker */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 px-1 pt-0.5">
          <span>Lat / Rhomboids</span>
          <span className="text-slate-400 font-semibold">Target Corridor: 50% – 60% Pulling</span>
          <span>Chest / Deltoids</span>
        </div>
      </div>

      {/* Clinical Guidance Notice */}
      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
        <div className="text-[11px] font-mono text-slate-300">
          <span className="font-bold text-white">{statusLabel}: </span>
          {statusTip}
        </div>
      </div>

      {/* Expandable Planar Motion Breakdown */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            setIsDetailsOpen((prev) => !prev);
          }}
          className="w-full flex items-center justify-between py-1 px-2 text-xs font-mono text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors tap-target"
        >
          <span className="font-semibold">
            {isDetailsOpen ? 'Hide Movement Plane Breakdown' : 'View Horizontal & Vertical Planes'}
          </span>
          {isDetailsOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {isDetailsOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2.5 animate-fadeIn">
            {/* Plane 1: Horizontal Plane */}
            <div className="p-2.5 rounded-xl bg-[#0e131d] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">1. Horizontal Motion (Scapular Retraction)</span>
                <span className="text-emerald-400 font-bold">{horizontalRatio} : 1 Pull</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Bent Rows ({bentRowReps} reps) vs Push-ups ({pushupReps} reps)
              </p>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${bentRowReps + pushupReps > 0 ? (bentRowReps / (bentRowReps + pushupReps)) * 100 : 50}%`,
                  }}
                  className="bg-emerald-400 h-full"
                />
                <div
                  style={{
                    width: `${bentRowReps + pushupReps > 0 ? (pushupReps / (bentRowReps + pushupReps)) * 100 : 50}%`,
                  }}
                  className="bg-sky-400 h-full"
                />
              </div>
            </div>

            {/* Plane 2: Vertical Plane */}
            <div className="p-2.5 rounded-xl bg-[#0e131d] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">2. Vertical Motion (Humeral Centering)</span>
                <span className="text-emerald-400 font-bold">{verticalRatio} : 1 Pull</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Half Pull-ups ({pullupReps} reps) vs Overhead Press ({ohpReps} reps)
              </p>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${pullupReps + ohpReps > 0 ? (pullupReps / (pullupReps + ohpReps)) * 100 : 50}%`,
                  }}
                  className="bg-emerald-400 h-full"
                />
                <div
                  style={{
                    width: `${pullupReps + ohpReps > 0 ? (ohpReps / (pullupReps + ohpReps)) * 100 : 50}%`,
                  }}
                  className="bg-sky-400 h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
