import React, { useEffect, useRef } from 'react';
import {
  X,
  Moon,
  Droplets,
  ShieldCheck,
  BookOpen,
  Sun,
  AlertTriangle,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface ProtocolSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string;
}

export const ProtocolSidebar: React.FC<ProtocolSidebarProps> = ({
  isOpen,
  onClose,
  initialSection = 'sleep',
}) => {
  const [activeTab, setActiveTab] = React.useState<string>(initialSection);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(initialSection);
    }
  }, [initialSection]);

  // Trap Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        ref={containerRef}
        className="w-full max-w-md h-full bg-[#090d16] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slideLeft"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0c101a]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Protocol Science Guide</h2>
              <p className="text-[10px] text-slate-400 font-mono">Circadian & Behavioral Foundations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center tap-target transition-all"
            aria-label="Close Protocol Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pillar Tab Switcher */}
        <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-[#090d16] overflow-x-auto">
          {[
            { id: 'sleep', label: 'Sleep', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
            { id: 'hydration', label: 'Water', icon: <Droplets className="w-3.5 h-3.5 text-sky-400" /> },
            { id: 'keystones', label: 'Keystones', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
            { id: 'reading', label: 'Reading', icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all tap-target ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* SLEEP SECTION */}
          {activeTab === 'sleep' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider block font-bold">
                  Matthew Walker & Andrew Huberman
                </span>
                <p className="text-white text-xs font-semibold">
                  Circadian Sleep Architecture & Phase Alignment
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Why 7.5h – 8.5h is the Baseline Goal
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Human sleep cycles repeat every <strong>90 minutes</strong>, alternating between deep NREM (physical recovery and memory consolidation) and REM (emotional calibration and creative problem solving). 5 complete cycles require <strong>7.5 hours</strong>, plus roughly 30 minutes for natural sleep latency and brief micro-awakenings.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    What is Sleep Debt?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Sleep debt is the cumulative deficit below your 8.0h baseline. If you sleep 6.5h, you accumulate <strong>-1.5h of acute debt</strong>. Research shows sleep debt cannot be fully erased with a single weekend lie-in; chronic debt degrades prefrontal cortex working memory, blunts reaction time, and increases insulin resistance.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    What is a "Shifted Phase" (Circadian Delay)?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Even if you get 8 hours of sleep, going to bed extremely late (e.g. after 02:30 AM or daytime sleep) disrupts your circadian rhythm. Your body’s core temperature minimum (T_min) occurs ~2 hours before normal waking. Sleeping during daylight blunts growth hormone release by up to 50% and degrades REM architecture.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Morning Sunlight Anchor (10 min)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Getting 10 minutes of direct outdoor morning sunlight within 30 minutes of waking triggers melanopsin retinal ganglion cells. This directly resets the brain's suprachiasmatic nucleus (SCN) master clock, boosts morning dopamine and cortisol, and starts an automatic 14–16 hour countdown for evening melatonin release.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* HYDRATION SECTION */}
          {activeTab === 'hydration' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                <span className="text-[10px] font-mono text-sky-300 uppercase tracking-wider block font-bold">
                  Andrew Huberman Protocol
                </span>
                <p className="text-white text-xs font-semibold">
                  Fluid Dynamics & Cellular Osmotic Balance
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    Why 3.5 Liters per Day?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Your brain and neuromuscular junctions require consistent electrolyte and fluid turnover. Even mild dehydration of 1% to 2% causes a measurable 10–15% drop in focus, working memory, and physical power output.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    The 700ml Bottle Rhythm (5 Bottles = Goal)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Instead of guessing cup sizes, PulseSync is calibrated to your <strong>700ml bottle</strong>:
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-3 list-disc">
                    <li><strong>Bottle 1 (700ml)</strong>: Immediately upon waking with electrolytes.</li>
                    <li><strong>Bottle 2 (1,400ml)</strong>: Mid-morning deep focus bout.</li>
                    <li><strong>Bottle 3 (2,100ml)</strong>: Around lunch and physical training.</li>
                    <li><strong>Bottle 4 (2,800ml)</strong>: Mid-afternoon focus session.</li>
                    <li><strong>Bottle 5 (3,500ml)</strong>: Early evening (stop major fluid intake 2–3h before sleep to avoid nocturnal awakenings).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* KEYSTONES SECTION */}
          {activeTab === 'keystones' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider block font-bold">
                  James Clear & Atomic Habits
                </span>
                <p className="text-white text-xs font-semibold">
                  Keystone Discipline & Clean Day Matrix
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    What is a "Clean Day"?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    A Clean Day is achieved when all <strong>4 core keystone habits</strong> are completed:
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-3 list-disc">
                    <li><strong>Clean Nutrition</strong>: Whole foods, avoiding refined sugars and inflammatory crashes.</li>
                    <li><strong>Zero Doomscrolling</strong>: No algorithmic short-form feeds (Reels, TikTok, Shorts) that deplete dopamine reserves.</li>
                    <li><strong>Daily Supplements</strong>: Essential micronutrients and daily electrolyte replenishment.</li>
                    <li><strong>Bed Made Upon Waking</strong>: Immediate physical agency and environmental order.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Streak Milestones & Tiers Explained
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Streaks reflect unbroken consecutive Clean Days:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 pt-1 font-mono text-[10px]">
                    <div className="p-1.5 rounded bg-white/5 flex justify-between">
                      <span className="text-slate-300 font-bold">Calibrated (0–6d)</span>
                      <span className="text-slate-500">Establishing initial habit friction</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 flex justify-between">
                      <span className="text-sky-300 font-bold">Disciplined (7–13d)</span>
                      <span className="text-slate-500">1-week consistency breakthrough</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 flex justify-between">
                      <span className="text-emerald-300 font-bold">Fortified (14–29d)</span>
                      <span className="text-slate-500">2 weeks of automatic behavior</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 flex justify-between">
                      <span className="text-purple-300 font-bold">Unbreakable (30–89d)</span>
                      <span className="text-slate-500">1 full month of steel discipline</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 flex justify-between">
                      <span className="text-amber-300 font-bold">Sovereign (90d+)</span>
                      <span className="text-slate-500">Complete identity transformation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* READING SECTION */}
          {activeTab === 'reading' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider block font-bold">
                  Deliberate Practice
                </span>
                <p className="text-white text-xs font-semibold">
                  Technical Mastery & Deep Reading Sprints
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Why 20–30 Minute Sprints?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Unlike shallow scanning, reading foundational engineering, systems design, or scientific literature demands continuous working memory. A dedicated <strong>20m or 30m sprint</strong> without notifications builds deep conceptual synthesis and compound domain mastery.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c101a] border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Custom Sprint Presets
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Use the preset pills (<strong>15m, 20m, 30m, 45m</strong>) or fine-tune by +/-5m to fit your daily schedule. Reading progress and pages are automatically tracked into your Day Ledger.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
