import React, { useState, useRef } from 'react';
import { WorkoutLog } from '../../types';
import { getTodayDateStr } from '../../services/storage';
import { triggerHaptic } from '../../hooks/useHaptics';
import { TrendingUp, ChevronDown, Layers } from 'lucide-react';
import { EXERCISE_BENCHMARKS } from './WeeklyRebalanceCard';

interface VolumeProgressionChartProps {
  workouts: WorkoutLog[];
  timeframe?: 7 | 14 | 30 | 90;
}

export const VolumeProgressionChart: React.FC<VolumeProgressionChartProps> = ({
  workouts,
  timeframe = 7,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [activeMetric, setActiveMetric] = useState<'both' | 'steps' | 'tonnage'>('both');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const todayStr = getTodayDateStr();

  // Find benchmark definition if a specific exercise is selected
  const activeBenchmark = EXERCISE_BENCHMARKS.find(
    (b) => b.id === selectedExercise || b.name === selectedExercise || b.barbellLift === selectedExercise
  );

  // Determine whether to use Daily resolution or Adaptive Weekly Bucketing
  // <= 21 days: Daily (7 or 14 points)
  // > 21 days: Weekly (e.g. 5 weeks for 30D, 13 weeks for 90D)
  const isWeeklyBucketed = timeframe > 21;
  const numBuckets = isWeeklyBucketed ? Math.ceil(timeframe / 7) : timeframe;

  // Generate historical data points (either daily or weekly buckets)
  const points = Array.from({ length: numBuckets }).map((_, idx) => {
    if (!isWeeklyBucketed) {
      // 1. Daily Point
      const daysAgo = timeframe - 1 - idx;
      const [y, m, d] = todayStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      dateObj.setDate(dateObj.getDate() - daysAgo);

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const dayWorkouts = workouts.filter((w) =>
        dateStr === todayStr ? !w.dateStr || w.dateStr === dateStr : w.dateStr === dateStr
      );

      const steps = dayWorkouts.reduce((acc, w) => acc + (w.steps || 0), 0);
      const totalTonnage = dayWorkouts
        .filter((w) => w.category === 'barbell')
        .reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

      let exerciseReps = 0;
      let exerciseVolume = 0;

      if (activeBenchmark) {
        if (activeBenchmark.category === 'pullup') {
          exerciseReps = dayWorkouts
            .filter((w) => w.category === 'pullup')
            .reduce((sum, w) => sum + (w.reps || 0), 0);
        } else if (activeBenchmark.category === 'pushup') {
          exerciseReps = dayWorkouts
            .filter((w) => w.category === 'pushup')
            .reduce((sum, w) => sum + (w.reps || 0), 0);
        } else if (activeBenchmark.category === 'barbell') {
          const matches = dayWorkouts.filter(
            (w) =>
              w.category === 'barbell' &&
              w.name.includes(activeBenchmark.barbellLift || '')
          );
          exerciseReps = matches.reduce((sum, w) => sum + (w.reps || 0), 0);
          exerciseVolume = matches.reduce((sum, w) => sum + (w.reps || 0) * (w.weightKg || 30), 0);
        }
      }

      return {
        id: dateStr,
        dateStr,
        label,
        fullDate,
        steps,
        tonnage: totalTonnage,
        exerciseReps,
        exerciseVolume,
        sets: dayWorkouts.length,
      };
    } else {
      // 2. Weekly Bucket (Monday to Sunday or 7-day rolling window)
      const weeksAgo = numBuckets - 1 - idx;
      const [y, m, d] = todayStr.split('-').map(Number);
      
      const endDateObj = new Date(y, m - 1, d);
      endDateObj.setDate(endDateObj.getDate() - weeksAgo * 7);
      
      const startDateObj = new Date(endDateObj);
      startDateObj.setDate(startDateObj.getDate() - 6);

      const label = `W${idx + 1}`;
      const fullDate = `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      // Collect all workouts within this 7-day bucket
      const bucketWorkouts = workouts.filter((w) => {
        if (!w.dateStr) return false;
        const [wy, wm, wd] = w.dateStr.split('-').map(Number);
        const wDate = new Date(wy, wm - 1, wd);
        return wDate >= startDateObj && wDate <= endDateObj;
      });

      const steps = bucketWorkouts.reduce((acc, w) => acc + (w.steps || 0), 0);
      const totalTonnage = bucketWorkouts
        .filter((w) => w.category === 'barbell')
        .reduce((acc, w) => acc + (w.reps || 0) * (w.weightKg || 30), 0);

      let exerciseReps = 0;
      let exerciseVolume = 0;

      if (activeBenchmark) {
        if (activeBenchmark.category === 'pullup') {
          exerciseReps = bucketWorkouts
            .filter((w) => w.category === 'pullup')
            .reduce((sum, w) => sum + (w.reps || 0), 0);
        } else if (activeBenchmark.category === 'pushup') {
          exerciseReps = bucketWorkouts
            .filter((w) => w.category === 'pushup')
            .reduce((sum, w) => sum + (w.reps || 0), 0);
        } else if (activeBenchmark.category === 'barbell') {
          const matches = bucketWorkouts.filter(
            (w) =>
              w.category === 'barbell' &&
              w.name.includes(activeBenchmark.barbellLift || '')
          );
          exerciseReps = matches.reduce((sum, w) => sum + (w.reps || 0), 0);
          exerciseVolume = matches.reduce((sum, w) => sum + (w.reps || 0) * (w.weightKg || 30), 0);
        }
      }

      return {
        id: `week-${idx}`,
        dateStr: `week-${idx}`,
        label,
        fullDate,
        steps,
        tonnage: totalTonnage,
        exerciseReps,
        exerciseVolume,
        sets: bucketWorkouts.length,
      };
    }
  });

  // Calculate current period totals for active benchmark
  const currentPeriodReps = points.reduce((acc, p) => acc + p.exerciseReps, 0);
  const currentPeriodVolume = points.reduce((acc, p) => acc + p.exerciseVolume, 0);

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 24;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    return paddingLeft + (idx / Math.max(1, points.length - 1)) * chartWidth;
  };

  // Max values for scale
  const isExerciseMode = selectedExercise !== 'all' && Boolean(activeBenchmark);

  const maxSteps = Math.max(isWeeklyBucketed ? 40000 : 8000, ...points.map((p) => p.steps)) * 1.15;
  const maxTonnage = Math.max(isWeeklyBucketed ? 5000 : 900, ...points.map((p) => p.tonnage)) * 1.15;
  const maxExerciseReps = Math.max(isWeeklyBucketed ? 80 : 15, ...points.map((p) => p.exerciseReps)) * 1.2;

  const getYSteps = (steps: number) => {
    const ratio = Math.min(1, steps / maxSteps);
    return paddingTop + chartHeight * (1 - ratio);
  };

  const getYTonnage = (tonnage: number) => {
    const ratio = Math.min(1, tonnage / maxTonnage);
    return paddingTop + chartHeight * (1 - ratio);
  };

  const getYExercise = (reps: number) => {
    const ratio = Math.min(1, reps / maxExerciseReps);
    return paddingTop + chartHeight * (1 - ratio);
  };

  // SVG paths
  const stepsPath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getYSteps(p.steps).toFixed(1)}`)
    .join(' ');

  const stepsArea = `${stepsPath} L ${getX(points.length - 1)} ${paddingTop + chartHeight} L ${getX(
    0
  )} ${paddingTop + chartHeight} Z`;

  const tonnagePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getYTonnage(p.tonnage).toFixed(1)}`)
    .join(' ');

  const tonnageArea = `${tonnagePath} L ${getX(points.length - 1)} ${paddingTop + chartHeight} L ${getX(
    0
  )} ${paddingTop + chartHeight} Z`;

  const exercisePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getYExercise(p.exerciseReps).toFixed(1)}`)
    .join(' ');

  const exerciseArea = `${exercisePath} L ${getX(points.length - 1)} ${paddingTop + chartHeight} L ${getX(
    0
  )} ${paddingTop + chartHeight} Z`;

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  const handleTouchScrub = (clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const scale = svgWidth / rect.width;
    const svgX = relX * scale;
    const clampedX = Math.max(paddingLeft, Math.min(svgWidth - paddingRight, svgX));
    const fraction = (clampedX - paddingLeft) / chartWidth;
    const nearestIdx = Math.round(fraction * (points.length - 1));
    const boundedIdx = Math.max(0, Math.min(points.length - 1, nearestIdx));

    if (boundedIdx !== hoveredIdx) {
      setHoveredIdx(boundedIdx);
      triggerHaptic(5);
    }
  };

  return (
    <div className="matte-card p-4 space-y-3.5 border-white/10 bg-[#0c101a] shadow-lg">
      {/* Header & Metric Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Volume & Progression Telemetry
            </h3>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pt-0.5">
              <Layers className="w-3 h-3 text-sky-400" />
              <span>
                {isWeeklyBucketed
                  ? `Weekly Bucketing (${numBuckets} Weeks)`
                  : `Daily Resolution (${timeframe} Days)`}
              </span>
            </p>
          </div>
        </div>

        {/* Exercise Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedExercise}
              onChange={(e) => {
                triggerHaptic(10);
                setSelectedExercise(e.target.value);
              }}
              className="appearance-none bg-[#141b27] border border-white/10 text-slate-200 text-xs font-mono font-bold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:border-sky-500/50 cursor-pointer min-h-[36px] tap-target"
              aria-label="Filter chart by exercise"
            >
              <option value="all">All Lifts</option>
              {EXERCISE_BENCHMARKS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Metric Filter Chips (Only shown in 'all' mode) */}
          {!isExerciseMode && (
            <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-0.5">
              {(['all', 'steps', 'tonnage'] as const).map((m) => {
                const metricKey = m === 'all' ? 'both' : m;
                const isSelected = activeMetric === metricKey;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveMetric(metricKey);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all min-h-[30px] tap-target ${
                      isSelected
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m === 'all' ? 'All' : m === 'steps' ? 'Steps' : 'Tonnage'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Target Context Card */}
      {isExerciseMode && activeBenchmark && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs font-mono animate-fadeIn">
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 block">{activeBenchmark.name} Target Context</span>
            <p className="text-[11px] text-amber-200/80">
              Horizon Total: <strong className="text-white">{currentPeriodReps} reps</strong>
              {activeBenchmark.category === 'barbell' && ` • ${currentPeriodVolume.toLocaleString()} kg volume`}
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[9px] text-slate-400 block">Weekly MED</span>
              <span className="font-bold text-sky-300">{activeBenchmark.tier1MEDReps}</span>
            </div>
            <div>
              <span className="text-[9px] text-amber-300/80 block font-semibold">Weekly Recomp</span>
              <span className="font-bold text-amber-400">{activeBenchmark.tier2RecompReps}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reactive Touch HUD (Only visible on hover/touch) */}
      {hoveredPoint && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-sky-400/30 text-xs font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{hoveredPoint.fullDate}</span>
            <span className="text-slate-400">({hoveredPoint.sets} sets)</span>
          </div>

          <div className="flex items-center gap-3">
            {isExerciseMode ? (
              <span className="text-amber-400 font-bold">
                ● {hoveredPoint.exerciseReps} reps
                {activeBenchmark?.category === 'barbell' && ` (${hoveredPoint.exerciseVolume.toLocaleString()} kg)`}
              </span>
            ) : (
              <>
                {(activeMetric === 'both' || activeMetric === 'steps') && (
                  <span className="text-emerald-400 font-bold">
                    ● {hoveredPoint.steps.toLocaleString()} steps
                  </span>
                )}
                {(activeMetric === 'both' || activeMetric === 'tonnage') && (
                  <span className="text-amber-400 font-bold">
                    ● {hoveredPoint.tonnage.toLocaleString()} kg
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Responsive SVG Chart with Touch/Mouse Scrubbing */}
      <div className="relative overflow-hidden rounded-xl bg-[#080b12] border border-white/5 p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none touch-none cursor-crosshair"
          role="img"
          aria-label="Volume & Progression Chart"
          onTouchStart={(e) => {
            if (e.touches.length > 0) handleTouchScrub(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) handleTouchScrub(e.touches[0].clientX);
          }}
          onMouseMove={(e) => handleTouchScrub(e.clientX)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Steps Gradient */}
            <linearGradient id="chartStepsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>

            {/* Tonnage / Exercise Gradient */}
            <linearGradient id="chartTonnageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Lines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = paddingTop + chartHeight * ratio;
            return (
              <line
                key={ratio}
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Vertical Tracking Crosshair Line */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingTop}
              x2={getX(hoveredIdx)}
              y2={svgHeight - paddingBottom}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity="0.8"
            />
          )}

          {/* EXERCISE MODE CURVE */}
          {isExerciseMode ? (
            <>
              <path d={exerciseArea} fill="url(#chartTonnageGrad)" />
              <path
                d={exercisePath}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, idx) => {
                const x = getX(idx);
                const y = getYExercise(p.exerciseReps);
                const isHovered = hoveredIdx === idx;
                return (
                  <circle
                    key={p.id}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={isHovered ? '#ffffff' : '#fbbf24'}
                    stroke="#080b12"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                );
              })}
            </>
          ) : (
            /* COMBINED MODE CURVES */
            <>
              {/* Steps Area & Line */}
              {(activeMetric === 'both' || activeMetric === 'steps') && (
                <>
                  <path d={stepsArea} fill="url(#chartStepsGrad)" />
                  <path
                    d={stepsPath}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, idx) => {
                    const x = getX(idx);
                    const y = getYSteps(p.steps);
                    const isHovered = hoveredIdx === idx;
                    return (
                      <circle
                        key={`step-${p.id}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 4.5 : 2.5}
                        fill={isHovered ? '#ffffff' : '#34d399'}
                        stroke="#080b12"
                        strokeWidth="1"
                      />
                    );
                  })}
                </>
              )}

              {/* Tonnage Area & Line */}
              {(activeMetric === 'both' || activeMetric === 'tonnage') && (
                <>
                  <path d={tonnageArea} fill="url(#chartTonnageGrad)" />
                  <path
                    d={tonnagePath}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, idx) => {
                    const x = getX(idx);
                    const y = getYTonnage(p.tonnage);
                    const isHovered = hoveredIdx === idx;
                    return (
                      <circle
                        key={`tonnage-${p.id}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 4.5 : 2.5}
                        fill={isHovered ? '#ffffff' : '#fbbf24'}
                        stroke="#080b12"
                        strokeWidth="1"
                      />
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* Invisible Touch Column Targets */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const colWidth = chartWidth / Math.max(1, points.length - 1);
            return (
              <rect
                key={`hit-${p.id}`}
                x={x - colWidth / 2}
                y={paddingTop}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredIdx(idx);
                  triggerHaptic(5);
                }}
              />
            );
          })}

          {/* X-Axis Date/Week Labels */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIdx === idx;

            // Granularity skips if too dense
            if (timeframe === 90 && idx % 2 !== 0 && idx !== points.length - 1) return null;

            return (
              <text
                key={`lbl-${p.id}`}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                fontSize="8"
                fontFamily="monospace"
                fill={isHovered ? '#ffffff' : '#64748b'}
                fontWeight={isHovered ? 'bold' : 'normal'}
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          {isExerciseMode ? (
            <div className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{activeBenchmark?.name} Reps</span>
            </div>
          ) : (
            <>
              {(activeMetric === 'both' || activeMetric === 'steps') && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Cardio Steps</span>
                </div>
              )}
              {(activeMetric === 'both' || activeMetric === 'tonnage') && (
                <div className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Volume Tonnage (kg)</span>
                </div>
              )}
            </>
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {isWeeklyBucketed ? `${timeframe}D (${numBuckets} Wks)` : `${timeframe}D Horizon`}
        </span>
      </div>
    </div>
  );
};
