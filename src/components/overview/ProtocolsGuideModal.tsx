import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, Brain, Dumbbell, Moon } from 'lucide-react';
import { triggerHaptic } from '../../hooks/useHaptics';

interface ProtocolsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolsGuideModal: React.FC<ProtocolsGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'recomp' | 'circadian'>('study');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="matte-card w-full max-w-lg max-h-[85vh] bg-[#0c101a] border border-white/15 p-4 sm:p-5 flex flex-col shadow-2xl animate-modalSpring"
        role="dialog"
        aria-modal="true"
        aria-labelledby="protocols-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="protocols-modal-title" className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                PulseSync Protocols & Field Guide
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Science-backed protocols for interview prep & body recomposition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors tap-target"
            aria-label="Close protocols guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-black/40 rounded-xl border border-white/10 gap-1 text-xs font-mono my-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveTab('study');
            }}
            className={`py-2 px-2 rounded-lg font-bold transition-all tap-target flex items-center justify-center gap-1.5 ${
              activeTab === 'study'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Interview Rx</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveTab('recomp');
            }}
            className={`py-2 px-2 rounded-lg font-bold transition-all tap-target flex items-center justify-center gap-1.5 ${
              activeTab === 'recomp'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Recomp Volume</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveTab('circadian');
            }}
            className={`py-2 px-2 rounded-lg font-bold transition-all tap-target flex items-center justify-center gap-1.5 ${
              activeTab === 'circadian'
                ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Circadian Sleep</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs text-slate-300 leading-relaxed font-mono">
          {/* TAB 1: INTERVIEW STUDY ROUTINE */}
          {activeTab === 'study' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4" />
                  The 50/10 Cognitive Micro-Dosing Rhythm
                </span>
                <p className="text-[11px] text-purple-200/90 leading-normal">
                  Studying algorithms for 6 unbroken hours causes mental fatigue and poor retention. 
                  Replacing passive screen breaks with brief physical micro-sets primes neuroplasticity without central nervous system burnout.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Daily Structure:</h4>
                <ul className="space-y-2 text-[11px]">
                  <li className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2">
                    <span className="text-purple-400 font-bold">01.</span>
                    <div>
                      <strong className="text-white block">50m Deep Focus Block</strong>
                      <span>LeetCode / System Design problem solving with zero phone distraction.</span>
                    </div>
                  </li>
                  <li className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2">
                    <span className="text-purple-400 font-bold">02.</span>
                    <div>
                      <strong className="text-emerald-400 block">5m Micro-Workout Dose</strong>
                      <span>1 set of 4–5 Half Pull-ups or 15 Push-ups or 10 Squats. Releases BDNF and clears mental fatigue without joint soreness.</span>
                    </div>
                  </li>
                  <li className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2">
                    <span className="text-purple-400 font-bold">03.</span>
                    <div>
                      <strong className="text-sky-300 block">Active Recovery Walks</strong>
                      <span>Morning 4km walk + Evening 4km walk (~8,000 steps total). Aerobic steady-state oxygenates brain tissue and consolidates learned concepts.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: HYPERTROPHY & RECOMP BLUEPRINT */}
          {activeTab === 'recomp' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  Two-Tier Volume System (Schoenfeld & Phillips Guidelines)
                </span>
                <p className="text-[11px] text-amber-200/90 leading-normal">
                  You do not need 2-hour marathon gym sessions. Spreading 8–12 weekly sets per muscle group keeps Muscle Protein Synthesis (MPS) elevated 24/7 while preserving cognitive reserves for interviews.
                </p>
              </div>

              {/* Benchmark Table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="py-2 px-2.5">Exercise</th>
                      <th className="py-2 px-2.5">Tier 1 (MED)</th>
                      <th className="py-2 px-2.5">Tier 2 (Recomp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-2 px-2.5 font-bold text-white">Half Pull-ups</td>
                      <td className="py-2 px-2.5 text-slate-400">50 reps/wk</td>
                      <td className="py-2 px-2.5 text-amber-300 font-semibold">100–120 reps/wk</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-bold text-white">Push-ups</td>
                      <td className="py-2 px-2.5 text-slate-400">150 reps/wk</td>
                      <td className="py-2 px-2.5 text-amber-300 font-semibold">250–350 reps/wk</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-bold text-white">Barbell Squats</td>
                      <td className="py-2 px-2.5 text-slate-400">40 reps (1.2k kg)</td>
                      <td className="py-2 px-2.5 text-amber-300 font-semibold">70–90 reps (2.4k kg)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-bold text-white">Overhead Press</td>
                      <td className="py-2 px-2.5 text-slate-400">40 reps (1.2k kg)</td>
                      <td className="py-2 px-2.5 text-amber-300 font-semibold">60–80 reps (2.1k kg)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-bold text-white">Bent Rows</td>
                      <td className="py-2 px-2.5 text-slate-400">40 reps (1.2k kg)</td>
                      <td className="py-2 px-2.5 text-amber-300 font-semibold">70–90 reps (2.4k kg)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-bold text-white">RDLs / Deadlifts</td>
                      <td className="py-2 px-2.5 text-slate-400">30 reps (900 kg)</td>
                      <td className="py-2 px-2.5 text-amber-300 font-semibold">50–60 reps (1.5k kg)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                *Nutrition rule for Recomp: Consume 1.6–2.0g protein/kg body weight daily. Stay at a slight 200–300 kcal deficit while walking 8k steps daily.
              </p>
            </div>
          )}

          {/* TAB 3: CIRCADIAN SLEEP PROTOCOL */}
          {activeTab === 'circadian' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4" />
                  The Circadian Reset Protocol (Dr. Satchin Panda)
                </span>
                <p className="text-[11px] text-indigo-200/90 leading-normal">
                  Sleeping 8 hours from 6:00 AM to 2:00 PM suppresses human growth hormone (70% released between 10 PM and 2 AM) and desynchronizes liver clocks, promoting visceral fat storage.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">How to Pull Sleep Back to 11:00 PM:</h4>
                <ul className="space-y-2 text-[11px]">
                  <li className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <strong className="text-emerald-400 block mb-0.5">1. Shift Bedtime by 45 Mins / Day</strong>
                    <span>Do not attempt an instant 7-hour jump. If sleeping at 6 AM, shift to 5:15 AM → 4:30 AM → 3:45 AM → 3:00 AM.</span>
                  </li>
                  <li className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <strong className="text-amber-400 block mb-0.5">2. Anchor With Morning Light</strong>
                    <span>View 10–15 minutes of outdoor sunlight within 30 minutes of waking. This sets the suprachiasmatic nucleus (SCN) circadian timer for melatonin release 14 hours later.</span>
                  </li>
                  <li className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <strong className="text-sky-300 block mb-0.5">3. 10-Hour Eating Window (TRE)</strong>
                    <span>Stop eating all calories 3 hours before your target bedtime. Digesting late-night meals halts deep slow-wave repair.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="spring-btn px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs tap-target transition-all"
          >
            Understood
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
