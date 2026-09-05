import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { DetoxState } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface DetoxCardProps {
  detox: DetoxState;
  onUpdateDetox: (detox: DetoxState) => void;
}

export const DetoxCard: React.FC<DetoxCardProps> = ({ detox, onUpdateDetox }) => {
  const toggleItem = (key: keyof Pick<DetoxState, 'morningPhoneFree' | 'zeroReels' | 'noPhoneInBed'>) => {
    triggerHaptic(15);
    onUpdateDetox({
      ...detox,
      [key]: !detox[key],
    });
  };

  return (
    <div className="matte-card p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">Digital Detox & Dopamine</h3>
        </div>
        <span className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
          {detox.cleanDays} Days Clean ({detox.tierName})
        </span>
      </div>

      <div className="space-y-2">
        {/* Morning Phone Free */}
        <div
          onClick={() => toggleItem('morningPhoneFree')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            detox.morningPhoneFree
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-[#0c1017] border-white/5 hover:border-white/10 text-slate-300'
          }`}
        >
          <span className="text-xs font-semibold">Morning Phone-Free (First 60 Minutes)</span>
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              detox.morningPhoneFree ? 'bg-emerald-400 text-black' : 'bg-white/5 border border-white/10'
            }`}
          >
            {detox.morningPhoneFree && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>

        {/* Zero Reels */}
        <div
          onClick={() => toggleItem('zeroReels')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            detox.zeroReels
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-[#0c1017] border-white/5 hover:border-white/10 text-slate-300'
          }`}
        >
          <span className="text-xs font-semibold">Zero Reels & Short-Form Dopamine Scrolling</span>
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              detox.zeroReels ? 'bg-emerald-400 text-black' : 'bg-white/5 border border-white/10'
            }`}
          >
            {detox.zeroReels && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>

        {/* No Phone In Bed */}
        <div
          onClick={() => toggleItem('noPhoneInBed')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            detox.noPhoneInBed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-[#0c1017] border-white/5 hover:border-white/10 text-slate-300'
          }`}
        >
          <span className="text-xs font-semibold">No Phone in Bedroom 30m Prior to Sleep</span>
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              detox.noPhoneInBed ? 'bg-emerald-400 text-black' : 'bg-white/5 border border-white/10'
            }`}
          >
            {detox.noPhoneInBed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      </div>
    </div>
  );
};
