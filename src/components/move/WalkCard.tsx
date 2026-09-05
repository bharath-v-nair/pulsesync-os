import React from 'react';
import { Footprints, Check } from 'lucide-react';
import { triggerHaptic } from '../../hooks/useHaptics';

interface WalkCardProps {
  morningWalkDone: boolean;
  eveningWalkDone: boolean;
  onToggleWalk: (type: 'Morning 5k Walk' | 'Evening 5k Walk') => void;
}

export const WalkCard: React.FC<WalkCardProps> = ({
  morningWalkDone,
  eveningWalkDone,
  onToggleWalk,
}) => {
  const handleClick = (type: 'Morning 5k Walk' | 'Evening 5k Walk') => {
    triggerHaptic(15);
    onToggleWalk(type);
  };

  return (
    <div className="matte-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Daily 5k Walks</h3>
        </div>
        <span className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
          Cardio & Sunlight
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Morning Walk */}
        <button
          onClick={() => handleClick('Morning 5k Walk')}
          className={`spring-btn p-3 rounded-xl border flex items-center justify-between gap-2 transition-all tap-target ${
            morningWalkDone
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-[#0e131d] border-white/5 text-slate-300 hover:text-white'
          }`}
        >
          <span className="text-xs font-semibold">Morning 5k</span>
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              morningWalkDone ? 'bg-emerald-500 text-black' : 'bg-white/5 border border-white/10'
            }`}
          >
            {morningWalkDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>

        {/* Evening Walk */}
        <button
          onClick={() => handleClick('Evening 5k Walk')}
          className={`spring-btn p-3 rounded-xl border flex items-center justify-between gap-2 transition-all tap-target ${
            eveningWalkDone
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-[#0e131d] border-white/5 text-slate-300 hover:text-white'
          }`}
        >
          <span className="text-xs font-semibold">Evening 5k</span>
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              eveningWalkDone ? 'bg-emerald-500 text-black' : 'bg-white/5 border border-white/10'
            }`}
          >
            {eveningWalkDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>
      </div>
    </div>
  );
};
